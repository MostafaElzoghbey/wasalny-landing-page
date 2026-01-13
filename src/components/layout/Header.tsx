import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { logoImage } from '@/data/cars';
import { contactInfo } from '@/data/content';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
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

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavClick: (href: string) => void;
}

const MobileMenu = ({ isOpen, onClose, onNavClick }: MobileMenuProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const animateIn = useCallback(() => {
    if (!containerRef.current || !backdropRef.current || !panelRef.current) return;
    
    setIsVisible(true);
    
    gsap.fromTo(backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: -20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
    );

    // Stagger nav links
    const navButtons = panelRef.current.querySelectorAll('.nav-link-item');
    gsap.fromTo(navButtons,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
    );
  }, []);

  const animateOut = useCallback(() => {
    if (!backdropRef.current || !panelRef.current) return;
    
    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    });
    
    gsap.to(panelRef.current, {
      opacity: 0,
      y: -20,
      scale: 0.95,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setIsVisible(false);
        onClose();
      }
    });
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      animateIn();
    }
  }, [isOpen, animateIn]);

  const handleClose = () => {
    animateOut();
  };

  const handleNavClick = (href: string) => {
    onNavClick(href);
    animateOut();
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 lg:hidden"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0"
        onClick={handleClose}
      />

      {/* Menu Panel */}
      <nav
        ref={panelRef}
        className="absolute top-20 left-4 right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden opacity-0"
      >
        <div className="p-6 space-y-4">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="nav-link-item block w-full text-right py-3 px-4 text-lg font-medium text-[hsl(var(--foreground))] hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 rounded-xl transition-colors"
            >
              {link.label}
            </button>
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
      </nav>
    </div>
  );
};

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Header entrance animation
  useGSAP(() => {
    gsap.fromTo(headerRef.current,
      { y: -100 },
      { y: 0, duration: 0.5, ease: 'power2.out' }
    );
  }, {});

  // Scroll-triggered header shrink
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

  // Logo hover effect
  useGSAP(() => {
    if (!logoRef.current) return;
    
    const el = logoRef.current;
    
    const handleMouseEnter = () => {
      gsap.to(el, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
    };
    
    const handleMouseLeave = () => {
      gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    const handleMouseDown = () => {
      gsap.to(el, { scale: 0.95, duration: 0.1, ease: 'power2.out' });
    };

    const handleMouseUp = () => {
      gsap.to(el, { scale: 1.05, duration: 0.1, ease: 'power2.out' });
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
  }, {});

  // Menu button tap effect
  useGSAP(() => {
    if (!menuButtonRef.current) return;
    
    const el = menuButtonRef.current;
    
    const handleMouseDown = () => {
      gsap.to(el, { scale: 0.9, duration: 0.1, ease: 'power2.out' });
    };

    const handleMouseUp = () => {
      gsap.to(el, { scale: 1, duration: 0.1, ease: 'power2.out' });
    };
    
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mouseleave', handleMouseUp);
    
    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mouseleave', handleMouseUp);
    };
  }, {});

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-5"
      >
        <div 
          ref={bgRef}
          className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-lg opacity-0 -z-10 transition-colors duration-300"
        />
        
        <div className="section-container">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a
              ref={logoRef}
              href="#home"
              className="flex items-center gap-3"
            >
              <img
                src={logoImage}
                alt="وصلني"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <span className="text-2xl font-bold gradient-text hidden sm:block">
                وصلني
              </span>
            </a>

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
              <button
                ref={menuButtonRef}
                className="p-2 text-[hsl(var(--foreground))]"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavClick={handleNavClick}
      />
    </>
  );
}
