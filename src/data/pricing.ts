// src/data/pricing.ts
export type RouteId = string;
export type VehicleCategory = 'sedan' | 'suv' | 'family_cruiser' | 'minibus';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type DayType = 'weekday' | 'weekend' | 'holiday';

export interface Location {
  id: string;
  name: string;
  nameAr: string;
  coordinates?: { lat: number; lng: number };
}

export interface Route {
  id: string;
  from: string; // Location ID
  to: string;   // Location ID
  distanceKm: number;
  durationMinutes: number;
  basePriceEGP: number; // Base price for sedan
  nameAr: string;
}

export interface VehiclePricing {
  category: VehicleCategory;
  categoryAr: string;
  baseMultiplier: number; // Multiplier applied to route base price
  maxPassengers: number;
  minPassengers: number;
  pricePerExtraPassenger?: number; // After base passengers
}

export interface TimeMultiplier {
  slot: TimeSlot;
  slotAr: string;
  hours: [number, number]; // [start, end] in 24h format
  multiplier: number;
}

export interface DayTypeMultiplier {
  type: DayType;
  typeAr: string;
  multiplier: number;
  checkDate: (date: Date) => boolean; // Function to determine if date matches this type
}

export interface AdditionalService {
  id: string;
  nameAr: string;
  priceEGP: number;
  icon: string;
  description?: string;
  maxQuantity?: number; // Added to limit quantity if needed
}

export interface DiscountRule {
  id: string;
  nameAr: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  isStackable: boolean; // If false, this discount cannot be combined with others (except perhaps fully stackable ones if logic allows, but usually Exclusive beats all)
  maxAmount?: number; // Cap for percentage discounts
  validFrom?: Date;
  validTo?: Date;
  conditions?: {
    minPassengers?: number;
    roundTrip?: boolean;
    advanceBookingDays?: number;
    specificRoutes?: string[];
    minTotalAmount?: number;
  };
}

// ============================================
// LOCATIONS
// ============================================
export const locations: Location[] = [
  { id: 'damietta-city', name: 'Damietta City', nameAr: 'مدينة دمياط' },
  { id: 'damietta-port', name: 'Damietta Port', nameAr: 'ميناء دمياط' },
  { id: 'new-damietta', name: 'New Damietta', nameAr: 'دمياط الجديدة' },
  { id: 'ras-elbar', name: 'Ras El Bar', nameAr: 'رأس البر' },
  { id: 'cairo-downtown', name: 'Cairo Downtown', nameAr: 'وسط القاهرة' },
  { id: 'cairo-airport', name: 'Cairo Airport', nameAr: 'مطار القاهرة الدولي' },
  { id: 'nasr-city', name: 'Nasr City', nameAr: 'مدينة نصر' },
  { id: 'heliopolis', name: 'Heliopolis', nameAr: 'مصر الجديدة' },
  { id: 'new-cairo', name: 'New Cairo', nameAr: 'القاهرة الجديدة' },
  { id: '6th-october', name: '6th of October', nameAr: 'السادس من أكتوبر' },
  { id: 'giza', name: 'Giza', nameAr: 'الجيزة' },
  { id: 'alex-downtown', name: 'Alexandria Downtown', nameAr: 'وسط الإسكندرية' },
  // New Locations
  { id: 'ezbet-elborg', name: 'Ezbet El Borg', nameAr: 'عزبة البرج' },
  { id: 'faraskour', name: 'Faraskour', nameAr: 'فارسكور' },
  { id: 'kafr-saad', name: 'Kafr Saad', nameAr: 'كفر سعد' },
  { id: 'maadi', name: 'Maadi', nameAr: 'المعادي' },
  { id: 'zamalek', name: 'Zamalek', nameAr: 'الزمالك' },
  { id: 'mohandessin', name: 'Mohandessin', nameAr: 'المهندسين' },
  { id: 'sharm', name: 'Sharm El Sheikh', nameAr: 'شرم الشيخ' },
  { id: 'hurghada', name: 'Hurghada', nameAr: 'الغردقة' },
];

