import { useRef, useEffect, useState } from 'react';
import gsap from '@/lib/gsap';
import { useGSAP } from '@gsap/react';
import { logoImage } from '@/data/cars';

interface PageLoaderProps {
  onComplete?: () => void;
  minDuration?: number;
}

export function PageLoader({ onComplete, minDuration = 2000 }: PageLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isComplete, setIsComplete] = useState(false);

  useGSAP(() => {
    if (!containerRef.current || !logoRef.current || !textRef.current || !progressRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        // Slide out animation
        gsap.to(containerRef.current, {
          yPercent: -100,
          duration: 0.8,
          ease: "power3.inOut",
          onComplete: () => {
            setIsComplete(true);
            onComplete?.();
          }
        });
      }
    });

    // Logo entrance
    tl.fromTo(logoRef.current, 
      { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
    );

    // Text reveal
    tl.fromTo(textRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      "-=0.3"
    );

    // Progress bar
    tl.to(progressRef.current,
      { scaleX: 1, duration: minDuration / 1000, ease: "power1.inOut" },
      "-=0.3"
    );

    // Logo pulse
    tl.to(logoRef.current,
      { scale: 1.1, duration: 0.3, ease: "power2.out", yoyo: true, repeat: 1 },
      "-=0.5"
    );

  }, { scope: containerRef, dependencies: [minDuration] });

  // Prevent scroll during loading
  useEffect(() => {
    if (!isComplete) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isComplete]);

  if (isComplete) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <img
        ref={logoRef}
        src={logoImage}
        alt="وصلني"
        className="w-32 h-32 rounded-3xl object-cover shadow-2xl shadow-black/30 mb-6"
        style={{ opacity: 0 }}
      />

      {/* Brand Name */}
      <div ref={textRef} className="text-center" style={{ opacity: 0 }}>
        <h1 className="text-4xl font-bold text-white mb-2">وصلني</h1>
        <p className="text-primary-200 text-lg">نوصلك بأمان</p>
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1 bg-white/20 rounded-full mt-8 overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-white rounded-full origin-right"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </div>
  );
}
