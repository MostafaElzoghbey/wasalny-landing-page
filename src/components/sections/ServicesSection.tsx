import { useRef } from 'react';
import { MapPin, Plane, Car, Users } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useBatchReveal, useTiltEffect } from '@/hooks/useAnimations';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const iconMap = {
  route: MapPin,
  plane: Plane,
  car: Car,
  users: Users,
};

const services = [
  {
    id: 'damietta-cairo',
    title: 'دمياط - القاهرة',
    description: 'رحلات يومية مريحة من دمياط إلى القاهرة والعكس بأسعار مناسبة',
    icon: 'route',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    id: 'airport-transfer',
    title: 'توصيل المطار',
    description: 'خدمة توصيل من وإلى مطار القاهرة الدولي في أي وقت',
    icon: 'plane',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    id: 'private-trips',
    title: 'رحلات خاصة',
    description: 'احجز سيارة خاصة لرحلتك مع سائق محترف ومدرب',
    icon: 'car',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    id: 'group-travel',
    title: 'سفر جماعي',
    description: 'أسعار مميزة للمجموعات والرحلات الجماعية والشركات',
    icon: 'users',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
];

const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  useTiltEffect(cardRef, { max: 15, speed: 400, glare: true });

  return (
    <div ref={cardRef} className={`transform-gpu ${className}`}>
      {children}
    </div>
  );
};

interface ServiceCardProps {
  service: typeof services[0];
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconContainerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const Icon = iconMap[service.icon as keyof typeof iconMap];

  useGSAP(() => {
    if (!cardRef.current || !iconContainerRef.current || !lineRef.current) return;

    const card = cardRef.current;
    const iconContainer = iconContainerRef.current;
    const line = lineRef.current;

    const handleMouseEnter = () => {
      gsap.to(card, { scale: 1.02, duration: 0.15, ease: 'power2.out' });
      // Wiggle animation using timeline
      const tl = gsap.timeline();
      tl.to(iconContainer, { rotation: -5, duration: 0.08, ease: 'power2.out' })
        .to(iconContainer, { rotation: 5, duration: 0.08, ease: 'power2.out' })
        .to(iconContainer, { rotation: 0, duration: 0.08, ease: 'power2.out' });
      gsap.to(line, { width: '50%', duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(card, { scale: 1, duration: 0.15, ease: 'power2.out' });
      gsap.to(line, { width: 0, duration: 0.2, ease: 'power2.out' });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, {});

  return (
    <div
      ref={cardRef}
      className="relative h-full text-center cursor-pointer rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_-8px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_12px_40px_-8px_rgba(59,130,246,0.3)] transition-all duration-300 overflow-hidden"
    >
      {/* Subtle gradient border accent on top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${service.color} opacity-80`} />
      
      {/* Background gradient glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
      
      {/* Icon Container */}
      <div
        ref={iconContainerRef}
        className={`relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg`}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-1 rounded-xl bg-white/20 backdrop-blur-sm" />
        <Icon className="w-10 h-10 relative z-10 text-white drop-shadow-sm" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {service.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
        {service.description}
      </p>

      {/* Animated Line */}
      <div
        ref={lineRef}
        className={`h-1 w-0 mx-auto mt-6 rounded-full bg-gradient-to-l ${service.color}`}
      />
    </div>
  );
};

export function ServicesSection() {
  const [gridRef] = useBatchReveal({ 
    selector: '.service-card', 
    interval: 0.15,
    from: { opacity: 0, y: 50, rotateX: 10 },
    to: { opacity: 1, y: 0, rotateX: 0 }
  });

  return (
    <section id="services" className="section-padding relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[hsl(var(--muted))]/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="section-container relative z-10">
        <SectionHeading
          title="خدماتنا"
          subtitle="نقدم لكم أفضل خدمات النقل والتوصيل في دمياط والقاهرة"
        />

        <div
          ref={gridRef}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {services.map((service) => (
            <TiltCard
              key={service.id}
              className="service-card group h-full"
            >
              <ServiceCard service={service} />
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
