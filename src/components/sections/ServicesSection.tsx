import { useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plane, Car, Users } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useBatchReveal, useTiltEffect } from '@/hooks/useAnimations';

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
          {services.map((service) => {
            const Icon = iconMap[service.icon as keyof typeof iconMap];
            
            return (
              <TiltCard
                key={service.id}
                className="service-card group h-full"
              >
                <motion.div
                  className="card h-full text-center cursor-pointer bg-white dark:bg-gray-800 shadow-sm hover:shadow-xl transition-shadow duration-300"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Icon Container */}
                  <motion.div
                    className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${service.bgColor} flex items-center justify-center relative overflow-hidden`}
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Gradient Overlay on Hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    <Icon className={`w-10 h-10 relative z-10 text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors duration-300`} />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-[hsl(var(--foreground))] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {service.description}
                  </p>

                  {/* Animated Line */}
                  <motion.div
                    className={`h-1 w-0 mx-auto mt-6 rounded-full bg-gradient-to-l ${service.color}`}
                    whileHover={{ width: '50%' }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
