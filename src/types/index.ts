export interface Car {
  id: string;
  name: string;
  nameAr: string;
  category: 'sedan' | 'suv' | 'family_cruiser' | 'minibus' | 'wedding';
  categoryAr: string;
  description: string;
  seoDescription?: string;
  passengers: number;
  images: string[];
  imageAlts?: string[];
  features: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  duration: string;
  price?: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
}