// ============================================
// ROUTES
// ============================================
export const routes: Route[] = [
  {
    id: 'damietta-cairo',
    from: 'damietta-city',
    to: 'cairo-downtown',
    distanceKm: 200,
    durationMinutes: 150,
    basePriceEGP: 800,
    nameAr: 'دمياط - القاهرة',
  },
  {
    id: 'damietta-airport',
    from: 'damietta-city',
    to: 'cairo-airport',
    distanceKm: 180,
    durationMinutes: 140,
    basePriceEGP: 850,
    nameAr: 'دمياط - مطار القاهرة',
  },
  {
    id: 'damietta-nasr',
    from: 'damietta-city',
    to: 'nasr-city',
    distanceKm: 190,
    durationMinutes: 145,
    basePriceEGP: 820,
    nameAr: 'دمياط - مدينة نصر',
  },
  {
    id: 'damietta-newcairo',
    from: 'damietta-city',
    to: 'new-cairo',
    distanceKm: 210,
    durationMinutes: 160,
    basePriceEGP: 870,
    nameAr: 'دمياط - القاهرة الجديدة',
  },
  {
    id: 'damietta-6october',
    from: 'damietta-city',
    to: '6th-october',
    distanceKm: 230,
    durationMinutes: 175,
    basePriceEGP: 920,
    nameAr: 'دمياط - السادس من أكتوبر',
  },
  {
    id: 'rasalbar-cairo',
    from: 'ras-elbar',
    to: 'cairo-downtown',
    distanceKm: 215,
    durationMinutes: 160,
    basePriceEGP: 850,
    nameAr: 'رأس البر - القاهرة',
  },
  {
    id: 'newdamietta-cairo',
    from: 'new-damietta',
    to: 'cairo-downtown',
    distanceKm: 205,
    durationMinutes: 155,
    basePriceEGP: 820,
    nameAr: 'دمياط الجديدة - القاهرة',
  },
  {
    id: 'damietta-alex',
    from: 'damietta-city',
    to: 'alex-downtown',
    distanceKm: 250,
    durationMinutes: 190,
    basePriceEGP: 950,
    nameAr: 'دمياط - الإسكندرية',
  },
  // Internal Damietta
  {
    id: 'damietta-ezbet',
    from: 'damietta-city',
    to: 'ezbet-elborg',
    distanceKm: 15,
    durationMinutes: 25,
    basePriceEGP: 150,
    nameAr: 'دمياط - عزبة البرج',
  },
  {
    id: 'damietta-faraskour',
    from: 'damietta-city',
    to: 'faraskour',
    distanceKm: 20,
    durationMinutes: 30,
    basePriceEGP: 180,
    nameAr: 'دمياط - فارسكور',
  },
  // Damietta - Cairo Neighborhoods
  {
    id: 'damietta-maadi',
    from: 'damietta-city',
    to: 'maadi',
    distanceKm: 215,
    durationMinutes: 170,
    basePriceEGP: 880,
    nameAr: 'دمياط - المعادي',
  },
  {
    id: 'damietta-zamalek',
    from: 'damietta-city',
    to: 'zamalek',
    distanceKm: 205,
    durationMinutes: 160,
    basePriceEGP: 850,
    nameAr: 'دمياط - الزمالك',
  },
  {
    id: 'damietta-mohandessin',
    from: 'damietta-city',
    to: 'mohandessin',
    distanceKm: 210,
    durationMinutes: 165,
    basePriceEGP: 860,
    nameAr: 'دمياط - المهندسين',
  },
  // Coastal
  {
    id: 'damietta-sharm',
    from: 'damietta-city',
    to: 'sharm',
    distanceKm: 550,
    durationMinutes: 480, // ~8 hours
    basePriceEGP: 3500,
    nameAr: 'دمياط - شرم الشيخ',
  },
  {
    id: 'damietta-hurghada',
    from: 'damietta-city',
    to: 'hurghada',
    distanceKm: 500,
    durationMinutes: 420, // ~7 hours
    basePriceEGP: 3200,
    nameAr: 'دمياط - الغردقة',
  },
  // Reverse Routes (Generated for completeness)
  {
    id: 'cairo-damietta',
    from: 'cairo-downtown',
    to: 'damietta-city',
    distanceKm: 200,
    durationMinutes: 150,
    basePriceEGP: 800,
    nameAr: 'القاهرة - دمياط',
  },
  {
    id: 'airport-damietta',
    from: 'cairo-airport',
    to: 'damietta-city',
    distanceKm: 180,
    durationMinutes: 140,
    basePriceEGP: 850,
    nameAr: 'مطار القاهرة - دمياط',
  },
  {
    id: 'nasr-damietta',
    from: 'nasr-city',
    to: 'damietta-city',
    distanceKm: 190,
    durationMinutes: 145,
    basePriceEGP: 820,
    nameAr: 'مدينة نصر - دمياط',
  },
  {
    id: 'newcairo-damietta',
    from: 'new-cairo',
    to: 'damietta-city',
    distanceKm: 210,
    durationMinutes: 160,
    basePriceEGP: 870,
    nameAr: 'القاهرة الجديدة - دمياط',
  },
  {
    id: '6october-damietta',
    from: '6th-october',
    to: 'damietta-city',
    distanceKm: 230,
    durationMinutes: 175,
    basePriceEGP: 920,
    nameAr: 'السادس من أكتوبر - دمياط',
  },
  {
    id: 'alex-damietta',
    from: 'alex-downtown',
    to: 'damietta-city',
    distanceKm: 250,
    durationMinutes: 190,
    basePriceEGP: 950,
    nameAr: 'الإسكندرية - دمياط',
  },
  {
    id: 'maadi-damietta',
    from: 'maadi',
    to: 'damietta-city',
    distanceKm: 215,
    durationMinutes: 170,
    basePriceEGP: 880,
    nameAr: 'المعادي - دمياط',
  },
  {
    id: 'zamalek-damietta',
    from: 'zamalek',
    to: 'damietta-city',
    distanceKm: 205,
    durationMinutes: 160,
    basePriceEGP: 850,
    nameAr: 'الزمالك - دمياط',
  },
  {
    id: 'mohandessin-damietta',
    from: 'mohandessin',
    to: 'damietta-city',
    distanceKm: 210,
    durationMinutes: 165,
    basePriceEGP: 860,
    nameAr: 'المهندسين - دمياط',
  },
  {
    id: 'sharm-damietta',
    from: 'sharm',
    to: 'damietta-city',
    distanceKm: 550,
    durationMinutes: 480,
    basePriceEGP: 3500,
    nameAr: 'شرم الشيخ - دمياط',
  },
  {
    id: 'hurghada-damietta',
    from: 'hurghada',
    to: 'damietta-city',
    distanceKm: 500,
    durationMinutes: 420,
    basePriceEGP: 3200,
    nameAr: 'الغردقة - دمياط',
  },
];

