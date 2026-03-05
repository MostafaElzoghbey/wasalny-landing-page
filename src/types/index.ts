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

export interface Faq {
  question: string;
  answer: string;
}

export interface RouteData {
  id: string;
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  heroImage: string;
  priceStart: string;
  distance: string;
  duration: string;
  features: string[];
  faqs: Faq[];
}

export interface BeforeInstallPromptChoice {
  readonly outcome: 'accepted' | 'dismissed';
  readonly platform: string;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<BeforeInstallPromptChoice>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export interface PWAInstallButtonProps {
  readonly isMobile?: boolean;
}

export interface IOSInstallBannerProps {
  readonly logoSrc: string;
  readonly className?: string;
}

export type ServiceOptionIcon = 'baby' | 'luggage' | 'clock' | 'userCheck' | 'mapPin' | 'car' | 'route' | 'plane';

export interface ServiceOption {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly icon: ServiceOptionIcon;
  readonly priceEGP?: number;
}
