import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { mockupImages } from '@/data/cars';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// High-density content: Use ALL images in both rows
// Row 2 is reversed for variety
const row1Items = [...mockupImages];
const row2Items = [...mockupImages].reverse();

// Triple buffer: Original | Duplicate | Triplicate
// Moving from 0% to -33.33% will be perfectly seamless
const row1Loop = [...row1Items, ...row1Items, ...row1Items];
const row2Loop = [...row2Items, ...row2Items, ...row2Items];

/** Fullscreen Lightbox */
function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    if (!backdropRef.current) return;
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  }, {});

  useGSAP(() => {
    if (!imageRef.current) return;
    gsap.fromTo(imageRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' });
  }, { dependencies: [currentIndex] });

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onPrev();
      if (e.key === 'ArrowLeft') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-6 right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110">
        <X className="w-8 h-8" />
      </button>

      <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 z-10">
        <ChevronRight className="w-8 h-8" />
      </button>

      <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 z-10">
        <ChevronLeft className="w-8 h-8" />
      </button>

      <img ref={imageRef} src={images[currentIndex]} alt="هوية وصلني" className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-white font-bold tracking-widest">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

export function AppShowcaseSection() {
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openLightbox = useCallback((src: string) => {
    const idx = mockupImages.indexOf(src);
    if (idx !== -1) setLightbox({ index: idx });
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const nextImage = useCallback(() => setLightbox(p => p ? { index: (p.index + 1) % mockupImages.length } : null), []);
  const prevImage = useCallback(() => setLightbox(p => p ? { index: (p.index - 1 + mockupImages.length) % mockupImages.length } : null), []);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(containerRef.current, { y: 60, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%', once: true }
    });
  }, {});

  return (
    <>
      <style>{`
        @keyframes scroll-ltr {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        @keyframes scroll-rtl {
          0% { transform: translateX(-33.3333%); }
          100% { transform: translateX(0); }
        }
        .marquee-track {
          display: flex;
          gap: 1rem;
          width: max-content;
          will-change: transform;
          /* Ensure LTR for consistent math regardless of page direction */
          direction: ltr !important;
        }
        .animate-scroll-ltr {
          animation: scroll-ltr 60s linear infinite;
        }
        .animate-scroll-rtl {
          animation: scroll-rtl 60s linear infinite;
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      <section className="section-padding relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950">
        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full">
          <div className="section-container mb-12">
            <SectionHeading
              title="هوية وصلني"
              subtitle="علامتنا التجارية وهويتنا البصرية التي تعكس احترافية خدماتنا"
              className="text-white [&_h2]:text-white [&_p]:text-primary-200"
            />
          </div>

          <div ref={containerRef} className="space-y-6 md:space-y-10 w-full overflow-hidden" dir="ltr">
            {/* Row 1 - LTR */}
            <div className="marquee-container relative cursor-pointer overflow-hidden">
              <div className="marquee-track animate-scroll-ltr">
                {row1Loop.map((src, i) => (
                  <div key={`r1-${i}`} onClick={() => openLightbox(src)} className="group relative w-[240px] sm:w-[380px] md:w-[440px] h-[160px] sm:h-[220px] md:h-[260px] flex-shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:z-10">
                    <img src={src} alt="Wasalny Brand" className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700" loading="eager" />
                    <div className="absolute inset-0 bg-primary-900/5 group-hover:bg-transparent transition-colors duration-500" />
                    <div className="absolute inset-0 border border-white/5 group-hover:border-white/20 rounded-2xl sm:rounded-3xl transition-colors duration-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 - RTL */}
            <div className="marquee-container relative cursor-pointer overflow-hidden">
              <div className="marquee-track animate-scroll-rtl">
                {row2Loop.map((src, i) => (
                  <div key={`r2-${i}`} onClick={() => openLightbox(src)} className="group relative w-[240px] sm:w-[380px] md:w-[440px] h-[160px] sm:h-[220px] md:h-[260px] flex-shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:z-10">
                    <img src={src} alt="Wasalny Brand" className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700" loading="eager" />
                    <div className="absolute inset-0 bg-primary-900/5 group-hover:bg-transparent transition-colors duration-500" />
                    <div className="absolute inset-0 border border-white/5 group-hover:border-white/20 rounded-2xl sm:rounded-3xl transition-colors duration-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {lightbox && (
        <Lightbox
          images={mockupImages}
          currentIndex={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
}
