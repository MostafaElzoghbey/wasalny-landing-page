import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'light', icon: Sun, label: 'فاتح' },
  { id: 'dark', icon: Moon, label: 'داكن' },
  { id: 'system', icon: Monitor, label: 'تلقائي' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
      {themes.map(({ id, icon: Icon }) => (
        <motion.button
          key={id}
          onClick={() => setTheme(id)}
          className={cn(
            'relative p-2 rounded-lg transition-colors duration-200',
            theme === id
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {theme === id && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className="relative z-10 w-5 h-5" />
        </motion.button>
      ))}
    </div>
  );
}
