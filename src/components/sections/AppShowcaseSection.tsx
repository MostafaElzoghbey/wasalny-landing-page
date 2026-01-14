import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { mockupImages } from '@/data/cars';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function AppShowcaseSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use a subset of images
  const images = mockupImages.slice(0, 8);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-play that continues during scroll
  useEffect(() => {
    const startAutoPlay = () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(nextSlide, 2500); // Faster: 2.5 seconds
    };

    startAutoPlay();
    
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [nextSlide]);

  // Entrance animations
  useGSAP(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Main container fade in
      gsap.fromTo(
        containerRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 90%',
            once: true,
          },
        }
      );

      // Thumbnails stagger in
      if (thumbnailsRef.current) {
        const thumbs = thumbnailsRef.current.querySelectorAll('.thumb-item');
        gsap.fromTo(
          thumbs,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: thumbnailsRef.current,
              start: 'top 95%',
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, {});

  // Image transition animation
  useGSAP(() => {
    if (!mainImageRef.current) return;

    gsap.fromTo(
      mainImageRef.current,
      { opacity: 0.5, scale: 1.02 },
      { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
    );
  }, { dependencies: [currentIndex] });

  return (
    <section
      ref={sectionRef}
      className="section-padding relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="section-container relative z-10">
        <SectionHeading
          title="صور من خدماتنا"
          subtitle="لمحة عن سياراتنا وخدماتنا المميزة"
          className="text-white [&_h2]:text-white [&_p]:text-primary-200"
        />

        {/* Main Carousel */}
        <div ref={containerRef} className="relative max-w-5xl mx-auto">
          {/* Main Image Container - Square aspect ratio for mockup images */}
          <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-video rounded-3xl overflow-hidden shadow-2xl bg-gray-900">
            <div ref={mainImageRef} className="absolute inset-0 flex items-center justify-center">
              <img
                src={images[currentIndex]}
                alt={`عرض ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

            {/* Navigation Arrows */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/15 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-all duration-150 hover:scale-110 active:scale-95"
              onClick={prevSlide}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/15 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-all duration-150 hover:scale-110 active:scale-95"
              onClick={nextSlide}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails Strip */}
          <div
            ref={thumbnailsRef}
            className="flex justify-center gap-2 sm:gap-3 mt-6 flex-wrap px-4"
          >
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`thumb-item relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden transition-all duration-150 ${
                  index === currentIndex
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-primary-900 scale-110 shadow-lg'
                    : 'opacity-50 hover:opacity-90 hover:scale-105'
                }`}
              >
                <img
                  src={image}
                  alt={`صورة مصغرة ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="flex justify-center gap-1.5 mt-6">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
