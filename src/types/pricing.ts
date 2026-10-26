// src/types/pricing.ts

export type RouteType = 'travel' | 'internal';
export type VehicleCategory = 'sedan' | 'suv' | 'family_cruiser' | 'minibus';

export interface Location {
  id: string;
  name: string;
  nameAr: string;
  type: RouteType; // Which route type this location belongs to
  displayOrder: number;
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
  displayOrder: number;
}

export interface VehiclePricing {
  category: VehicleCategory;
  categoryAr: string;
  maxPassengers: number;
  minPassengers: number;
}
