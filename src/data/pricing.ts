// src/data/pricing.ts
export type RouteType = 'travel' | 'internal';
export type VehicleCategory = 'sedan' | 'suv' | 'family_cruiser' | 'minibus';

export interface Location {
  id: string;
  name: string;
  nameAr: string;
  type: RouteType; // Which route type this location belongs to
}

export interface RouteGroup {
  id: string;
  type: RouteType;
  fromLocations: string[]; // Location IDs
  toLocations: string[];
  nameAr: string;
  bidirectional: boolean; // Can go both ways
  pricing: {
    sedan: { oneWay: number; roundTrip: number };
    suv: { oneWay: number; roundTrip: number };
    family_cruiser: { oneWay: number; roundTrip: number };
    minibus: { oneWay: number; roundTrip: number };
  };
}

export interface VehiclePricing {
  category: VehicleCategory;
  categoryAr: string;
  maxPassengers: number;
  minPassengers: number;
}

// ============================================
// LOCATIONS
// ============================================
export const locations: Location[] = [
  // Damietta Area (can be used in both Travel and Internal)
  { id: 'damietta', name: 'Damietta', nameAr: 'دمياط', type: 'travel' },
  { id: 'new-damietta', name: 'New Damietta', nameAr: 'دمياط الجديدة', type: 'travel' },
  { id: 'ras-elbar', name: 'Ras El Bar', nameAr: 'رأس البر', type: 'travel' },
  { id: 'faraskour', name: 'Faraskour', nameAr: 'فارسكور', type: 'travel' },
  { id: 'ezbet-elborg', name: 'Ezbet El Borg', nameAr: 'عزبة البرج', type: 'travel' },
  
  // Cairo Area
  { id: 'cairo-airport', name: 'Cairo Airport', nameAr: 'مطار القاهرة', type: 'travel' },
  { id: 'nasr-city', name: 'Nasr City', nameAr: 'مدينة نصر', type: 'travel' },
  { id: 'new-cairo', name: 'New Cairo', nameAr: 'التجمع', type: 'travel' },
  { id: 'heliopolis', name: 'Heliopolis', nameAr: 'مصر الجديدة', type: 'travel' },
  
  // Alexandria Area
  { id: 'alexandria', name: 'Alexandria', nameAr: 'الإسكندرية', type: 'travel' },
  { id: 'borg-alarab-airport', name: 'Borg Al Arab Airport', nameAr: 'مطار برج العرب', type: 'travel' },
  
  // West Cairo Area
  { id: 'sphinx-airport', name: 'Sphinx Airport', nameAr: 'مطار اسفنكس', type: 'travel' },
  { id: '6th-october', name: '6th of October', nameAr: 'أكتوبر', type: 'travel' },
];

// ============================================
// ROUTE GROUPS
// ============================================
export const routeGroups: RouteGroup[] = [
  // TRAVEL ROUTES
  {
    id: 'travel-cairo',
    type: 'travel',
    fromLocations: ['damietta', 'new-damietta', 'ras-elbar', 'faraskour', 'ezbet-elborg'],
    toLocations: ['cairo-airport', 'nasr-city', 'new-cairo', 'heliopolis'],
    nameAr: 'دمياط - القاهرة',
    bidirectional: true,
    pricing: {
      sedan: { oneWay: 1600, roundTrip: 2600 },
      suv: { oneWay: 2000, roundTrip: 3000 },
      family_cruiser: { oneWay: 2200, roundTrip: 3200 },
      minibus: { oneWay: 3500, roundTrip: 4000 },
    },
  },
  {
    id: 'travel-alexandria',
    type: 'travel',
    fromLocations: ['damietta', 'new-damietta', 'ras-elbar', 'faraskour', 'ezbet-elborg'],
    toLocations: ['alexandria', 'borg-alarab-airport'],
    nameAr: 'دمياط - الإسكندرية',
    bidirectional: true,
    pricing: {
      sedan: { oneWay: 1800, roundTrip: 2800 },
      suv: { oneWay: 2000, roundTrip: 3000 },
      family_cruiser: { oneWay: 2200, roundTrip: 3200 },
      minibus: { oneWay: 3500, roundTrip: 4000 },
    },
  },
  {
    id: 'travel-west-cairo',
    type: 'travel',
    fromLocations: ['damietta', 'new-damietta', 'ras-elbar', 'faraskour', 'ezbet-elborg'],
    toLocations: ['sphinx-airport', '6th-october'],
    nameAr: 'دمياط - غرب القاهرة',
    bidirectional: true,
    pricing: {
      sedan: { oneWay: 2000, roundTrip: 3000 },
      suv: { oneWay: 2000, roundTrip: 3000 },
      family_cruiser: { oneWay: 2200, roundTrip: 3200 },
      minibus: { oneWay: 3500, roundTrip: 4000 },
    },
  },
  
  // INTERNAL DAMIETTA ROUTES
  {
    id: 'internal-main',
    type: 'internal',
    fromLocations: ['damietta'],
    toLocations: ['new-damietta', 'ras-elbar'],
    nameAr: 'دمياط - دمياط الجديدة / رأس البر',
    bidirectional: true,
    pricing: {
      sedan: { oneWay: 130, roundTrip: 130 }, // No round trip concept
      suv: { oneWay: 130, roundTrip: 130 },
      family_cruiser: { oneWay: 130, roundTrip: 130 },
      minibus: { oneWay: 130, roundTrip: 130 },
    },
  },
  {
    id: 'internal-secondary',
    type: 'internal',
    fromLocations: ['damietta'],
    toLocations: ['ezbet-elborg', 'faraskour'],
    nameAr: 'دمياط - عزبة البرج / فارسكور',
    bidirectional: true,
    pricing: {
      sedan: { oneWay: 140, roundTrip: 140 },
      suv: { oneWay: 140, roundTrip: 140 },
      family_cruiser: { oneWay: 140, roundTrip: 140 },
      minibus: { oneWay: 140, roundTrip: 140 },
    },
  },
  {
    id: 'internal-cross',
    type: 'internal',
    fromLocations: ['ezbet-elborg', 'faraskour'],
    toLocations: ['ras-elbar', 'new-damietta'],
    nameAr: 'عزبة البرج / فارسكور - رأس البر / دمياط الجديدة',
    bidirectional: true,
    pricing: {
      sedan: { oneWay: 260, roundTrip: 260 },
      suv: { oneWay: 260, roundTrip: 260 },
      family_cruiser: { oneWay: 260, roundTrip: 260 },
      minibus: { oneWay: 260, roundTrip: 260 },
    },
  },
];

