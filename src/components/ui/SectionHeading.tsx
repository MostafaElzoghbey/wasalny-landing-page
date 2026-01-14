import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({ 
  title, 
  subtitle, 
  centered = true,
  className 
}: SectionHeadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;

    const ctx = gsap.context(() => {
      // Fade in the container
      gsap.fromTo(
        container,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 92%',
            once: true,
          },
        }
      );

      // Animate the underline width
      gsap.fromTo(
        line,
        { width: 0 },
        {
          width: 96,
          duration: 0.5,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 92%',
            once: true,
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'mb-12 lg:mb-16',
        centered && 'text-center',
        className
      )}
    >
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--foreground))] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div 
        ref={lineRef}
        className={cn(
          'h-1 bg-gradient-to-l from-primary-500 to-primary-600 rounded-full mt-6',
          centered && 'mx-auto'
        )}
        style={{ width: 0 }}
      />
    </div>
  );
}
