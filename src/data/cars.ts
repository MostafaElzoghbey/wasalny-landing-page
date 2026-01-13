import type { Car } from '@/types';

// Car images organized by category
export const carImages = {
  sedan: [
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.00 PM.jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.01 PM.jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.01 PM (1).jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.02 PM.jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.02 PM (1).jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.03 PM.jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.04 PM.jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.04 PM (1).jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.05 PM.jpeg',
    '/assets/images/cars/sedan/WhatsApp Image 2026-01-10 at 11.01.05 PM (1).jpeg',
  ],
  suv: [
    '/assets/images/cars/suv/WhatsApp Image 2026-01-10 at 11.01.34 PM.jpeg',
    '/assets/images/cars/suv/WhatsApp Image 2026-01-10 at 11.01.35 PM.jpeg',
    '/assets/images/cars/suv/WhatsApp Image 2026-01-10 at 11.01.35 PM (1).jpeg',
    '/assets/images/cars/suv/WhatsApp Image 2026-01-10 at 11.01.35 PM (2).jpeg',
    '/assets/images/cars/suv/WhatsApp Image 2026-01-10 at 11.01.36 PM.jpeg',
    '/assets/images/cars/suv/WhatsApp Image 2026-01-10 at 11.01.36 PM (1).jpeg',
  ],
  family_cruiser: [
    '/assets/images/cars/family_cruiser/WhatsApp Image 2026-01-10 at 11.03.40 PM.jpeg',
    '/assets/images/cars/family_cruiser/WhatsApp Image 2026-01-10 at 11.03.42 PM.jpeg',
    '/assets/images/cars/family_cruiser/WhatsApp Image 2026-01-10 at 11.03.43 PM.jpeg',
    '/assets/images/cars/family_cruiser/WhatsApp Image 2026-01-10 at 11.03.49 PM.jpeg',
    '/assets/images/cars/family_cruiser/WhatsApp Image 2026-01-10 at 11.03.51 PM.jpeg',
  ],
  minibus: [
    '/assets/images/cars/minibus/WhatsApp Image 2026-01-10 at 11.03.57 PM.jpeg',
    '/assets/images/cars/minibus/WhatsApp Image 2026-01-10 at 11.03.58 PM.jpeg',
  ],
};

export const mockupImages = [
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.21.56 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.21.56 PM (1).jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.21.58 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.21.59 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.00 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.01 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.01 PM (1).jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.02 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.03 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.06 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.07 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.08 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.09 PM.jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.09 PM (1).jpeg',
  '/assets/images/mockups/WhatsApp Image 2026-01-10 at 10.22.10 PM.jpeg',
];

export const logoImage = '/assets/images/logo/WhatsApp Image 2026-01-10 at 10.21.56 PM (2).jpeg';

export const cars: Car[] = [
  {
    id: 'sedan-1',
    name: 'Toyota Corolla',
    nameAr: 'تويوتا كورولا',
    category: 'sedan',
    categoryAr: 'سيدان',
    description: 'سيارة اقتصادية مريحة للرحلات الفردية والثنائية',
    passengers: 4,
    images: carImages.sedan.slice(0, 4),
    features: ['تكييف', 'مقاعد مريحة', 'شاحن USB', 'واي فاي'],
  },
  {
    id: 'suv-1',
    name: 'Suzuki Vitara',
    nameAr: 'سوزوكي فيتارا',
    category: 'suv',
    categoryAr: 'دفع رباعي',
    description: 'سيارة عائلية واسعة مع مساحة للأمتعة',
    passengers: 5,
    images: carImages.suv.slice(0, 4),
    features: ['تكييف', 'مساحة أمتعة كبيرة', 'نظام ترفيه', 'مقاعد جلد'],
  },
  {
    id: 'family-1',
    name: 'Mitsubishi Xpander',
    nameAr: 'ميتسوبيشي إكسباندر',
    category: 'family_cruiser',
    categoryAr: 'عائلية',
    description: 'السيارة المثالية للعائلات والرحلات الطويلة',
    passengers: 7,
    images: carImages.family_cruiser,
    features: ['7 مقاعد', 'تكييف خلفي', 'شاشة ترفيه', 'مساحة واسعة'],
  },
  {
    id: 'minibus-1',
    name: 'Toyota HiAce',
    nameAr: 'تويوتا هاي إيس',
    category: 'minibus',
    categoryAr: 'ميني باص',
    description: 'الخيار الأمثل للمجموعات الكبيرة والرحلات الجماعية',
    passengers: 14,
    images: carImages.minibus,
    features: ['14 راكب', 'تكييف مركزي', 'مساحة أمتعة ضخمة', 'راحة فائقة'],
  },
];

export const carCategories = [
  { id: 'sedan', nameAr: 'سيدان', icon: '🚗' },
  { id: 'suv', nameAr: 'دفع رباعي', icon: '🚙' },
  { id: 'family_cruiser', nameAr: 'عائلية', icon: '🚐' },
  { id: 'minibus', nameAr: 'ميني باص', icon: '🚌' },
] as const;
