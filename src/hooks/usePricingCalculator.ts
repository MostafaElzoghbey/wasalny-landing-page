import { useState, useMemo, useEffect } from 'react';
import {
  type VehicleCategory,
  type RouteType,
  vehiclePricing,
  pricingConfig,
} from '../data/pricing';
import {
  calculatePrice,
  generateWhatsAppMessage,
  getFromLocations,
  getToLocations,
  detectRouteType,
  type PriceCalculationResult,
} from '../utils/pricingCalculator';

export function usePricingCalculator() {
  // --- State ---
  const [routeType, setRouteType] = useState<RouteType>('travel');
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('sedan');
  const [passengerCount, setPassengerCountState] = useState<number>(2);
  
  // Trip date/time (same day, no return selection)
  const [tripDate, setTripDateState] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tripTime, setTripTimeState] = useState<string>('10:00');
  
  // Round trip toggle (hidden for internal routes)
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  
  // --- Derived State ---
  
  // Available "From" locations based on route type
  const availableFromLocations = useMemo(() => {
    return getFromLocations(routeType);
  }, [routeType]);
  
  // Available "To" locations based on route type and selected "from"
  const availableToLocations = useMemo(() => {
    if (!fromLocation) return [];
    return getToLocations(routeType, fromLocation);
  }, [routeType, fromLocation]);

  // Reset selections when route type changes
  useEffect(() => {
    setFromLocation('');
    setToLocation('');
    setIsRoundTrip(false);
  }, [routeType]);

  // Reset "To" location if it becomes invalid when "From" changes
  useEffect(() => {
    if (toLocation && !availableToLocations.find(loc => loc.id === toLocation)) {
      setToLocation('');
    }
  }, [fromLocation, availableToLocations, toLocation]);

  // Auto-detect route type when both locations are selected
  useEffect(() => {
    if (fromLocation && toLocation) {
      const detected = detectRouteType(fromLocation, toLocation);
      if (detected && detected !== routeType) {
        setRouteType(detected);
      }
    }
  }, [fromLocation, toLocation, routeType]);

  // Calculations
  const calculationResult = useMemo<PriceCalculationResult | null>(() => {
    if (!fromLocation || !toLocation) return null;

    try {
      return calculatePrice({
        fromLocation,
        toLocation,
        vehicleCategory,
        passengerCount,
        tripDate: new Date(tripDate),
        tripTime,
        isRoundTrip: routeType === 'travel' ? isRoundTrip : false, // Force false for internal
      });
    } catch (error) {
      console.error("Calculation error:", error);
      return null;
    }
  }, [
    fromLocation,
    toLocation,
    vehicleCategory,
    passengerCount,
    tripDate,
    tripTime,
    isRoundTrip,
    routeType,
  ]);

  // Validation
  const validationErrors = useMemo<string[]>(() => {
    const errors: string[] = [];
    
    // Route validation
    if (!fromLocation) errors.push('يرجى اختيار مكان الانطلاق');
    else if (!toLocation) errors.push('يرجى اختيار الوجهة');
    
    // Passenger validation
    const vehicleInfo = vehiclePricing.find(v => v.category === vehicleCategory);
    if (vehicleInfo) {
      if (passengerCount > vehicleInfo.maxPassengers) {
        errors.push(`عدد الركاب يتجاوز السعة القصوى (${vehicleInfo.maxPassengers})`);
      }
      if (passengerCount < vehicleInfo.minPassengers) {
        errors.push(`الحد الأدنى لعدد الركاب هو ${vehicleInfo.minPassengers}`);
      }
    }

    return errors;
  }, [fromLocation, toLocation, passengerCount, vehicleCategory]);

  // --- Persistence ---
  
  // Load initial state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wasalny_pricing_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.routeType) setRouteType(parsed.routeType);
        if (parsed.vehicleCategory) setVehicleCategory(parsed.vehicleCategory);
        if (parsed.passengerCount) setPassengerCountState(parsed.passengerCount);
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
  }, []);

  // Save state
  useEffect(() => {
    const stateToSave = {
      routeType,
      vehicleCategory,
      passengerCount,
    };
    localStorage.setItem('wasalny_pricing_v2', JSON.stringify(stateToSave));
  }, [routeType, vehicleCategory, passengerCount]);

  // WhatsApp Link
  const whatsappLink = useMemo(() => {
    if (!calculationResult) return '';
    const message = generateWhatsAppMessage(calculationResult);
    return `https://wa.me/${pricingConfig.whatsappNumber}?text=${message}`;
  }, [calculationResult]);

  // --- Handlers ---
  
  const setPassengerCount = (count: number) => {
    setPassengerCountState(count);
    // Smart Vehicle Switch
    const currentVehicle = vehiclePricing.find(v => v.category === vehicleCategory);
    if (currentVehicle && count > currentVehicle.maxPassengers) {
      const suitableVehicle = vehiclePricing.find(v => v.maxPassengers >= count);
      if (suitableVehicle) {
        setVehicleCategory(suitableVehicle.category);
      }
    }
  };

  const setTripDate = (date: Date) => {
    if (isNaN(date.getTime())) return;
    setTripDateState(date.toISOString().split('T')[0]);
  };

  const setTripTime = (time: string) => {
    setTripTimeState(time);
  };

  return {
    state: {
      routeType,
      fromLocation,
      toLocation,
      vehicleCategory,
      passengerCount,
      tripDate: new Date(tripDate),
      tripTime,
      isRoundTrip,
    },
    actions: {
      setRouteType,
      setFromLocation,
      setToLocation,
      setVehicleCategory,
      setPassengerCount,
      setTripDate,
      setTripTime,
      setIsRoundTrip,
    },
    computed: {
      availableFromLocations,
      availableToLocations,
      calculationResult,
      validationErrors,
      isValid: validationErrors.length === 0 && !!calculationResult,
      whatsappLink,
      showRoundTripToggle: routeType === 'travel', // Hide for internal routes
    }
  };
}
