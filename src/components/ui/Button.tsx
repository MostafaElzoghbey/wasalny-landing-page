import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useMagneticButton } from '@/hooks/useAnimations';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  magnetic?: boolean;
  magneticStrength?: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'start',
  loading = false,
  magnetic = false,
  magneticStrength = 0.3,
  children,
  className,
  disabled,
  onClick,
  type = 'button',
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  
  // Apply magnetic effect only when enabled and not disabled
  useMagneticButton(magnetic && !disabled ? buttonRef : { current: null }, magneticStrength);

  // Hover and tap effects
  useGSAP(() => {
    if (!buttonRef.current || disabled) return;

    const el = buttonRef.current;

    const handleMouseEnter = () => {
      gsap.to(el, { scale: 1.02, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseDown = () => {
      gsap.to(el, { scale: 0.98, duration: 0.1, ease: 'power2.out' });
    };

    const handleMouseUp = () => {
      gsap.to(el, { scale: 1.02, duration: 0.1, ease: 'power2.out' });
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
    };
  }, { dependencies: [disabled] });

  // Spinner animation
  useGSAP(() => {
    if (!spinnerRef.current || !loading) return;

    gsap.to(spinnerRef.current, {
      rotation: 360,
      duration: 1,
      ease: 'none',
      repeat: -1
    });
  }, { dependencies: [loading] });

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-[hsl(var(--foreground))]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <div
          ref={spinnerRef}
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
        />
      ) : (
        <>
          {Icon && iconPosition === 'start' && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === 'end' && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
}
