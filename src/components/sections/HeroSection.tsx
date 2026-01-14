import { useRef } from 'react';
import { Phone, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { carImages } from '@/data/cars';
import { contactInfo } from '@/data/content';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useTextReveal, useFloatingAnimation, useParallax } from '@/hooks/useAnimations';

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const carImageRef = useRef<HTMLImageElement>(null);
  const circle1Ref = useRef<HTMLDivElement>(null);
  const circle2Ref = useRef<HTMLDivElement>(null);

  // Text Reveal for Title
  useTextReveal(titleRef, { type: 'words', stagger: 0.1, delay: 0.2 });

  // Floating Animation for Hero Image
  useFloatingAnimation(heroImageRef, { amplitude: 20, duration: 4 });

  // Parallax Background Blobs
  useParallax(blob1Ref, 0.2);
  useParallax(blob2Ref, -0.3);

  // All entrance animations
  useGSAP(() => {
    // Badge entrance
    gsap.fromTo(badgeRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 }
    );

    // Description entrance
    gsap.fromTo(descriptionRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.6 }
    );

    // CTA buttons entrance
    gsap.fromTo(ctaRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.8 }
    );

    // Stats Stagger Animation
    if (statsRef.current) {
      gsap.fromTo(statsRef.current.children,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power2.out', delay: 1 }
      );
    }

    // Hero Image Entrance
    gsap.fromTo(heroImageRef.current,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.5 }
    );

    // Center blob pulse animation
    gsap.to(blob3Ref.current, {
      scale: 1.1,
      duration: 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });

    // Rotating circles
    gsap.to(circle1Ref.current, {
      rotation: 360,
      duration: 20,
      ease: 'none',
      repeat: -1
    });
    gsap.to(circle2Ref.current, {
      rotation: -360,
      duration: 15,
      ease: 'none',
      repeat: -1
    });
  }, { scope: containerRef });

  // Car image hover effect
  useGSAP(() => {
    if (!carImageRef.current) return;
    
    const el = carImageRef.current;
    
    const handleMouseEnter = () => {
      gsap.to(el, { scale: 1.02, duration: 0.3, ease: 'power2.out' });
    };
    
    const handleMouseLeave = () => {
      gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out' });
    };
    
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, {});

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('مرحباً، أريد حجز رحلة')}`,
      '_blank'
    );
  };

  const handleCall = () => {
    window.open(`tel:${contactInfo.phone}`);
  };

  return (
    <section
      id="home"
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-32 lg:pt-24"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-bl from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950/30" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div ref={blob1Ref} className="absolute -top-40 -left-40 w-80 h-80 bg-primary-200/30 dark:bg-primary-500/10 rounded-full blur-3xl" />
        <div ref={blob2Ref} className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-200/30 dark:bg-accent-500/10 rounded-full blur-3xl" />
        <div
          ref={blob3Ref}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-300/20 dark:bg-primary-600/5 rounded-full blur-3xl"
        />
      </div>

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Content */}
          <div className="text-center lg:text-right">
            {/* Badge */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6 opacity-0"
            >
              <MapPin className="w-4 h-4" />
              <span>دمياط - القاهرة - المطار</span>
            </div>

            {/* Heading */}
            <h1 ref={titleRef} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6">
              <span className="text-[hsl(var(--foreground))]">خدمة نقل </span>
              <span className="text-primary-600 dark:text-primary-400">الركاب</span>
              <br />
              <span className="text-[hsl(var(--foreground))]">الأولى في </span>
              <span className="text-accent-500">دمياط</span>
            </h1>

            {/* Description */}
            <p
              ref={descriptionRef}
              className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] mb-8 max-w-xl mx-auto lg:mx-0 lg:mr-0 opacity-0"
            >
              رحلات مريحة وآمنة من دمياط إلى القاهرة والمطار. سيارات حديثة وسائقين محترفين في خدمتك على مدار الساعة.
            </p>

            {/* CTA Buttons */}
            <div
              ref={ctaRef}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0"
            >
              <Button
                variant="accent"
                size="lg"
                icon={MessageCircle}
                onClick={handleWhatsApp}
              >
                احجز عبر واتساب
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={Phone}
                onClick={handleCall}
              >
                اتصل الآن
              </Button>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="mt-12 grid grid-cols-3 gap-6">
              {[
                { value: '5000+', label: 'رحلة ناجحة' },
                { value: '3000+', label: 'عميل سعيد' },
                { value: '24/7', label: 'خدمة متاحة' },
              ].map((stat, index) => (
                <div key={index} className="text-center lg:text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative perspective-1000">
            {/* Main Car Image */}
            <div ref={heroImageRef} className="relative z-10 opacity-0 max-w-lg mx-auto lg:max-w-xl">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent rounded-3xl blur-2xl transform scale-95" />
                
                {/* Car Image */}
                <img
                  ref={carImageRef}
                  src={carImages.family_cruiser[0]}
                  alt="سيارة وصلني"
                  className="w-full h-auto rounded-3xl shadow-2xl cursor-pointer"
                />
              </div>
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
              <div
                ref={circle1Ref}
                className="absolute top-0 right-0 w-32 h-32 border-2 border-primary-200 dark:border-primary-800 rounded-full"
              />
              <div
                ref={circle2Ref}
                className="absolute bottom-0 left-0 w-24 h-24 border-2 border-accent-200 dark:border-accent-800 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
