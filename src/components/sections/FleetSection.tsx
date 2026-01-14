import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Users, Star, ChevronLeft, ChevronRight, X, Maximize2, ArrowRight, Gauge, Briefcase } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { carImages, carCategories } from '@/data/cars';
import { cn } from '@/lib/utils';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

type CarCategory = 'sedan' | 'suv' | 'family_cruiser' | 'minibus';

const categoryInfo: Record<CarCategory, { name: string; passengers: number; features: string[]; slogan: string }> = {
  sedan: {
    name: 'تويوتا كورولا',
    passengers: 4,
    features: ['تكييف', 'مقاعد مريحة', 'شاحن USB'],
    slogan: 'راحة واقتصاد لكل مشوار'
  },
  suv: {
    name: 'سوزوكي فيتارا',
    passengers: 5,
    features: ['تكييف', 'مساحة أمتعة', 'نظام ترفيه'],
    slogan: 'قوة وفخامة لجميع الطرق'
  },
  family_cruiser: {
    name: 'ميتسوبيشي إكسباندر',
    passengers: 7,
    features: ['7 مقاعد', 'تكييف خلفي', 'مساحة واسعة'],
    slogan: 'رحلات عائلية لا تُنسى'
  },
  minibus: {
    name: 'تويوتا هاي إيس',
    passengers: 14,
    features: ['14 راكب', 'تكييف مركزي', 'راحة فائقة'],
    slogan: 'الحل الأمثل للمجموعات'
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
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(imageRef.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' });
    }
  }, { dependencies: [selectedImage] });

  if (!selectedImage) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50" onClick={onClose}>
        <X className="w-8 h-8" />
      </button>
      <button className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white hidden md:flex" onClick={(e) => { e.stopPropagation(); onPrev(); }}>
        <ChevronRight className="w-8 h-8" />
      </button>
      <button className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white hidden md:flex" onClick={(e) => { e.stopPropagation(); onNext(); }}>
        <ChevronLeft className="w-8 h-8" />
      </button>
      <div className="relative max-w-7xl max-h-[85vh] p-4">
        <img ref={imageRef} src={selectedImage} alt="Full view" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 font-mono text-sm bg-black/50 px-4 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

