import { useRef } from 'react';
import { Shield, Star, Clock, Wallet, Headphones, MapPin } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useCounterAnimation, useBatchReveal } from '@/hooks/useAnimations';
import { stats } from '@/data/content';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const iconMap = {
  shield: Shield,
  star: Star,
  clock: Clock,
  wallet: Wallet,
  headphones: Headphones,
  mapPin: MapPin,
};

const features = [
  {
    id: 'safety',
    title: 'أمان تام',
    description: 'سائقين محترفين ومرخصين مع خبرة طويلة في القيادة الآمنة',
    icon: 'shield',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'comfort',
    title: 'راحة فائقة',
    description: 'سيارات حديثة ومكيفة ونظيفة لرحلة مريحة',
    icon: 'star',
    color: 'from-yellow-500 to-amber-600',
  },
  {
    id: 'punctuality',
    title: 'التزام بالمواعيد',
    description: 'نصل في الموعد المحدد دائماً دون تأخير',
    icon: 'clock',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'pricing',
    title: 'أسعار مناسبة',
    description: 'أفضل الأسعار في السوق مع جودة خدمة عالية',
    icon: 'wallet',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'availability',
    title: 'متاحين 24/7',
    description: 'خدمتنا متاحة على مدار الساعة طوال أيام الأسبوع',
    icon: 'headphones',
    color: 'from-red-500 to-rose-600',
  },
  {
    id: 'tracking',
    title: 'سهولة الحجز',
    description: 'احجز رحلتك بسهولة عبر الهاتف أو واتساب',
    icon: 'mapPin',
    color: 'from-cyan-500 to-teal-600',
  },
];

function GSAPCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const elementRef = useRef<HTMLSpanElement>(null);
  
  useCounterAnimation(elementRef, value, {
    duration: 2.5,
    ease: "power2.out",
    scrollTrigger: {
      trigger: elementRef.current,
      start: "top 85%",
    }
  });

  return (
    <span ref={elementRef}>0{suffix}</span>
  );
}

interface StatCardProps {
  stat: typeof stats[0];
}

const StatCard = ({ stat }: StatCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    const handleMouseEnter = () => {
      gsap.to(card, { scale: 1.05, y: -5, duration: 0.15, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(card, { scale: 1, y: 0, duration: 0.15, ease: 'power2.out' });
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
      className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white py-8 cursor-pointer"
    >
      <div className="text-4xl sm:text-5xl font-bold mb-2">
        <GSAPCounter value={stat.value} suffix={stat.suffix} />
      </div>
      <div className="text-primary-100 font-medium">{stat.label}</div>
    </div>
  );
};

interface FeatureCardProps {
  feature: typeof features[0];
}

const FeatureCard = ({ feature }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const Icon = iconMap[feature.icon as keyof typeof iconMap];

  useGSAP(() => {
    if (!cardRef.current || !iconRef.current) return;

    const card = cardRef.current;
    const icon = iconRef.current;

    const handleMouseEnter = () => {
      gsap.to(card, { y: -5, duration: 0.15, ease: 'power2.out' });
      // Wiggle and scale icon
      const tl = gsap.timeline();
      tl.to(icon, { rotation: -10, scale: 1.1, duration: 0.08, ease: 'power2.out' })
        .to(icon, { rotation: 10, duration: 0.08, ease: 'power2.out' })
        .to(icon, { rotation: 0, duration: 0.08, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(card, { y: 0, duration: 0.15, ease: 'power2.out' });
      gsap.to(icon, { scale: 1, rotation: 0, duration: 0.1, ease: 'power2.out' });
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
      className="card h-full relative overflow-hidden cursor-pointer"
    >
      {/* Gradient Background on Hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div
          ref={iconRef}
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold mb-3 text-[hsl(var(--foreground))]">
          {feature.title}
        </h3>
        <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );
};

export function FeaturesSection() {
  const [statsRef] = useBatchReveal({
    selector: '.stat-card',
    interval: 0.2,
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 }
  });

  const [featuresRef] = useBatchReveal({
    selector: '.feature-card',
    interval: 0.1,
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 }
  });

  return (
    <section id="features" className="section-padding relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-50/30 to-transparent dark:via-primary-950/10" />
      
      <div className="section-container relative z-10">
        <SectionHeading
          title="لماذا وصلني؟"
          subtitle="مميزات تجعلنا الاختيار الأول لنقل الركاب في دمياط"
        />

        {/* Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="stat-card text-center"
            >
              <StatCard stat={stat} />
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div
          ref={featuresRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature) => (
            <div
              key={feature.id}
              className="feature-card group"
            >
              <FeatureCard feature={feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
