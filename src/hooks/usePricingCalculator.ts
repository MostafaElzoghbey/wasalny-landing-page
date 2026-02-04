import { useState, useMemo, useEffect } from 'react';
import {
  routes,
  vehiclePricing,
  pricingConfig,
  type VehicleCategory,
  isValidBookingDate,
} from '../data/pricing';
import {
  calculatePrice,
  generateWhatsAppMessage,
  getFromLocations,
  getToLocations,
  getRoute,
  type PriceCalculationResult,
} from '../utils/pricingCalculator';
import { additionalServices, discountRules } from '../data/pricing';

export function usePricingCalculator() {
  // --- State ---
  const [fromLocation, setFromLocation] = useState<string>('damietta-city');
  const [toLocation, setToLocation] = useState<string>('');
  
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('sedan');
  const [passengerCount, setPassengerCountState] = useState<number>(2);
  
  // Initialize with smart defaults (Tomorrow, 10:00 AM)
  const [tripDate, setTripDateState] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [tripTime, setTripTimeState] = useState<string>('10:00');
  
  const [isRoundTrip, setIsRoundTripState] = useState<boolean>(false);
  const [returnDate, setReturnDateState] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('');
  

  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Wrappers to handle smart logic
  const setTripDate = (date: string) => setTripDateState(date);
  const setTripTime = (time: string) => setTripTimeState(time);
  const setReturnDate = (date: string) => setReturnDateState(date);

  const setIsRoundTrip = (value: boolean) => {
    setIsRoundTripState(value);
    if (value && !returnDate) {
      // Auto-set return date to trip date (default to same day)
      // Per user request logic for smart defaults
      if (tripDate) {
         setReturnDateState(tripDate);
         setReturnTime(tripTime);
      }
    }
  };

  const setPassengerCount = (count: number) => {
    setPassengerCountState(count);
    // Smart Vehicle Switch
    // We need to access the vehiclePricing data to compare maxPassengers
    // This requires vehiclePricing to be imported as data, not just type.
    // Assuming valid import at top of file, find current vehicle logic:
    const currentVehicle = vehiclePricing.find(v => v.category === vehicleCategory);
    if (currentVehicle && count > currentVehicle.maxPassengers) {
      const suitableVehicle = vehiclePricing.find(v => v.maxPassengers >= count);
      if (suitableVehicle) {
        setVehicleCategory(suitableVehicle.category);
      }
    }
  };
  
  // --- Derived State ---
  
  // Available "To" locations based on "From"
  const availableToLocations = useMemo(() => {
    return getToLocations(routes, fromLocation);
  }, [fromLocation]);
  
  const availableFromLocations = useMemo(() => {
    return getFromLocations(routes);
  }, []);

  // Reset "To" location if it becomes invalid when "From" changes
  useEffect(() => {
    if (toLocation && !availableToLocations.has(toLocation)) {
      setToLocation('');
    }
  }, [fromLocation, availableToLocations, toLocation]);

  // Current Route Object
  const currentRoute = useMemo(() => {
    return getRoute(fromLocation, toLocation);
  }, [fromLocation, toLocation]);

  // Calculations
  const calculationResult = useMemo<PriceCalculationResult | null>(() => {
    if (!currentRoute) return null;

    try {
      return calculatePrice(
        {
          route: currentRoute,
          vehicleCategory,
          passengerCount,
          tripDate: new Date(tripDate), // Convert string to Date
          tripTime,
          isRoundTrip,
          returnDate: isRoundTrip && returnDate ? new Date(returnDate) : undefined, // Convert string to Date
          returnTime: isRoundTrip ? returnTime : undefined,

          additionalServices: selectedServices,
        },
        additionalServices,
        discountRules
      );
    } catch (error) {
      console.error("Calculation error:", error);
      return null;
    }
  }, [
    currentRoute,
    vehicleCategory,
    passengerCount,
    tripDate,
    tripTime,
    isRoundTrip,
    returnDate,
    returnTime,

    selectedServices,
  ]);

  // Validation
  const validationErrors = useMemo<string[]>(() => {
    const errors: string[] = [];
    
    // Route validation
    if (!fromLocation) errors.push('يرجى اختيار مكان الانطلاق');
    else if (!toLocation) errors.push('يرجى اختيار الوجهة');
    
    // Date validation
    const dateObj = new Date(tripDate);
    const dateValidation = isValidBookingDate(dateObj);
    if (!dateValidation.valid && dateValidation.reason) {
      errors.push(dateValidation.reason);
    }

    // Return date validation
    if (isRoundTrip) {
      if (!returnDate) {
        errors.push('يرجى تحديد موعد العودة');
      } else {
         const returnDateObj = new Date(returnDate);
         if (returnDateObj < dateObj) {
           errors.push('موعد العودة لا يمكن أن يكون قبل موعد الذهاب');
         } else if (
           returnDate === tripDate && 
           returnTime && tripTime
         ) {
           // Simple time check if on same day
           const [tripH, tripM] = tripTime.split(':').map(Number);
           const [retH, retM] = returnTime.split(':').map(Number);
           
           const tripTotalMinutes = tripH * 60 + tripM;
           const retTotalMinutes = retH * 60 + retM;
           const minDiffMinutes = pricingConfig.roundTripReturnMinHours * 60;

           if (retTotalMinutes <= tripTotalMinutes + minDiffMinutes) {
              errors.push(`يجب أن يكون الفرق بين الذهاب والعودة ${pricingConfig.roundTripReturnMinHours} ساعة على الأقل`);
           }
        }
      }
    }

    return errors;
  }, [fromLocation, toLocation, tripDate, isRoundTrip, returnDate, tripTime, returnTime]);

  // --- Persistence ---
  
  // Load initial state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wasalny_pricing_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fromLocation) setFromLocation(parsed.fromLocation);
        if (parsed.toLocation) setToLocation(parsed.toLocation);
        if (parsed.vehicleCategory) setVehicleCategory(parsed.vehicleCategory);
        if (parsed.passengerCount) setPassengerCount(parsed.passengerCount);
        if (parsed.isRoundTrip !== undefined) setIsRoundTrip(parsed.isRoundTrip);
        // Dates are tricky to restore perfectly without complex logic, so we skip them for now
        // or just restore them if they are in the future.
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
  }, []);

  // Save state
  useEffect(() => {
    const stateToSave = {
      fromLocation,
      toLocation,
      vehicleCategory,
      passengerCount,
      isRoundTrip,
    };
    localStorage.setItem('wasalny_pricing_v1', JSON.stringify(stateToSave));
  }, [fromLocation, toLocation, vehicleCategory, passengerCount, isRoundTrip]);

  // WhatsApp Link
  const whatsappLink = useMemo(() => {
    if (!calculationResult) return '';
    const message = generateWhatsAppMessage(calculationResult);
    return `https://wa.me/${pricingConfig.whatsappNumber}?text=${message}`;
  }, [calculationResult]);

  // --- Handlers ---
  
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return {
    state: {
      fromLocation,
      toLocation,
      vehicleCategory,
      passengerCount,
      // Convert strings back to Dates for components that expect Date objects
      tripDate: new Date(tripDate),
      setTripDate,
      tripTime,
      setTripTime,
      isRoundTrip,
      setIsRoundTrip,
      returnDate: returnDate ? new Date(returnDate) : undefined,
      setReturnDate,
      setReturnTime,
      returnTime,
      selectedServices,
    },
    actions: {
      setFromLocation,
      setToLocation,
      setVehicleCategory,
      setPassengerCount,
      setTripDate: (date: Date) => {
        if (isNaN(date.getTime())) return;
        const newTripDateStr = date.toISOString().split('T')[0];
        setTripDate(newTripDateStr);
        
        // Smart Logic: If return date exists and is BEFORE new trip date, auto-fix it
        // We compare strings (YYYY-MM-DD) which works lexicographically
        if (isRoundTrip && returnDate && returnDate < newTripDateStr) {
           setReturnDate(newTripDateStr);
           // Also reset time if needed? Keep it simple: just sync date.
        }
      },
      setTripTime: (time: string) => {
        setTripTime(time);
        // Smart Logic: If same day, ensure return time is valid
        if (isRoundTrip && returnDate === tripDate) {
            const [tripH, tripM] = time.split(':').map(Number);
            const [retH, retM] = returnTime.split(':').map(Number);
            if (retH * 60 + retM <= tripH * 60 + tripM) {
                // Return time is physically before trip time on same day
                // Auto-push return time by 2 hours
                const newRetMin = tripH * 60 + tripM + 120; // +2 hours
                const newH = Math.floor(newRetMin / 60) % 24;
                const newM = newRetMin % 60;
                setReturnTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
            }
        }
      },
      setIsRoundTrip,
      setReturnDate: (date: Date) => {
        if (!isNaN(date.getTime())) setReturnDate(date.toISOString().split('T')[0]);
      },
      setReturnTime,
      toggleService,
    },
    computed: {
      availableFromLocations,
      availableToLocations,
      currentRoute,
      calculationResult,
      validationErrors,
      isValid: validationErrors.length === 0 && !!currentRoute,
      whatsappLink,
    }
  };
}
