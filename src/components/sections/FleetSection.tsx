import { useState, useRef, useCallback, useEffect } from 'react';
import { Users, Snowflake, Wifi, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { carImages, carCategories } from '@/data/cars';
import { cn } from '@/lib/utils';
import { useBatchReveal, useTiltEffect } from '@/hooks/useAnimations';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

type CarCategory = 'sedan' | 'suv' | 'family_cruiser' | 'minibus';

const categoryInfo: Record<CarCategory, { name: string; passengers: number; features: string[] }> = {
  sedan: {
    name: 'تويوتا كورولا',
    passengers: 4,
    features: ['تكييف', 'مقاعد مريحة', 'شاحن USB'],
  },
  suv: {
    name: 'سوزوكي فيتارا',
    passengers: 5,
    features: ['تكييف', 'مساحة أمتعة', 'نظام ترفيه'],
  },
  family_cruiser: {
    name: 'ميتسوبيشي إكسباندر',
    passengers: 7,
    features: ['7 مقاعد', 'تكييف خلفي', 'مساحة واسعة'],
  },
  minibus: {
    name: 'تويوتا هاي إيس',
    passengers: 14,
    features: ['14 راكب', 'تكييف مركزي', 'راحة فائقة'],
  },
};

interface GalleryContentProps {
  images: string[];
  info: typeof categoryInfo[keyof typeof categoryInfo];
  openLightbox: (index: number) => void;
  isActive: boolean;
}

// 3D Gallery Item with tilt effect
const GalleryItem = ({ 
  image, 
  info, 
  index, 
  openLightbox 
}: { 
  image: string; 
  info: typeof categoryInfo[keyof typeof categoryInfo];
  index: number;
  openLightbox: (index: number) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  useTiltEffect(cardRef, { max: 15, speed: 300 });

  return (
    <div
      ref={cardRef}
      className="gallery-item group cursor-pointer preserve-3d"
      onClick={() => openLightbox(index)}
    >
      <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-gray-100 dark:bg-gray-800 shadow-lg transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary-500/20">
        <img
          src={image}
          alt={`سيارة ${info.name}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <span className="text-white font-medium">اضغط للتكبير</span>
        </div>
      </div>
    </div>
  );
};

const GalleryContent = ({ images, info, openLightbox, isActive }: GalleryContentProps) => {
  const [ref] = useBatchReveal({ selector: '.gallery-item', interval: 0.1 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate container on mount/unmount
  useGSAP(() => {
    if (!containerRef.current) return;
    
    if (isActive) {
      gsap.fromTo(containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, { dependencies: [isActive] });

  if (!isActive) return null;

  return (
    <div ref={containerRef}>
      <div
        ref={ref}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {images.map((image, index) => (
          <GalleryItem
            key={image}
            image={image}
            info={info}
            index={index}
            openLightbox={openLightbox}
          />
        ))}
      </div>
    </div>
  );
};

interface LightboxProps {
  selectedImage: string | null;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Lightbox = ({ selectedImage, images, currentIndex, onClose, onNext, onPrev }: LightboxProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    if (!selectedImage) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNext(); // RTL: left goes next
      if (e.key === 'ArrowRight') onPrev(); // RTL: right goes prev
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, onClose, onNext, onPrev]);

  // Entrance animation
  useGSAP(() => {
    if (selectedImage && overlayRef.current && imageRef.current) {
      setIsVisible(true);
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(imageRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, { dependencies: [selectedImage] });

  // Image transition when navigating
  useGSAP(() => {
    if (selectedImage && imageRef.current && isVisible) {
      gsap.fromTo(imageRef.current,
        { opacity: 0.5, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, { dependencies: [currentIndex] });

  const handleClose = useCallback(() => {
    if (overlayRef.current && imageRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          setIsVisible(false);
          onClose();
        }
      });
      gsap.to(imageRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        ease: 'power2.in'
      });
    } else {
      onClose();
    }
  }, [onClose]);

  if (!selectedImage) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* Close Button */}
      <button
        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 hover:scale-110 active:scale-95"
        onClick={handleClose}
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation Buttons */}
      <button
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 hover:scale-110 active:scale-95"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <button
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 hover:scale-110 active:scale-95"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      {/* Image */}
      <img
        ref={imageRef}
        src={selectedImage}
        alt="صورة السيارة"
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Image Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white font-medium">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

interface CarInfoBadgeProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

const CarInfoBadge = ({ icon, children }: CarInfoBadgeProps) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md transition-transform duration-200 hover:scale-105">
    {icon}
    {children}
  </div>
);

export function FleetSection() {
  const [activeCategory, setActiveCategory] = useState<CarCategory>('sedan');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tabsRef] = useBatchReveal({ selector: '.category-tab', interval: 0.1 });
  const carInfoRef = useRef<HTMLDivElement>(null);

  const images = carImages[activeCategory];
  const info = categoryInfo[activeCategory];

  // Animate car info badges when category changes
  useGSAP(() => {
    if (!carInfoRef.current) return;
    
    const badges = carInfoRef.current.querySelectorAll('.car-info-badge');
    gsap.fromTo(badges,
      { opacity: 0, x: 20 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.3, 
        stagger: 0.05,
        ease: 'power2.out' 
      }
    );
  }, { dependencies: [activeCategory] });

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setSelectedImage(images[index]);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  return (
    <section id="fleet" className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-50/50 to-transparent dark:via-primary-950/20" />
      
      <div className="section-container relative z-10">
        <SectionHeading
          title="أسطولنا"
          subtitle="سيارات حديثة ومريحة تناسب جميع احتياجاتك"
        />

        {/* Category Tabs */}
        <div
          ref={tabsRef}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {carCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as CarCategory)}
              className={cn(
                'category-tab px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2',
                activeCategory === category.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 scale-105'
                  : 'bg-white dark:bg-gray-800 text-[hsl(var(--foreground))] hover:bg-primary-50 dark:hover:bg-primary-900/20 shadow-md hover:scale-105'
              )}
            >
              <span className="text-xl">{category.icon}</span>
              <span>{category.nameAr}</span>
            </button>
          ))}
        </div>

        {/* Car Info */}
        <div ref={carInfoRef} className="mb-8">
          <div className="flex flex-wrap justify-center items-center gap-6 text-center">
            <CarInfoBadge icon={<Star className="w-5 h-5 text-yellow-500" />}>
              <span className="car-info-badge font-semibold">{info.name}</span>
            </CarInfoBadge>
            <CarInfoBadge icon={<Users className="w-5 h-5 text-primary-500" />}>
              <span className="car-info-badge font-semibold">{info.passengers} ركاب</span>
            </CarInfoBadge>
            {info.features.map((feature, index) => (
              <CarInfoBadge 
                key={index}
                icon={index === 0 ? (
                  <Snowflake className="w-5 h-5 text-blue-500" />
                ) : (
                  <Wifi className="w-5 h-5 text-green-500" />
                )}
              >
                <span className="car-info-badge">{feature}</span>
              </CarInfoBadge>
            ))}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="min-h-[400px]">
          {carCategories.map((category) => (
            <GalleryContent 
              key={category.id}
              images={carImages[category.id as CarCategory]}
              info={categoryInfo[category.id as CarCategory]}
              openLightbox={openLightbox}
              isActive={activeCategory === category.id}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        selectedImage={selectedImage}
        images={images}
        currentIndex={currentImageIndex}
        onClose={closeLightbox}
        onNext={nextImage}
        onPrev={prevImage}
      />
    </section>
  );
}