// ============================================
// VEHICLE PRICING
// ============================================
export const vehiclePricing: VehiclePricing[] = [
  {
    category: 'sedan',
    categoryAr: 'سيدان',
    baseMultiplier: 1.0,
    maxPassengers: 4,
    minPassengers: 1,
    pricePerExtraPassenger: 0, // Included up to 4
  },
  {
    category: 'suv',
    categoryAr: 'دفع رباعي',
    baseMultiplier: 1.25,
    maxPassengers: 4,
    minPassengers: 1,
    pricePerExtraPassenger: 0,
  },
  {
    category: 'family_cruiser',
    categoryAr: 'عائلية',
    baseMultiplier: 1.6,
    maxPassengers: 7,
    minPassengers: 1,
    pricePerExtraPassenger: 50, // After 4 passengers
  },
  {
    category: 'minibus',
    categoryAr: 'ميني باص',
    baseMultiplier: 2.2,
    maxPassengers: 13,
    minPassengers: 1,
    pricePerExtraPassenger: 70, // After 6 passengers
  },
];

// ============================================
// TIME MULTIPLIERS
// ============================================
export const timeMultipliers: TimeMultiplier[] = [
  {
    slot: 'morning',
    slotAr: 'صباحاً (6 ص - 12 ظ)',
    hours: [6, 12],
    multiplier: 1.0, // Normal price
  },
  {
    slot: 'afternoon',
    slotAr: 'ظهراً (12 ظ - 6 م)',
    hours: [12, 18],
    multiplier: 1.0,
  },
  {
    slot: 'evening',
    slotAr: 'مساءً (6 م - 12 ص)',
    hours: [18, 24],
    multiplier: 1.15, // 15% increase
  },
  {
    slot: 'night',
    slotAr: 'ليلاً (12 ص - 6 ص)',
    hours: [0, 6],
    multiplier: 1.3, // 30% increase
  },
];

