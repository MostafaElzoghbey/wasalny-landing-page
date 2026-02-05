// src/utils/pricingCalculator.ts
import {
  type RouteGroup,
  type VehicleCategory,
  findRouteGroup,
  getVehiclePricing,
  pricingConfig,
} from '@/data/pricing';

export interface TripDetails {
  fromLocation: string;
  toLocation: string;
  vehicleCategory: VehicleCategory;
  passengerCount: number;
  tripDate: Date;
  tripTime: string;
  isRoundTrip: boolean;
}

export interface PriceBreakdown {
  vehicleType: string;
  basePrice: number;
  total: number;
}

export interface PriceCalculationResult {
  breakdown: PriceBreakdown;
  details: {
    routeNameAr: string;
    vehicleCategoryAr: string;
    passengerCount: number;
    tripDateTime: Date;
    isRoundTrip: boolean;
  };
  warnings: string[];
}

/**
 * Main pricing calculation function - Simplified for fixed pricing
 */
export function calculatePrice(tripDetails: TripDetails): PriceCalculationResult {
  const warnings: string[] = [];
  const {
    fromLocation,
    toLocation,
    vehicleCategory,
    passengerCount,
    tripDate,
    tripTime,
    isRoundTrip,
  } = tripDetails;

  // Find matching route group
  const routeGroup = findRouteGroup(fromLocation, toLocation);
  if (!routeGroup) {
    throw new Error('لا يوجد مسار متاح بين هذه المواقع');
  }

  // Get vehicle pricing info
  const vehiclePricingInfo = getVehiclePricing(vehicleCategory);
  if (!vehiclePricingInfo) {
    throw new Error('نوع السيارة غير متوفر');
  }

  // Validate passenger count
  if (passengerCount > vehiclePricingInfo.maxPassengers) {
    warnings.push(
      `عدد الركاب يتجاوز السعة القصوى للسيارة (${vehiclePricingInfo.maxPassengers})`
    );
  }

  if (passengerCount < vehiclePricingInfo.minPassengers) {
    warnings.push(`الحد الأدنى لعدد الركاب هو ${vehiclePricingInfo.minPassengers}`);
  }

  // Get fixed price based on vehicle type and trip type
  const tripType = isRoundTrip ? 'roundTrip' : 'oneWay';
  const basePrice = routeGroup.pricing[vehicleCategory][tripType];
  const total = basePrice; // No additional calculations

  // Build date/time
  const [hours, minutes] = tripTime.split(':').map(Number);
  const dateTime = new Date(tripDate);
  dateTime.setHours(hours, minutes, 0, 0);

  // Build result
  const breakdown: PriceBreakdown = {
    vehicleType: vehiclePricingInfo.categoryAr,
    basePrice,
    total,
  };

  const details = {
    routeNameAr: routeGroup.nameAr,
    vehicleCategoryAr: vehiclePricingInfo.categoryAr,
    passengerCount,
    tripDateTime: dateTime,
    isRoundTrip,
  };

  return {
    breakdown,
    details,
    warnings,
  };
}

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
  message += `${details.isRoundTrip ? '🔄' : '➡️'} *نوع الرحلة:* ${details.isRoundTrip ? 'ذهاب وعودة' : 'ذهاب فقط'}\n`;
  message += `📅 *الموعد:* ${details.tripDateTime.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })} - ${details.tripDateTime.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  })}\n`;

  message += `\n💰 *السعر الإجمالي:* ${formatPrice(breakdown.total)}\n`;
  message += '\nيرجى تأكيد الحجز 🙏';
  
  return encodeURIComponent(message);
}

// Re-export utility functions from pricing data
export { findRouteGroup, getFromLocations, getToLocations, detectRouteType } from '@/data/pricing';
