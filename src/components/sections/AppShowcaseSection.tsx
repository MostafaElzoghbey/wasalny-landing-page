import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { mockupImages } from '@/data/cars';
import { useParallax } from '@/hooks/useAnimations';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface NavigationButtonProps {
  onClick: () => void;
  direction: 'left' | 'right';
}

const NavigationButton = ({ onClick, direction }: NavigationButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    if (!buttonRef.current) return;

    const el = buttonRef.current;

    const handleMouseEnter = () => {
      gsap.to(el, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseDown = () => {
      gsap.to(el, { scale: 0.9, duration: 0.1, ease: 'power2.out' });
    };

    const handleMouseUp = () => {
      gsap.to(el, { scale: 1.1, duration: 0.1, ease: 'power2.out' });
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
    };
  }, {});

  return (
    <button
      ref={buttonRef}
      className={`absolute ${direction === 'right' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors`}
      onClick={onClick}
    >
      {direction === 'right' ? (
        <ChevronRight className="w-6 h-6" />
      ) : (
        <ChevronLeft className="w-6 h-6" />
      )}
    </button>
  );
};

interface ThumbnailButtonProps {
  image: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const ThumbnailButton = ({ image, index, isActive, onClick }: ThumbnailButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    if (!buttonRef.current) return;

    const el = buttonRef.current;

    const handleMouseEnter = () => {
      if (!isActive) {
        gsap.to(el, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
      }
    };

    const handleMouseLeave = () => {
      if (!isActive) {
        gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.out' });
      }
    };

    const handleMouseDown = () => {
      gsap.to(el, { scale: 0.95, duration: 0.1, ease: 'power2.out' });
    };

    const handleMouseUp = () => {
      gsap.to(el, { scale: isActive ? 1.1 : 1.05, duration: 0.1, ease: 'power2.out' });
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
    };
  }, { dependencies: [isActive] });

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`relative w-16 h-16 rounded-xl overflow-hidden transition-all duration-300 ${
        isActive
          ? 'ring-2 ring-white ring-offset-2 ring-offset-primary-900 scale-110'
          : 'opacity-60 hover:opacity-100'
      }`}
    >
      <img
        src={image}
        alt={`صورة مصغرة ${index + 1}`}
        className="w-full h-full object-cover"
      />
    </button>
  );
};

interface ProgressDotProps {
  isActive: boolean;
  onClick: () => void;
}

const ProgressDot = ({ isActive, onClick }: ProgressDotProps) => {
  const dotRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    if (!dotRef.current) return;

    const el = dotRef.current;

    const handleMouseEnter = () => {
      gsap.to(el, { scale: 1.2, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, {});

  return (
    <button
      ref={dotRef}
      onClick={onClick}
      className={`h-2 rounded-full transition-all duration-300 ${
        isActive
          ? 'w-8 bg-white'
          : 'w-2 bg-white/40 hover:bg-white/60'
      }`}
    />
  );
};

export function AppShowcaseSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useParallax(blob1Ref, 0.3);
  useParallax(blob2Ref, 0.5);

  // Container entrance animation
  useGSAP(() => {
    gsap.fromTo(containerRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }, {});

  // Heading entrance animation
  useGSAP(() => {
    gsap.fromTo(headingRef.current,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }, {});

  // Image transition animation
  useGSAP(() => {
    if (!imageRef.current) return;
    
    gsap.fromTo(imageRef.current,
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, { dependencies: [currentIndex] });

  // Only use a subset of mockup images
  const images = mockupImages.slice(0, 8);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <section className="section-padding relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div ref={blob1Ref} className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div ref={blob2Ref} className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="section-container relative z-10">
        <div ref={headingRef}>
          <SectionHeading
            title="صور من خدماتنا"
            subtitle="لمحة عن سياراتنا وخدماتنا المميزة"
            className="text-white [&_h2]:text-white [&_p]:text-primary-200"
          />
        </div>

        {/* Carousel Container */}
        <div
          ref={containerRef}
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main Image */}
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
            <img
              ref={imageRef}
              key={currentIndex}
              src={images[currentIndex]}
              alt={`عرض ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            {/* Navigation Arrows */}
            <NavigationButton onClick={prevSlide} direction="right" />
            <NavigationButton onClick={nextSlide} direction="left" />
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            {images.map((image, index) => (
              <ThumbnailButton
                key={index}
                image={image}
                index={index}
                isActive={index === currentIndex}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {images.map((_, index) => (
              <ProgressDot
                key={index}
                isActive={index === currentIndex}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
