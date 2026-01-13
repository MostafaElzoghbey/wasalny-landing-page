import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { hoverLift, fadeInUp, viewportConfig } from '@/lib/animations';
import { forwardRef } from 'react';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hover = true, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('card', hover && 'card-hover', className)}
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        whileHover={hover ? 'hover' : undefined}
        custom={delay}
        transition={{ delay: delay * 0.1 }}
        {...(hover && { variants: { ...fadeInUp, ...hoverLift } })}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
