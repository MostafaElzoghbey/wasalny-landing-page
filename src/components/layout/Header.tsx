import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { logoImage } from '@/data/cars';
import { contactInfo } from '@/data/content';
import gsap, { useGSAP } from '@/lib/gsap';
import { useMagneticButton } from '@/hooks/useAnimations';

const navLinks = [
  { href: '#home', label: 'الرئيسية' },
  { href: '#services', label: 'خدماتنا' },
  { href: '#fleet', label: 'أسطولنا' },
  { href: '#routes', label: 'مساراتنا' },
  { href: '#features', label: 'مميزاتنا' },
  { href: '#contact', label: 'تواصل معنا' },
];

const MagneticNavLink = ({ href, label, onClick }: { href: string, label: string, onClick: (href: string) => void }) => {
  const ref = useRef<HTMLButtonElement>(null);
  useMagneticButton(ref);

  return (
    <button
      ref={ref}
      onClick={() => onClick(href)}
      className="text-[hsl(var(--foreground))] hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors px-2 py-1"
    >
      {label}
    </button>
  );
};

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "+=100",
        scrub: 0.5,
      }
    });

    if (bgRef.current) {
      tl.to(bgRef.current, {
        opacity: 1,
        ease: "none"
      }, 0);
    }
    
    if (headerRef.current) {
      tl.to(headerRef.current, {
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        ease: "none"
      }, 0);
    }
  }, { scope: headerRef });

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-5"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div 
          ref={bgRef}
          className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-lg opacity-0 -z-10 transition-colors duration-300"
        />
        
        <div className="section-container">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.a
              href="#home"
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={logoImage}
                alt="وصلني"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <span className="text-2xl font-bold gradient-text hidden sm:block">
                وصلني
              </span>
            </motion.a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <MagneticNavLink 
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={handleNavClick}
                />
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <ThemeToggle />
              <Button
                variant="primary"
                size="sm"
                icon={Phone}
                onClick={() => window.open(`tel:${contactInfo.phone}`)}
              >
                اتصل الآن
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-3">
              <ThemeToggle />
              <motion.button
                className="p-2 text-[hsl(var(--foreground))]"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.9 }}
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Menu Panel */}
            <motion.nav
              className="absolute top-20 left-4 right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 space-y-4">
                {navLinks.map((link, index) => (
                  <motion.button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className="block w-full text-right py-3 px-4 text-lg font-medium text-[hsl(var(--foreground))] hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 rounded-xl transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {link.label}
                  </motion.button>
                ))}
                <div className="pt-4 border-t border-[hsl(var(--border))]">
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={Phone}
                    onClick={() => window.open(`tel:${contactInfo.phone}`)}
                  >
                    اتصل الآن
                  </Button>
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
