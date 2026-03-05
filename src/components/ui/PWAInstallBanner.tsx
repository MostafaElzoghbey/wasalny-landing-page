import { useState, useRef, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import gsap, { useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { logoImage } from '@/data/cars';

const DISMISS_KEY = 'wasalny-pwa-banner-dismissed';

export function PWAInstallBanner() {
  const { isInstallable, installPWA } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isReady, setIsReady] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const shouldShow = isInstallable && !isDismissed && isReady;

  useEffect(() => {
    if (!isInstallable || isDismissed) return;

    const timer = setTimeout(() => {
      setIsReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstallable, isDismissed]);

  useGSAP(() => {
    if (!bannerRef.current) return;

    const tween = gsap.to(bannerRef.current, {
      y: shouldShow ? 0 : 120,
      opacity: shouldShow ? 1 : 0,
      duration: 0.5,
      ease: shouldShow ? 'back.out(1.4)' : 'power3.in',
    });

    return () => { tween.kill(); };
  }, { dependencies: [shouldShow] });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // sessionStorage may be unavailable in private browsing
    }
  };

  const handleInstall = () => {
    void installPWA();
    handleDismiss();
  };

  if (!isInstallable) return null;

  return (
    <div
      ref={bannerRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'p-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
        'bg-[hsl(var(--card)/0.95)] backdrop-blur-xl',
        'border-t border-[hsl(var(--border))]',
        'shadow-[0_-4px_20px_hsl(var(--shadow-color)/0.15)]',
        'translate-y-[120px] opacity-0 pointer-events-none'
      )}
      role="alert"
      aria-label="تثبيت التطبيق"
    >
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <img
          src={logoImage}
          alt="وصلني"
          className="w-12 h-12 rounded-xl object-cover shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[hsl(var(--foreground))]">
            تثبيت تطبيق وصلني
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
            احصل على تجربة أسرع وأسهل
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleInstall}
          >
            تثبيت
          </Button>
          <button
            onClick={handleDismiss}
            className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors rounded-lg"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
