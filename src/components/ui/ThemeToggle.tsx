import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

const themes = [
  { id: 'light', icon: Sun, label: 'فاتح' },
  { id: 'dark', icon: Moon, label: 'داكن' },
  { id: 'system', icon: Monitor, label: 'تلقائي' },
] as const;

function ThemeButton({ 
  Icon, 
  isActive, 
  onClick 
}: { 
  Icon: typeof Sun; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!indicatorRef.current) return;
    
    if (isActive) {
      gsap.to(indicatorRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.7)',
      });
    } else {
      gsap.to(indicatorRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        ease: 'power2.in',
      });
    }
  }, [isActive]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseEnter = () => {
      gsap.to(button, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(button, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseDown = () => {
      gsap.to(button, { scale: 0.95, duration: 0.1, ease: 'power2.out' });
    };

    const handleMouseUp = () => {
      gsap.to(button, { scale: 1.05, duration: 0.1, ease: 'power2.out' });
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mousedown', handleMouseDown);
    button.addEventListener('mouseup', handleMouseUp);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mousedown', handleMouseDown);
      button.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg transition-colors duration-200',
        isActive
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      )}
    >
      <div
        ref={indicatorRef}
        className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
        style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'scale(1)' : 'scale(0.8)' }}
      />
      <Icon className="relative z-10 w-5 h-5" />
    </button>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
      {themes.map(({ id, icon: Icon }) => (
        <ThemeButton
          key={id}
          Icon={Icon}
          isActive={theme === id}
          onClick={() => setTheme(id)}
        />
      ))}
    </div>
  );
}
