import { useState, useRef, useCallback, useEffect } from 'react';
import { Users, Snowflake, Wifi, Star, ChevronLeft, ChevronRight, X, Maximize2, ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    if (!selectedImage) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNext();
      if (e.key === 'ArrowRight') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, onClose, onNext, onPrev]);

  useGSAP(() => {
    if (selectedImage && overlayRef.current && imageRef.current) {
      setIsVisible(true);
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(imageRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' }
      );
    }
  }, { dependencies: [selectedImage] });

  useGSAP(() => {
    if (selectedImage && imageRef.current && isVisible) {
      gsap.fromTo(imageRef.current,
        { opacity: 0.5, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
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
        scale: 0.9,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={handleClose}
    >
      <button
        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 hover:scale-110 active:scale-95 z-50"
        onClick={handleClose}
      >
        <X className="w-8 h-8" />
      </button>

      <button
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all duration-200 hover:scale-110 active:scale-95 hidden md:flex"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <button
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all duration-200 hover:scale-110 active:scale-95 hidden md:flex"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <div className="relative w-full max-w-7xl max-h-[85vh] flex items-center justify-center p-4">
        <img
          ref={imageRef}
          src={selectedImage}
          alt="صورة السيارة"
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white font-mono text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md group">
    <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="font-medium text-gray-700 dark:text-gray-200 text-sm md:text-base">{text}</span>
  </div>
);

interface ShowcaseProps {
  category: CarCategory;
  onImageClick: (index: number) => void;
}

const CarShowcase = ({ category, onImageClick }: ShowcaseProps) => {
  const images = carImages[category];
  const info = categoryInfo[category];
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  
  // Tilt effect for the hero image
  useTiltEffect(heroImageRef, { max: 5, speed: 400 });

  // Reset index when category changes
  useEffect(() => {
    setActiveIdx(0);
  }, [category]);

  // Animate content when category changes
  useGSAP(() => {
    if (!containerRef.current || !heroImageRef.current || !infoRef.current) return;

    // Reset and animate hero image
    gsap.fromTo(heroImageRef.current,
      { opacity: 0, x: 50, filter: 'blur(10px)' },
      { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' }
    );

    // Animate info panel
    gsap.fromTo(infoRef.current,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.6, delay: 0.1, ease: 'power2.out' }
    );
    
    // Animate thumbnails stagger
    gsap.fromTo('.thumbnail-btn',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, delay: 0.2, ease: 'back.out(1.5)' }
    );

  }, { dependencies: [category] });

  // Image switch animation
  useGSAP(() => {
    const img = heroImageRef.current?.querySelector('img');
    if (img) {
      gsap.fromTo(img,
        { scale: 1.05, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, { dependencies: [activeIdx] });

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row gap-8 lg:h-[600px] w-full">
      {/* Main Hero Image Area */}
      <div className="flex-1 lg:w-2/3 flex flex-col gap-6">
        <div 
          ref={heroImageRef}
          className="relative flex-1 rounded-3xl overflow-hidden shadow-2xl group cursor-pointer bg-gray-100 dark:bg-gray-800"
          onClick={() => onImageClick(activeIdx)}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          
          <img
            src={images[activeIdx]}
            alt={info.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/30">
              <Maximize2 className="w-6 h-6" />
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-20 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/90 backdrop-blur-sm mb-2 text-sm font-medium shadow-lg">
              <Star className="w-3 h-3 fill-white" />
              <span>الأكثر طلباً</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-1 shadow-black/50 drop-shadow-lg">{info.name}</h3>
          </div>
        </div>

        {/* Thumbnails Strip */}
        <div className="h-24 md:h-28 w-full overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-3 h-full min-w-min px-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "thumbnail-btn relative h-full aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300",
                  activeIdx === idx 
                    ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-950 scale-105 z-10" 
                    : "opacity-60 hover:opacity-100 hover:scale-105"
                )}
              >
                <img 
                  src={img} 
                  alt={`Thumbnail ${idx + 1}`} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Side Panel */}
      <div ref={infoRef} className="lg:w-1/3 flex flex-col justify-between gap-6">
        <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden h-full flex flex-col">
          
          {/* Decorative background blobs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="mb-6">
              <h4 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">المواصفات التقنية</h4>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{info.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                استمتع بتجربة سفر فاخرة مع أسطولنا المميز. تم اختيار كل سيارة بعناية لضمان أقصى درجات الراحة والأمان لك ولعائلتك.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <FeatureItem 
                icon={<Users className="w-5 h-5" />} 
                text={`تتسع لـ ${info.passengers} ركاب`} 
              />
              {info.features.map((feature, idx) => (
                <FeatureItem 
                  key={idx}
                  icon={idx === 0 ? <Snowflake className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                  text={feature}
                />
              ))}
            </div>

            <div className="mt-auto">
              <button 
                onClick={() => onImageClick(activeIdx)}
                className="w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold overflow-hidden transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-95"
              >
                <span className="relative z-10">عرض الصور كاملة</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-primary-600 dark:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function FleetSection() {
  const [activeCategory, setActiveCategory] = useState<CarCategory>('sedan');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tabsRef] = useBatchReveal({ selector: '.category-tab', interval: 0.1 });
  
  const images = carImages[activeCategory];

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section id="fleet" className="section-padding relative overflow-hidden bg-gray-50/50 dark:bg-gray-950/50">
      {/* Modern Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 dark:to-gray-950/80" />
      
      <div className="section-container relative z-10">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <SectionHeading
            title="أسطولنا"
            subtitle="نقدم لك أحدث السيارات لضمان رحلة مريحة وآمنة"
          />
        </div>

        {/* Category Tabs - Modern Pill Design */}
        <div
          ref={tabsRef}
          className="flex flex-wrap justify-center gap-2 mb-12 p-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-full w-fit mx-auto shadow-sm border border-gray-200/50 dark:border-gray-800/50"
        >
          {carCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as CarCategory)}
              className={cn(
                'category-tab px-6 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 relative overflow-hidden',
                activeCategory === category.id
                  ? 'text-white shadow-lg shadow-primary-500/25 ring-2 ring-primary-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              )}
            >
              {activeCategory === category.id && (
                <div className="absolute inset-0 bg-primary-600 rounded-full -z-10 animate-in fade-in zoom-in duration-300" />
              )}
              <span className="text-xl relative z-10">{category.icon}</span>
              <span className="relative z-10">{category.nameAr}</span>
            </button>
          ))}
        </div>

        {/* Main Content Showcase */}
        <CarShowcase 
          category={activeCategory} 
          onImageClick={openLightbox} 
        />
      </div>

      {/* Lightbox */}
      <Lightbox
        selectedImage={lightboxOpen ? images[currentImageIndex] : null}
        images={images}
        currentIndex={currentImageIndex}
        onClose={() => setLightboxOpen(false)}
        onNext={nextImage}
        onPrev={prevImage}
      />
    </section>
  );
}
