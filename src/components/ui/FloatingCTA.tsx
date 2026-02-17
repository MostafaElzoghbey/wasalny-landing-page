import { useRef, useState, useEffect } from 'react';
import gsap, { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { contactInfo } from '@/data/content';

export function FloatingCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const waButtonRef = useRef<HTMLAnchorElement>(null);
  const fbButtonRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isPastHero, setIsPastHero] = useState(false);
  const [isInFooter, setIsInFooter] = useState(false);
  const isVisible = isPastHero && !isInFooter;

  useEffect(() => {
    const heroTrigger = ScrollTrigger.create({
      trigger: '#home',
      start: 'bottom top+=100',
      onEnter: () => setIsPastHero(true),
      onLeaveBack: () => setIsPastHero(false),
    });

    const footerTrigger = ScrollTrigger.create({
      trigger: 'footer',
      start: 'top bottom-=100',
      onEnter: () => setIsInFooter(true),
      onLeaveBack: () => setIsInFooter(false),
    });

    return () => {
      heroTrigger.kill();
      footerTrigger.kill();
    };
  }, []);

  // Container entrance/exit animation
  useGSAP(() => {
    if (!containerRef.current) return;

    const tween = gsap.to(containerRef.current, {
      opacity: isVisible ? 1 : 0,
      y: isVisible ? 0 : 30,
      scale: isVisible ? 1 : 0.6,
      duration: 0.5,
      ease: isVisible ? 'back.out(1.7)' : 'power3.in',
      pointerEvents: isVisible ? 'auto' : 'none',
    });

    return () => { tween.kill(); };
  }, { dependencies: [isVisible] });

  // Staggered button entrance
  useGSAP(() => {
    if (!waButtonRef.current || !fbButtonRef.current || !isVisible) return;

    const tween = gsap.fromTo(
      [fbButtonRef.current, waButtonRef.current],
      { scale: 0, rotation: -15 },
      {
        scale: 1,
        rotation: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'back.out(2)',
        overwrite: true,
      }
    );

    return () => { tween.kill(); };
  }, { dependencies: [isVisible] });

  // WhatsApp breathing glow
  useGSAP(() => {
    if (!glowRef.current || !isVisible) return;

    gsap.set(glowRef.current, { scale: 1, opacity: 0.4 });

    const tween = gsap.to(glowRef.current, {
      scale: 1.6,
      opacity: 0,
      duration: 2,
      repeat: -1,
      ease: 'sine.out',
    });

    return () => { tween.kill(); };
  }, { dependencies: [isVisible] });

  // Hover effects with magnetic pull
  useGSAP(() => {
    if (!waButtonRef.current || !fbButtonRef.current) return;

    const setupHover = (el: HTMLAnchorElement, hoverShadow: string) => {
      const handleMouseEnter = () => {
        gsap.to(el, {
          scale: 1.15,
          boxShadow: hoverShadow,
          duration: 0.3,
          ease: 'power2.out',
        });
      };
      const handleMouseLeave = () => {
        gsap.to(el, {
          scale: 1,
          clearProps: 'boxShadow',
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      };
    };

    const cleanupWa = setupHover(waButtonRef.current, '0 8px 30px rgba(37, 211, 102, 0.35)');
    const cleanupFb = setupHover(fbButtonRef.current, '0 8px 30px rgba(24, 119, 242, 0.35)');

    return () => {
      cleanupWa?.();
      cleanupFb?.();
    };
  }, {});

  const whatsappLink = `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('السلام عليكم، أريد حجز رحلة')}`;
  const facebookLink = contactInfo.facebook;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 opacity-0 pointer-events-none"
    >
      {/* Facebook Button */}
      <a
        ref={fbButtonRef}
        href={facebookLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تابعنا على فيسبوك"
        className={cn(
          "flex items-center justify-center w-[52px] h-[52px] rounded-full",
          "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl",
          "border border-white/40 dark:border-gray-600/40",
          "shadow-[0_4px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.3)]",
          "text-[#1877F2] hover:text-white hover:bg-[#1877F2]",
          "transition-colors duration-300",
          "transform-gpu"
        )}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>

      {/* WhatsApp Button */}
      <a
        ref={waButtonRef}
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا عبر واتساب"
        className={cn(
          "relative flex items-center justify-center w-14 h-14 rounded-full",
          "bg-[#25D366] hover:bg-[#1EB854]",
          "shadow-[0_4px_20px_rgba(37,211,102,0.3)]",
          "text-white",
          "transition-colors duration-300",
          "transform-gpu"
        )}
      >
        {/* Breathing glow ring */}
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-full bg-[#25D366]/40 -z-10"
        />
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