// ============================================
// VEHICLE PRICING
// ============================================
export const vehiclePricing: VehiclePricing[] = [
  {
    category: 'sedan',
    categoryAr: 'سيدان',
    maxPassengers: 3, // Changed from 4
    minPassengers: 1,
  },
  {
    category: 'suv',
    categoryAr: 'دفع رباعي',
    maxPassengers: 4,
    minPassengers: 1,
  },
  {
    category: 'family_cruiser',
    categoryAr: 'عائلية',
    maxPassengers: 7,
    minPassengers: 1,
  },
  {
    category: 'minibus',
    categoryAr: 'ميني باص',
    maxPassengers: 13,
    minPassengers: 1,
  },
];

// ============================================
// PRICING ENGINE CONFIGURATION
// ============================================
export const pricingConfig = {
  currency: 'EGP',
  currencyAr: 'جنيه',
  whatsappNumber: '201005656117',
  contactEmail: 'booking@wasalny.com',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get location by ID
 */
export function getLocationById(id: string): Location | undefined {
  return locations.find((loc) => loc.id === id);
}

/**
 * Find matching route group for from/to locations
 */
export function findRouteGroup(fromId: string, toId: string): RouteGroup | undefined {
  return routeGroups.find(group => {
    // Check forward direction
    const forwardMatch = group.fromLocations.includes(fromId) && group.toLocations.includes(toId);
    
    // Check reverse direction if bidirectional
    const reverseMatch = group.bidirectional && 
                         group.fromLocations.includes(toId) && 
                         group.toLocations.includes(fromId);
    
    return forwardMatch || reverseMatch;
  });
}

/**
 * Get available "from" locations based on route type
 */
export function getFromLocations(routeType: RouteType): Location[] {
  if (routeType === 'internal') {
    // For internal, only show Damietta area locations
    return locations.filter(loc => 
      ['damietta', 'new-damietta', 'ras-elbar', 'faraskour', 'ezbet-elborg'].includes(loc.id)
    );
  }
  
  // For travel, show all locations
  return locations;
}

/**
 * Get available "to" locations based on route type and selected "from"
 */
export function getToLocations(routeType: RouteType, fromId: string): Location[] {
  const possibleToIds = new Set<string>();
  
  routeGroups
    .filter(group => group.type === routeType)
    .forEach(group => {
      // Forward direction
      if (group.fromLocations.includes(fromId)) {
        group.toLocations.forEach(id => possibleToIds.add(id));
      }
      
      // Reverse direction
      if (group.bidirectional && group.toLocations.includes(fromId)) {
        group.fromLocations.forEach(id => possibleToIds.add(id));
      }
    });
  
  return locations.filter(loc => possibleToIds.has(loc.id));
}

/**
 * Get vehicle pricing by category
 */
export function getVehiclePricing(category: VehicleCategory): VehiclePricing | undefined {
  return vehiclePricing.find((vp) => vp.category === category);
}

/**
 * Detect route type based on selected locations
 */
export function detectRouteType(fromId: string, toId: string): RouteType | null {
  const group = findRouteGroup(fromId, toId);
  return group ? group.type : null;
}
