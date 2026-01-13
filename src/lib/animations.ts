import type { Variants } from 'framer-motion';

// Fade up animation for section entries
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: 'easeOut' } 
  }
};

// Fade in from right (RTL aware - will come from left visually)
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.6, ease: 'easeOut' } 
  }
};

// Fade in from left (RTL aware - will come from right visually)
export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.6, ease: 'easeOut' } 
  }
};

// Scale up animation
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.5, ease: 'easeOut' } 
  }
};

// Stagger container for child animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// Stagger container with faster stagger
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// Float animation for hero elements
export const floatAnimation: Variants = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity
    }
  }
};

// Hover scale for cards
export const hoverScale: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05, 
    transition: { duration: 0.3, ease: 'easeOut' } 
  }
};

// Hover lift for cards
export const hoverLift: Variants = {
  rest: { y: 0, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  hover: { 
    y: -8, 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: { duration: 0.3, ease: 'easeOut' } 
  }
};

// 3D perspective hover for car cards
export const hover3D: Variants = {
  rest: { 
    scale: 1, 
    rotateY: 0, 
    rotateX: 0 
  },
  hover: { 
    scale: 1.05, 
    rotateY: 5, 
    rotateX: -3,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 20 
    } 
  }
};

// Pulse animation for buttons
export const pulseAnimation: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity
    }
  }
};

// Slide in from bottom with spring
export const slideInSpring: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

// Rotate in animation
export const rotateIn: Variants = {
  hidden: { rotate: -10, opacity: 0, scale: 0.9 },
  visible: {
    rotate: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

// Draw SVG path animation
export const drawPath: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 2, ease: 'easeInOut' },
      opacity: { duration: 0.5 }
    }
  }
};

// Tab content animation
export const tabContent: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

// Counter animation helper
export const counterVariants = {
  duration: 2,
  ease: 'easeOut' as const
};

// Viewport config for scroll-triggered animations
export const viewportConfig = {
  once: true,
  margin: '-100px' as const
};
