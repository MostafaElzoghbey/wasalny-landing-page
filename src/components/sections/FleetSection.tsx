import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Users, Star, ChevronLeft, ChevronRight, X, Maximize2, ArrowRight, Gauge, Briefcase, Car, Truck, Bus, UsersRound, Play, Pause } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { carImages, carCategories } from '@/data/cars';
import { cn } from '@/lib/utils';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

const categoryColors: Record<CarCategory, { primary: string; accent: string }> = {
  sedan: { primary: 'from-blue-500/15', accent: 'to-cyan-500/10' },
  suv: { primary: 'from-emerald-500/15', accent: 'to-teal-500/10' },
  family_cruiser: { primary: 'from-purple-500/15', accent: 'to-pink-500/10' },
  minibus: { primary: 'from-orange-500/15', accent: 'to-amber-500/10' },
};

const iconMap = {
  Car: Car,
  Truck: Truck,
  Bus: Bus,
  UsersRound: UsersRound,
};

interface LightboxProps {
  selectedImage: string | null;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (index: number) => void;
}

const Lightbox = ({ selectedImage, images, currentIndex, onClose, onNext, onPrev, onSelect }: LightboxProps) => {
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
    <div 
      ref={overlayRef} 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="معرض صور السيارة"
    >
      <button 
        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50 focus-visible:ring-2 focus-visible:ring-primary-500" 
        onClick={onClose}
        aria-label="إغلاق"
      >
        <X className="w-8 h-8" />
      </button>
      <button 
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white hidden md:flex focus-visible:ring-2 focus-visible:ring-primary-500" 
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="الصورة السابقة"
      >
        <ChevronRight className="w-8 h-8" />
      </button>
      <button 
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white hidden md:flex focus-visible:ring-2 focus-visible:ring-primary-500" 
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="الصورة التالية"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      
      {/* Main image container */}
      <div className="flex-1 flex items-center justify-center p-4 pb-0 max-w-7xl w-full" onClick={(e) => e.stopPropagation()}>
        <img ref={imageRef} src={selectedImage} alt="Full view" className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl" />
      </div>
      
      {/* Counter */}
      <div className="text-white/80 font-mono text-sm bg-black/50 px-4 py-1 rounded-full my-3" onClick={(e) => e.stopPropagation()}>
        {currentIndex + 1} / {images.length}
      </div>
      
      {/* Thumbnail Strip - Fixed at bottom */}
      <div className="pb-6 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2 p-2 bg-black/50 backdrop-blur-md rounded-xl max-w-[90vw] overflow-x-auto scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={cn(
                "flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200",
                idx === currentIndex 
                  ? "border-primary-500 ring-2 ring-primary-500/50" 
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const CarouselCard = ({ 
  image, 
  isActive, 
  offset, 
  onClick,
  currentIndex,
  totalImages
}: { 
  image: string; 
  isActive: boolean; 
  offset: number; 
  onClick: () => void;
  currentIndex: number;
  totalImages: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // RTL Adjustments:
  const xOffset = offset * -65;
  const zOffset = Math.abs(offset) * -300;
  const rotateY = offset * -15;
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
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer" />
          </div>
        )}
        <img
          src={image}
          alt="Car view"
          className={cn("w-full h-full object-cover transition-opacity duration-500", imageLoaded ? "opacity-100" : "opacity-0")}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        
        {isActive && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 animate-in fade-in zoom-in duration-500 delay-300">
            <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-sm font-mono border border-white/20">
              {currentIndex + 1}/{totalImages}
            </div>
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
  const [isHovering, setIsHovering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const icon1Ref = useRef<SVGSVGElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const icon2Ref = useRef<SVGSVGElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Touch refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const images = useMemo(() => carImages[activeCategory], [activeCategory]);
  const info = categoryInfo[activeCategory];
  const currentColors = categoryColors[activeCategory];

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activeCategory]);

  // Preload images
  useEffect(() => {
    const preloadImages = () => {
      for (let i = 1; i <= 2; i++) {
        const nextIdx = (currentImageIndex + i) % images.length;
        const img = new Image();
        img.src = images[nextIdx];
      }
    };
    preloadImages();
  }, [currentImageIndex, images]);

  // Auto-play
  useEffect(() => {
    if (isHovering || lightboxOpen || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 500);
    
    return () => clearInterval(interval);
  }, [isHovering, lightboxOpen, isPaused, images.length]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) return;

      // Check if section is visible
      const rect = containerRef.current?.getBoundingClientRect();
      const isVisible = rect && rect.top < window.innerHeight && rect.bottom > 0;
      
      if (!isVisible) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextImage(); // RTL: left arrow goes to next
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        prevImage(); // RTL: right arrow goes to previous
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  useGSAP(() => {
    if(infoRef.current) {
      const elements = infoRef.current.querySelectorAll('.info-anim');
      gsap.fromTo(elements, 
        { y: 20, opacity: 0, filter: 'blur(4px)' },
        { 
          y: 0, 
          opacity: 1, 
          filter: 'blur(0px)',
          stagger: 0.08, 
          duration: 0.5, 
          ease: 'power2.out',
          clearProps: 'filter'
        }
      );
    }
  }, { dependencies: [activeCategory] });

  // Scroll Entrance Animation
  useGSAP(() => {
    if (!carouselRef.current) return;
    
    gsap.fromTo(carouselRef.current,
      { opacity: 0, x: -50 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: carouselRef.current,
          start: 'top 80%',
          once: true,
        }
      }
    );
  }, { scope: containerRef });

  // Hover effects for info cards
  useGSAP(() => {
    const cards = [
        { card: card1Ref.current, icon: icon1Ref.current },
        { card: card2Ref.current, icon: icon2Ref.current }
    ];

    cards.forEach(({ card, icon }) => {
        if (!card || !icon) return;
        
        const tl = gsap.timeline({ paused: true });
        tl.to(card, { y: -4, duration: 0.3, ease: "power2.out" })
          .to(icon, { scale: 1.15, rotation: 5, duration: 0.3, ease: "back.out(1.7)" }, 0);

        card.addEventListener('mouseenter', () => tl.play());
        card.addEventListener('mouseleave', () => tl.reverse());
    });
  }, { scope: infoRef });

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = 0;
    touchStartX.current = e.targetTouches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  const handleCardClick = (index: number) => {
    if (index === currentImageIndex) {
      setLightboxOpen(true);
    } else {
      setCurrentImageIndex(index);
    }
  };

  return (
    <section id="fleet" ref={containerRef} className="section-padding relative overflow-hidden bg-gray-50 dark:bg-gray-950 min-h-screen flex flex-col justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-gray-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-black opacity-80" />
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[size:60px_60px] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]" />
      
      <div className={cn("absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-br rounded-full blur-[100px] animate-pulse transition-colors duration-1000", currentColors.primary, currentColors.accent)} />
      <div className={cn("absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl rounded-full blur-[100px] animate-pulse transition-colors duration-1000", currentColors.primary, currentColors.accent)} style={{ animationDelay: '2s' }} />

      <div className="section-container relative z-10 w-full">
        
        <div className="flex flex-col items-center mb-12 lg:mb-20">
          <SectionHeading
            title="أسطولنا المميز"
            subtitle="نجمع بين الفخامة والراحة في كل رحلة"
            className="mb-8"
          />

          <div 
            className="flex flex-wrap justify-center gap-2 md:gap-4 p-2 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-full border border-white/20 shadow-xl"
            role="tablist"
            aria-label="فئات السيارات"
          >
            {carCategories.map((cat) => {
                const IconComponent = iconMap[cat.icon as keyof typeof iconMap];
                return (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id as CarCategory)}
                    className={cn(
                      "relative px-6 py-3 rounded-full text-sm md:text-base font-bold transition-all duration-500 flex items-center gap-2 overflow-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                      activeCategory === cat.id
                        ? "text-white shadow-lg shadow-primary-500/30"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30"
                    )}
                  >
                    {activeCategory === cat.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full -z-10" />
                    )}
                    <IconComponent className="w-5 h-5" />
                    <span>{cat.nameAr}</span>
                  </button>
                );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[500px]">
          
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
               <div ref={card1Ref} className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                 <Users ref={icon1Ref} className="w-8 h-8 text-primary-500 mb-3" />
                 <p className="text-sm text-gray-500 dark:text-gray-400">سعة الركاب</p>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">{info.passengers} أشخاص</p>
               </div>
               <div ref={card2Ref} className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                 <Briefcase ref={icon2Ref} className="w-8 h-8 text-accent-500 mb-3" />
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
                  <li 
                    key={i} 
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-300 
                               bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl backdrop-blur-sm 
                               border border-transparent hover:border-primary-300 dark:hover:border-primary-700 
                               hover:bg-white dark:hover:bg-gray-800 
                               hover:shadow-md hover:shadow-primary-500/10
                               transition-all duration-200 cursor-default group/feature"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-500 
                                    shadow-[0_0_10px_rgba(59,130,246,0.5)]
                                    group-hover/feature:scale-125 group-hover/feature:shadow-[0_0_15px_rgba(59,130,246,0.7)]
                                    transition-all duration-200" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="info-anim pt-4">
              <button 
                onClick={() => setLightboxOpen(true)}
                className="w-full group relative overflow-hidden flex items-center justify-between p-4 
                           bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 
                           text-white rounded-2xl font-bold shadow-xl shadow-primary-500/25 
                           hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent 
                                -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <span className="flex items-center gap-3 relative z-10">
                  <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center 
                                   group-hover:rotate-45 transition-transform duration-300">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  عرض المعرض
                </span>
                <span className="font-mono opacity-80 text-sm relative z-10">
                  {images.length} صور
                </span>
              </button>
            </div>
          </div>

          <div 
            ref={carouselRef}
            className="lg:col-span-8 h-[350px] sm:h-[400px] md:h-[500px] relative perspective-1000 group order-1 lg:order-2 mb-8 sm:mb-10 lg:mb-0"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full h-full flex items-center justify-center max-w-2xl mx-auto">
              {images.map((img, idx) => {
                let offset = idx - currentImageIndex;
                // Only show current (0) and next images (positive offset up to 2)
                // Hide previous images (negative offset) to avoid conflict with right-side info panel
                if (offset < 0 || offset > 2) return null;

                return (
                  <CarouselCard
                    key={`${activeCategory}-${idx}`}
                    image={img}
                    isActive={idx === currentImageIndex}
                    offset={offset}
                    onClick={() => handleCardClick(idx)}
                    currentIndex={currentImageIndex}
                    totalImages={images.length}
                  />
                );
              })}
            </div>

            <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-6 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg border border-white/20">
              <button 
                onClick={prevImage}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-white transition-colors active:scale-90 focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-4 min-w-[120px]">
                <div className="relative w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${((currentImageIndex + 1) / images.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400 min-w-[3ch] text-center">
                  {currentImageIndex + 1}/{images.length}
                </span>
              </div>

              <button 
                onClick={nextImage}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-white transition-colors active:scale-90 focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />

              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label={isPaused ? "تشغيل" : "إيقاف مؤقت"}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
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
        onSelect={setCurrentImageIndex}
      />
    </section>
  );
}
