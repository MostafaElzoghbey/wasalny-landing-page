import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeInUp, viewportConfig } from '@/lib/animations';

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
  return (
    <motion.div
      className={cn(
        'mb-12 lg:mb-16',
        centered && 'text-center',
        className
      )}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      variants={fadeInUp}
    >
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--foreground))] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <motion.div 
        className={cn(
          'h-1 w-24 bg-gradient-to-l from-primary-500 to-primary-600 rounded-full mt-6',
          centered && 'mx-auto'
        )}
        initial={{ width: 0 }}
        whileInView={{ width: 96 }}
        viewport={viewportConfig}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
    </motion.div>
  );
}
