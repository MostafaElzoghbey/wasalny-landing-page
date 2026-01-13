import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Shield, Star, Clock, Wallet, Headphones, MapPin } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { staggerContainer, fadeInUp, viewportConfig } from '@/lib/animations';
import { stats } from '@/data/content';

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

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [rounded]);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 2, ease: 'easeOut' });
      return controls.stop;
    }
  }, [isInView, value, count]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref}>
      {displayValue}{suffix}
    </span>
  );
}

export function FeaturesSection() {
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
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              variants={fadeInUp}
              custom={index}
              className="text-center"
            >
              <motion.div
                className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white py-8"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-4xl sm:text-5xl font-bold mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-primary-100 font-medium">{stat.label}</div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            
            return (
              <motion.div
                key={feature.id}
                variants={fadeInUp}
                custom={index}
                className="group"
              >
                <motion.div
                  className="card h-full relative overflow-hidden"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Gradient Background on Hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  <div className="relative z-10">
                    {/* Icon */}
                    <motion.div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 text-[hsl(var(--foreground))]">
                      {feature.title}
                    </h3>
                    <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