// ============================================
// DAY TYPE MULTIPLIERS
// ============================================

// Helper to check for recurring holidays (Fixed Date like Jan 25, May 1, etc.)
const isFixedHoliday = (date: Date): boolean => {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  const fixedHolidays = [
    { m: 1, d: 7 }, // Coptic Christmas
    { m: 1, d: 25 }, // Revolution Day
    { m: 4, d: 25 }, // Sinai Liberation Day
    { m: 5, d: 1 }, // Labor Day
    { m: 6, d: 30 }, // June 30 Revolution
    { m: 7, d: 23 }, // Revolution Day
    { m: 10, d: 6 }, // Armed Forces Day
  ];

  return fixedHolidays.some(h => h.m === month && h.d === day);
};

// Helper to check for variable holidays (Eid, Easter, etc.) - Manually set for 2025-2027
// In a real production app, we might use a library like 'hijri-date' or an API,
// but hardcoding a few years ahead is efficient and stable for this scope.
const isVariableHoliday = (date: Date): boolean => {
  const dateString = date.toISOString().split('T')[0];
  const variableHolidays = [
    // 2025 (Examples)
    '2025-03-31', // Eid Al-Fitr (approx)
    '2025-04-01', // Eid Al-Fitr
    '2025-04-21', // Sham El Nessim
    '2025-06-06', // Arafat
    '2025-06-07', // Eid Al-Adha
    '2025-06-27', // Islamic New Year
    '2025-09-05', // Prophet's Birthday

    // 2026 (Examples)
    '2026-03-20', // Eid Al-Fitr (approx)
    '2026-04-13', // Sham El Nessim
    '2026-05-27', // Eid Al-Adha (approx)
    
    // Add more as needed or integrate a library
  ];
  return variableHolidays.includes(dateString);
};

