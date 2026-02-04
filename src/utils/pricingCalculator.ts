// src/utils/pricingCalculator.ts
import {
  type Route,
  type VehicleCategory,
  type AdditionalService,
  type DiscountRule,
  getTimeSlot,
  getDayType,
  getRoute,
  getVehiclePricing,
  pricingConfig,
} from '@/data/pricing';

export interface TripDetails {
  route: Route;
  vehicleCategory: VehicleCategory;
  passengerCount: number;
  tripDate: Date;
  tripTime: string; // HH:MM format
  isRoundTrip: boolean;
  returnDate?: Date;
  returnTime?: string;
  additionalServices: string[]; // Service IDs
}

export interface PriceBreakdown {
  basePrice: number; // For the first leg (or representative)
  vehicleMultiplier: number;
  vehiclePrice: number;
  timeMultiplier: number;
  timePrice: number;
  dayTypeMultiplier: number;
  dayTypePrice: number;
  extraPassengerPrice: number;
  additionalServicesPrice: number;
  
  // Trip Totals
  outboundTotal: number;
  returnTotal: number; // 0 if one way
  subtotal: number; // Gross Total (Out + Ret)
  
  discounts: Array<{
    rule: DiscountRule;
    amount: number;
  }>;
  totalDiscount: number;
  
  grandTotal: number;
}

export interface PriceCalculationResult {
  breakdown: PriceBreakdown;
  details: {
    routeNameAr: string;
    vehicleCategoryAr: string;
    passengerCount: number;
    tripDateTime: Date;
    timeSlotAr: string;
    dayTypeAr: string;
    isRoundTrip: boolean;
    returnDateTime?: Date;
    additionalServices: Array<{
      id: string;
      nameAr: string;
      price: number;
      quantity?: number; // Potential future
    }>;
  };
  warnings: string[];
}

/**
 * Main pricing calculation function
 */
