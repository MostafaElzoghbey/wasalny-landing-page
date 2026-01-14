import { useRef, useEffect } from 'react';
import { MapPin, Clock, ArrowLeft } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { routes } from '@/data/content';
import { useBatchReveal, useDrawPath } from '@/hooks/useAnimations';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface RouteCardProps {
  route: typeof routes[0];
}

const RouteCard = ({ route }: RouteCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    const handleMouseEnter = () => {
      gsap.to(card, { x: -10, scale: 1.02, duration: 0.15, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(card, { x: 0, scale: 1, duration: 0.15, ease: 'power2.out' });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, {});

  // Arrow bounce animation
  useGSAP(() => {
    if (!arrowRef.current) return;

    gsap.to(arrowRef.current, {
      x: -5,
      duration: 0.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  }, {});

  return (
    <div
      ref={cardRef}
      className="card flex items-center gap-6 cursor-pointer"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-300">
        <MapPin className="w-8 h-8 text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold text-lg text-[hsl(var(--foreground))]">
            {route.from}
          </span>
          <ArrowLeft className="w-5 h-5 text-primary-500 flip-rtl" />
          <span className="font-bold text-lg text-[hsl(var(--foreground))]">
            {route.to}
          </span>
        </div>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mb-2">
          {route.description}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary-500" />
          <span className="text-primary-600 dark:text-primary-400 font-medium">
            {route.duration}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div
        ref={arrowRef}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ArrowLeft className="w-6 h-6 text-primary-500 flip-rtl" />
      </div>
    </div>
  );
};

export function RoutesSection() {
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const nilePathRef = useRef<SVGPathElement>(null);
  const damiettaRef = useRef<SVGGElement>(null);
  const cairoRef = useRef<SVGGElement>(null);
  const airportRef = useRef<SVGGElement>(null);
  const pulse1Ref = useRef<SVGCircleElement>(null);
  const pulse2Ref = useRef<SVGCircleElement>(null);
  const pulse3Ref = useRef<SVGCircleElement>(null);
  const carRef = useRef<SVGCircleElement>(null);

  useDrawPath(path1Ref, { scrub: true });
  useDrawPath(path2Ref, { scrub: true });

  const [containerRef] = useBatchReveal({
    selector: '.route-card',
    interval: 0.1
  });

  // Map container entrance animation
  useGSAP(() => {
    if (!mapContainerRef.current) return;

    gsap.fromTo(mapContainerRef.current,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: mapContainerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, {});

  // Nile path draw animation
  useGSAP(() => {
    if (!nilePathRef.current) return;

    const path = nilePathRef.current;
    const length = path.getTotalLength();

    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 });

    gsap.to(path, {
      strokeDashoffset: 0,
      opacity: 1,
      duration: 2,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: path,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });
  }, {});

  // Location markers entrance animations
  useGSAP(() => {
    // Damietta
    if (damiettaRef.current) {
      gsap.fromTo(damiettaRef.current,
        { scale: 0, opacity: 0, transformOrigin: 'center' },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: damiettaRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          delay: 0.5
        }
      );
    }

    // Cairo
    if (cairoRef.current) {
      gsap.fromTo(cairoRef.current,
        { scale: 0, opacity: 0, transformOrigin: 'center' },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: cairoRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          delay: 1
        }
      );
    }

    // Airport
    if (airportRef.current) {
      gsap.fromTo(airportRef.current,
        { scale: 0, opacity: 0, transformOrigin: 'center' },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: airportRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          delay: 1.5
        }
      );
    }
  }, {});

  // Pulse animations for location markers
  useGSAP(() => {
    const pulseAnimation = (ref: SVGCircleElement | null, delay: number) => {
      if (!ref) return;
      gsap.fromTo(ref,
        { attr: { r: 12 }, opacity: 1 },
        {
          attr: { r: 30 },
          opacity: 0,
          duration: 2,
          ease: 'power2.out',
          repeat: -1,
          delay
        }
      );
    };

    pulseAnimation(pulse1Ref.current, 0);
    pulseAnimation(pulse2Ref.current, 0.5);
    pulseAnimation(pulse3Ref.current, 1);
  }, {});

  // Animated car along path
  useEffect(() => {
    if (!carRef.current || !path1Ref.current) return;

    const path = path1Ref.current;
    const car = carRef.current;
    const pathLength = path.getTotalLength();

    const animateCar = () => {
      gsap.fromTo({ progress: 0 },
        { progress: 0 },
        {
          progress: 1,
          duration: 4,
          ease: 'linear',
          repeat: -1,
          repeatDelay: 2,
          onUpdate: function() {
            const progress = this.targets()[0].progress;
            const point = path.getPointAtLength(progress * pathLength);
            gsap.set(car, { attr: { cx: point.x, cy: point.y } });
          }
        }
      );
    };

    // Start animation after initial scroll trigger
    ScrollTrigger.create({
      trigger: path,
      start: 'top 85%',
      onEnter: animateCar,
      once: true
    });
  }, []);

  return (
    <section id="routes" className="section-padding relative overflow-hidden bg-[hsl(var(--muted))]/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="section-container relative z-10">
        <SectionHeading
          title="مساراتنا"
          subtitle="نغطي المسارات الرئيسية بين دمياط والقاهرة والمطار"
        />

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Animated Map */}
          <div
            ref={mapContainerRef}
            className="relative order-2 lg:order-1"
          >
            <div className="relative bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-950/20 rounded-3xl p-8 shadow-xl">
              {/* Simplified Egypt Map SVG */}
              <svg
                viewBox="0 0 400 500"
                className="w-full h-auto"
                style={{ maxHeight: '400px' }}
              >
                {/* Background */}
                <defs>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'var(--color-primary-200)', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--color-primary-400)', stopOpacity: 0.1 }} />
                  </linearGradient>
                </defs>

                {/* Nile Delta Region (simplified) */}
                <path
                  ref={nilePathRef}
                  d="M 100 150 Q 150 100 250 120 Q 350 140 380 200 Q 360 280 300 350 Q 250 400 200 380 Q 150 360 100 300 Q 80 220 100 150 Z"
                  fill="url(#mapGradient)"
                  stroke="var(--color-primary-400)"
                  strokeWidth="2"
                />

                {/* Route Line: Damietta to Cairo */}
                <path
                  ref={path1Ref}
                  d="M 320 140 C 280 180 240 220 200 320"
                  fill="none"
                  stroke="var(--color-primary-600)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 4"
                />

                {/* Route Line: Cairo to Airport */}
                <path
                  ref={path2Ref}
                  d="M 200 320 C 180 310 160 290 140 280"
                  fill="none"
                  stroke="var(--color-accent-500)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 4"
                />

                {/* Location: Damietta */}
                <g ref={damiettaRef}>
                  <circle cx="320" cy="140" r="20" fill="var(--color-primary-500)" opacity="0.2" />
                  <circle cx="320" cy="140" r="12" fill="var(--color-primary-600)" />
                  <circle
                    ref={pulse1Ref}
                    cx="320" cy="140" r="12"
                    fill="none"
                    stroke="var(--color-primary-500)"
                    strokeWidth="2"
                  />
                  <text x="320" y="100" textAnchor="middle" className="fill-[hsl(var(--foreground))] text-sm font-bold">
                    دمياط
                  </text>
                </g>

                {/* Location: Cairo */}
                <g ref={cairoRef}>
                  <circle cx="200" cy="320" r="25" fill="var(--color-primary-500)" opacity="0.2" />
                  <circle cx="200" cy="320" r="15" fill="var(--color-primary-600)" />
                  <circle
                    ref={pulse2Ref}
                    cx="200" cy="320" r="15"
                    fill="none"
                    stroke="var(--color-primary-500)"
                    strokeWidth="2"
                  />
                  <text x="200" y="365" textAnchor="middle" className="fill-[hsl(var(--foreground))] text-sm font-bold">
                    القاهرة
                  </text>
                </g>

                {/* Location: Airport */}
                <g ref={airportRef}>
                  <circle cx="140" cy="280" r="18" fill="var(--color-accent-500)" opacity="0.2" />
                  <circle cx="140" cy="280" r="10" fill="var(--color-accent-600)" />
                  <circle
                    ref={pulse3Ref}
                    cx="140" cy="280" r="10"
                    fill="none"
                    stroke="var(--color-accent-500)"
                    strokeWidth="2"
                  />
                  <text x="140" y="250" textAnchor="middle" className="fill-[hsl(var(--foreground))] text-xs font-bold">
                    المطار
                  </text>
                </g>

                {/* Animated Car */}
                <circle ref={carRef} r="8" fill="var(--color-accent-500)" cx="320" cy="140" />
              </svg>
            </div>
          </div>

          {/* Routes List */}
          <div
            ref={containerRef}
            className="order-1 lg:order-2 space-y-6"
          >
            {routes.map((route) => (
              <div
                key={route.id}
                className="route-card group"
              >
                <RouteCard route={route} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