export const dayTypeMultipliers: DayTypeMultiplier[] = [
  {
    type: 'weekday',
    typeAr: 'أيام العمل',
    multiplier: 1.0,
    checkDate: (date: Date) => {
      const day = date.getDay();
      return day >= 0 && day <= 4; // Sun-Thu (Sunday is start of week in Egypt technically, but typically Fri/Sat are weekends)
      // Actually, in Egypt:
      // Fri & Sat are official weekends.
      // Sun, Mon, Tue, Wed, Thu are working days.
      // JS getDay(): 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    },
  },
  {
    type: 'weekend',
    typeAr: 'عطلة نهاية الأسبوع',
    multiplier: 1.1, // 10% increase
    checkDate: (date: Date) => {
      const day = date.getDay();
      return day === 5 || day === 6; // Fri & Sat
    },
  },
  {
    type: 'holiday',
    typeAr: 'عطلة رسمية',
    multiplier: 1.25, // 25% increase
    checkDate: (date: Date) => {
      return isFixedHoliday(date) || isVariableHoliday(date);
    },
  },
];

// ============================================
// ADDITIONAL SERVICES
// ============================================
export const additionalServices: AdditionalService[] = [
  {
    id: 'child-seat',
    nameAr: 'مقعد أطفال',
    priceEGP: 50,
    icon: 'baby',
    description: 'مقعد أطفال آمن ومعتمد',
    maxQuantity: 2,
  },
  {
    id: 'extra-luggage',
    nameAr: 'أمتعة إضافية',
    priceEGP: 100,
    icon: 'luggage',
    description: 'لحقائب إضافية كبيرة الحجم',
    maxQuantity: 5,
  },
  {
    id: 'waiting-time',
    nameAr: 'وقت انتظار (ساعة)',
    priceEGP: 80,
    icon: 'clock',
    description: 'انتظار السائق لمدة ساعة إضافية',
    maxQuantity: 10,
  },
  {
    id: 'stop-over',
    nameAr: 'توقف في الطريق',
    priceEGP: 50,
    icon: 'mapPin',
    description: 'توقف واحد لمدة 15 دقيقة',
    maxQuantity: 3,
  },
];

// ============================================
// DISCOUNT RULES
// ============================================
export const discountRules: DiscountRule[] = [
  {
    id: 'round-trip',
    nameAr: 'خصم العودة',
    description: 'خصم 15% عند حجز رحلة ذهاب وعودة',
    type: 'percentage',
    value: 15,
    isStackable: true, // Stackable with other small discounts
    conditions: {
      roundTrip: true,
    },
  },
  {
    id: 'early-booking',
    nameAr: 'حجز مبكر',
    description: 'خصم 10% للحجز قبل 5 أيام',
    type: 'percentage',
    value: 10,
    isStackable: true,
    maxAmount: 200, // Cap at 200 EGP
    conditions: {
      advanceBookingDays: 5,
    },
  },
  {
    id: 'group-discount',
    nameAr: 'خصم المجموعات',
    description: 'خصم 150 جنيه للمجموعات 6+ أشخاص',
    type: 'fixed',
    value: 150,
    isStackable: true,
    conditions: {
      minPassengers: 6,
    },
  },

];

// ============================================
// PRICING ENGINE CONFIGURATION
// ============================================
export const pricingConfig = {
  currency: 'EGP',
  currencyAr: 'جنيه',
  basePassengers: 4, // Standard car capacity base
  minimumBookingHours: 2, // Minimum hours before trip
  maxAdvanceBookingDays: 60, // Maximum days to book in advance
  roundTripReturnMinHours: 4, // Minimum hours between outbound and return
  whatsappNumber: '201090400030', // Official Booking Number
  contactEmail: 'booking@wasalny.com',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get time slot based on hour
 */
export function getTimeSlot(hour: number): TimeMultiplier {
  return (
    timeMultipliers.find(
      (tm) => hour >= tm.hours[0] && hour < tm.hours[1]
    ) || timeMultipliers[0]
  );
}

/**
 * Get day type for a specific date
 */
export function getDayType(date: Date): DayTypeMultiplier {
  // Check holiday first (highest priority)
  const holiday = dayTypeMultipliers.find(
    (dt) => dt.type === 'holiday' && dt.checkDate(date)
  );
  if (holiday) return holiday;

  // Check weekend
  const weekend = dayTypeMultipliers.find(
    (dt) => dt.type === 'weekend' && dt.checkDate(date)
  );
  if (weekend) return weekend;

  // Default to weekday
  return dayTypeMultipliers.find((dt) => dt.type === 'weekday')!;
}

/**
 * Check if date is valid for booking
 */
export function isValidBookingDate(date: Date): {
  valid: boolean;
  reason?: string;
} {
  const now = new Date();
  const minDate = new Date(
    now.getTime() + pricingConfig.minimumBookingHours * 60 * 60 * 1000
  );
  const maxDate = new Date(
    now.getTime() + pricingConfig.maxAdvanceBookingDays * 24 * 60 * 60 * 1000
  );

  if (date < minDate) {
    return {
      valid: false,
      reason: `يجب الحجز قبل ${pricingConfig.minimumBookingHours} ساعة على الأقل`,
    };
  }

  if (date > maxDate) {
    return {
      valid: false,
      reason: `لا يمكن الحجز لأكثر من ${pricingConfig.maxAdvanceBookingDays} يوم مقدماً`,
    };
  }

  return { valid: true };
}

/**
 * Get location by ID
 */
export function getLocationById(id: string): Location | undefined {
  return locations.find((loc) => loc.id === id);
}

/**
 * Get route by from/to location IDs
 */
export function getRoute(fromId: string, toId: string): Route | undefined {
  return routes.find((r) => r.from === fromId && r.to === toId);
}

/**
 * Get reverse route
 */
export function getReverseRoute(fromId: string, toId: string): Route | undefined {
  return routes.find((r) => r.from === toId && r.to === fromId);
}

/**
 * Get vehicle pricing by category
 */
export function getVehiclePricing(
  category: VehicleCategory
): VehiclePricing | undefined {
  return vehiclePricing.find((vp) => vp.category === category);
}