export function calculatePrice(
  tripDetails: TripDetails,
  additionalServicesData: AdditionalService[],
  discountRulesData: DiscountRule[]
): PriceCalculationResult {
  const warnings: string[] = [];
  const {
    route,
    vehicleCategory,
    passengerCount,
    tripDate,
    tripTime,
    isRoundTrip,
    returnDate,
    returnTime,
    additionalServices: selectedServices,
  } = tripDetails;

  // Get vehicle pricing
  const vehiclePricingInfo = getVehiclePricing(vehicleCategory);
  if (!vehiclePricingInfo) {
    throw new Error('Vehicle category not found');
  }

  // Validate passenger count
  if (passengerCount > vehiclePricingInfo.maxPassengers) {
    warnings.push(
      `عدد الركاب يتجاوز السعة القصوى للسيارة (${vehiclePricingInfo.maxPassengers})`
    );
  }

  // --- Helper: Calculate Leg Price ---
  const calculateLeg = (date: Date, time: string) => {
    // Parse time
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);

    // Factors
    const timeSlot = getTimeSlot(hours);
    const dayType = getDayType(date);

    // Base Calculation
    const basePrice = route.basePriceEGP;
    const vehicleMultiplier = vehiclePricingInfo.baseMultiplier;
    const vehiclePrice = basePrice * vehicleMultiplier;
    const timePrice = vehiclePrice * timeSlot.multiplier;
    const dayTypePrice = timePrice * dayType.multiplier;

    // Extra Passenger Price (Applied per leg? Yes, strictly/fairly)
    let extraPassengerPrice = 0;
    const basePassengers = pricingConfig.basePassengers;
    if (
      passengerCount > basePassengers &&
      vehiclePricingInfo.pricePerExtraPassenger
    ) {
      const extraPassengers = passengerCount - basePassengers;
      extraPassengerPrice =
        extraPassengers * vehiclePricingInfo.pricePerExtraPassenger;
    }

    // Additional Services (Applied PER LEG)
    const selectedServiceObjects = additionalServicesData.filter((service) =>
      selectedServices.includes(service.id)
    );
    const additionalServicesPrice = selectedServiceObjects.reduce(
      (sum, service) => sum + service.priceEGP,
      0
    );

    const legTotal = dayTypePrice + extraPassengerPrice + additionalServicesPrice;

    return {
      dateTime,
      timeSlot,
      dayType,
      basePrice,
      vehicleMultiplier,
      vehiclePrice,
      timePrice,
      dayTypePrice,
      extraPassengerPrice,
      additionalServicesPrice,
      total: legTotal,
    };
  };

  // --- Calculate Outbound ---
  const outbound = calculateLeg(tripDate, tripTime);

  // --- Calculate Return (if applicable) ---
  let returnLeg = null;
  if (isRoundTrip && returnDate && returnTime) {
    returnLeg = calculateLeg(returnDate, returnTime);
  }

  // --- Gross Total ---
  const outboundTotal = outbound.total;
  const returnTotal = returnLeg ? returnLeg.total : 0;
  const subtotal = outboundTotal + returnTotal;

  // --- Discounts & Offers ---
  const applicableDiscounts: Array<{ rule: DiscountRule; amount: number }> = [];

  // Calculate days in advance
  const now = new Date();
  const daysInAdvance = Math.floor(
    (tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 2. Identify Valid Rules
  const validRules = discountRulesData.filter(rule => {
    const conditions = rule.conditions || {};
    
    // Condition Checks
    if (conditions.roundTrip && !isRoundTrip) return false;
    if (conditions.minPassengers && passengerCount < conditions.minPassengers) return false;
    if (conditions.advanceBookingDays && daysInAdvance < conditions.advanceBookingDays) return false;
    if (conditions.specificRoutes && !conditions.specificRoutes.includes(route.id)) return false;
    if (rule.validTo && now > rule.validTo) return false;
    if (rule.validFrom && now < rule.validFrom) return false;
    
    return true;
  });

  // 3. Apply Standard Stackable Rules
  validRules.forEach(rule => {
      // Apply rule
       const amount = rule.type === 'percentage'
            ? (subtotal * rule.value) / 100
            : rule.value;
       const finalAmount = rule.maxAmount ? Math.min(amount, rule.maxAmount) : amount;
       
       applicableDiscounts.push({ rule, amount: finalAmount });
  });

  const totalDiscount = applicableDiscounts.reduce(
    (sum, d) => sum + d.amount,
    0
  );

  const grandTotal = Math.max(0, subtotal - totalDiscount);

  // --- Build Result ---
  const breakdown: PriceBreakdown = {
    // Representative values (Outbound) for UI compatibility
    basePrice: outbound.basePrice,
    vehicleMultiplier: outbound.vehicleMultiplier,
    vehiclePrice: outbound.vehiclePrice,
    timeMultiplier: outbound.timeSlot.multiplier,
    timePrice: outbound.timePrice,
    dayTypeMultiplier: outbound.dayType.multiplier,
    dayTypePrice: outbound.dayTypePrice,
    extraPassengerPrice: outbound.extraPassengerPrice + (returnLeg?.extraPassengerPrice || 0),
    additionalServicesPrice: outbound.additionalServicesPrice + (returnLeg?.additionalServicesPrice || 0),
    
    outboundTotal,
    returnTotal,
    subtotal,
    
    discounts: applicableDiscounts,
    totalDiscount,
    grandTotal,
  };

  const details = {
    routeNameAr: route.nameAr,
    vehicleCategoryAr: vehiclePricingInfo.categoryAr,
    passengerCount,
    tripDateTime: outbound.dateTime,
    timeSlotAr: outbound.timeSlot.slotAr,
    dayTypeAr: outbound.dayType.typeAr,
    isRoundTrip,
    returnDateTime: returnLeg ? returnLeg.dateTime : undefined,
    additionalServices: selectedServices.map(id => {
       const s = additionalServicesData.find(s => s.id === id);
       return {
         id,
         nameAr: s?.nameAr || '',
         price: s?.priceEGP || 0
       };
    }),
  };

  return {
    breakdown,
    details,
    warnings,
  };
}

export { getRoute } from '@/data/pricing';

export function formatPrice(price: number): string {
  return `${Math.round(price)} ${pricingConfig.currencyAr}`;
}

export function generateWhatsAppMessage(
  result: PriceCalculationResult,
  customerName?: string
): string {
  const { details, breakdown } = result;
  
  let message = '🚗 *طلب حجز جديد - وصلني*\n\n';
  
  if (customerName) {
    message += `👤 *الاسم:* ${customerName}\n`;
  }
  
  message += `📍 *المسار:* ${details.routeNameAr}\n`;
  message += `🚙 *نوع السيارة:* ${details.vehicleCategoryAr}\n`;
  message += `👥 *عدد الركاب:* ${details.passengerCount}\n`;
  message += `📅 *موعد الذهاب:* ${details.tripDateTime.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })} - ${details.tripDateTime.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  })}\n`;

  if (details.isRoundTrip && details.returnDateTime) {
    message += `🔄 *موعد العودة:* ${details.returnDateTime.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} - ${details.returnDateTime.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    })}\n`;
  }

  if (details.additionalServices.length > 0) {
    message += `\n✨ *خدمات إضافية:*\n`;
    details.additionalServices.forEach((service) => {
      message += `   • ${service.nameAr}\n`;
    });
  }

  message += `\n💰 *السعر الإجمالي:* ${formatPrice(breakdown.grandTotal)}\n`;
  
  if (breakdown.discounts.length > 0) {
    message += `🎁 *الخصومات المطبقة:*\n`;
    breakdown.discounts.forEach((discount) => {
      message += `   • ${discount.rule.nameAr}: -${formatPrice(discount.amount)}\n`;
    });
  }
  
  message += '\nيرجى تأكيد الحجز 🙏';
  
  return encodeURIComponent(message);
}

export function getFromLocations(routes: Route[]): Set<string> {
  return new Set(routes.map((r) => r.from));
}

export function getToLocations(routes: Route[], fromId: string): Set<string> {
  return new Set(
    routes.filter((r) => r.from === fromId).map((r) => r.to)
  );
}