const CarouselCard = ({ 
  image, 
  isActive, 
  offset, 
  onClick 
}: { 
  image: string; 
  isActive: boolean; 
  offset: number; 
  onClick: () => void 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // RTL Adjustments:
  // In RTL, positive offset (next items) should be to the LEFT.
  // Standard CSS X-axis: +X is Right, -X is Left.
  // So for offset 1 (next item), we want negative X.
  const xOffset = offset * -65; // -65% shift per card
  const zOffset = Math.abs(offset) * -300; // Push back
  const rotateY = offset * -15; // Rotate inwards
  const scale = Math.max(0, 1 - Math.abs(offset) * 0.15);
  const opacity = Math.max(0, 1 - Math.abs(offset) * 0.4);
  const blur = Math.abs(offset) * 4;

  useGSAP(() => {
    gsap.to(cardRef.current, {
      xPercent: xOffset,
      z: zOffset,
      rotationY: rotateY,
      scale: scale,
      opacity: opacity,
      filter: `blur(${blur}px)`,
      duration: 0.6,
      ease: 'power3.out',
      overwrite: true
    });
  }, { dependencies: [offset] });

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={cn(
        "absolute top-0 left-0 w-full h-full origin-bottom transition-colors duration-300",
        isActive ? "z-20 cursor-default" : "z-10 cursor-pointer hover:brightness-110"
      )}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div className={cn(
        "relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900",
        isActive ? "shadow-primary-500/20 ring-1 ring-white/20" : "shadow-black/50"
      )}>
        <img
          src={image}
          alt="Car view"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        
        {isActive && (
          <div className="absolute top-4 right-4 z-30 animate-in fade-in zoom-in duration-500 delay-300">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 cursor-pointer hover:bg-white/30 transition-colors">
              <Maximize2 className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function FleetSection() {
  const [activeCategory, setActiveCategory] = useState<CarCategory>('sedan');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const images = useMemo(() => carImages[activeCategory], [activeCategory]);
  const info = categoryInfo[activeCategory];

  // Reset index on category change
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activeCategory]);

  // GSAP Entrance Animations
  useGSAP(() => {
    // Animate Info Text Stagger
    if(infoRef.current) {
      const elements = infoRef.current.querySelectorAll('.info-anim');
      gsap.fromTo(elements, 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, { dependencies: [activeCategory] });

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleCardClick = (index: number) => {
    if (index === currentImageIndex) {
      setLightboxOpen(true);
    } else {
      setCurrentImageIndex(index);
    }
  };

  return (
    <section id="fleet" ref={containerRef} className="section-padding relative overflow-hidden bg-gray-50 dark:bg-gray-950 min-h-screen flex flex-col justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-gray-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-black opacity-80" />
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[size:60px_60px] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]" />
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="section-container relative z-10 w-full">
        
        {/* Header & Tabs */}
        <div className="flex flex-col items-center mb-12 lg:mb-20">
          <SectionHeading
            title="أسطولنا المميز"
            subtitle="نجمع بين الفخامة والراحة في كل رحلة"
            className="mb-8"
          />

          {/* Glassmorphic Tabs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 p-2 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-full border border-white/20 shadow-xl">
            {carCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as CarCategory)}
                className={cn(
                  "relative px-6 py-3 rounded-full text-sm md:text-base font-bold transition-all duration-500 flex items-center gap-2 overflow-hidden",
                  activeCategory === cat.id
                    ? "text-white shadow-lg shadow-primary-500/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30"
                )}
              >
                {activeCategory === cat.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full -z-10" />
                )}
                <span className="text-xl">{cat.icon}</span>
                <span>{cat.nameAr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[500px]">
          
          {/* Right Column: Info Panel (RTL Layout -> Actually Left side visually in LTR structure, but first in DOM) */}
          <div ref={infoRef} className="lg:col-span-4 flex flex-col gap-8 order-2 lg:order-1 text-right">
            <div className="info-anim space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 text-sm font-medium">
                <Star className="w-4 h-4 fill-current" />
                <span>{info.slogan}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {info.name}
              </h2>
            </div>

            <div className="info-anim grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
                 <Users className="w-8 h-8 text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
                 <p className="text-sm text-gray-500 dark:text-gray-400">سعة الركاب</p>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">{info.passengers} أشخاص</p>
               </div>
               <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
                 <Briefcase className="w-8 h-8 text-accent-500 mb-3 group-hover:scale-110 transition-transform" />
                 <p className="text-sm text-gray-500 dark:text-gray-400">المساحة</p>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">واسعة جداً</p>
               </div>
            </div>

            <div className="info-anim space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary-500" />
                المميزات الرئيسية
              </h3>
              <ul className="space-y-3">
                {info.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl backdrop-blur-sm border border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="info-anim pt-4">
              <button 
                onClick={() => setLightboxOpen(true)}
                className="w-full group flex items-center justify-between p-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 transition-all hover:-translate-y-1"
              >
                <span className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  عرض المعرض
                </span>
                <span className="font-mono opacity-60 text-sm">
                  {images.length} صور
                </span>
              </button>
            </div>
          </div>

          {/* Left Column: 3D Carousel (RTL Layout -> Visually Right) */}
          <div className="lg:col-span-8 h-[400px] md:h-[500px] relative perspective-1000 group order-1 lg:order-2 mb-10 lg:mb-0">
            {/* Carousel Container */}
            <div className="relative w-full h-full flex items-center justify-center max-w-2xl mx-auto">
              {images.map((img, idx) => {
                // Calculate offset for the 3D effect
                let offset = idx - currentImageIndex;
                
                // Handle infinite loop visuals slightly better if needed, 
                // but for stack effect simple distance is often enough.
                // Or create a window if too many images. 
                // For simplicity and performance with < 10 images, we render all.
                
                // Optimization: Only render items within range -2 to +2
                if (Math.abs(offset) > 2) return null;

                return (
                  <CarouselCard
                    key={`${activeCategory}-${idx}`}
                    image={img}
                    isActive={idx === currentImageIndex}
                    offset={offset}
                    onClick={() => handleCardClick(idx)}
                  />
                );
              })}
            </div>

            {/* Floating Navigation Controls */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/20">
              <button 
                onClick={prevImage}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-white transition-colors active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      currentImageIndex === idx 
                        ? "w-8 bg-primary-600 dark:bg-primary-400" 
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-primary-400"
                    )}
                  />
                ))}
              </div>

              <button 
                onClick={nextImage}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-white transition-colors active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
          </div>

        </div>
      </div>

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
