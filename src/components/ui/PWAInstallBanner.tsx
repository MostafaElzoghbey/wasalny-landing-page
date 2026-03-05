import { useState, useRef, useEffect } from 'react';
import { Download, X, Star, Shield } from 'lucide-react';
import gsap, { useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { usePWAInstall } from '@/context/PWAInstallContext';
import { logoImage } from '@/data/cars';

const DISMISS_KEY = 'wasalny-pwa-banner-dismissed-at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  try {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;
    return Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function dismissBanner(): void {
  try {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

export function PWAInstallBanner() {
  const { isInstallable, installPWA } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => isDismissed());
  const [isReady, setIsReady] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const shouldShow = isInstallable && !dismissed && isReady;

  useEffect(() => {
    if (!isInstallable || dismissed) return;
    const timer = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(timer);
  }, [isInstallable, dismissed]);

  useGSAP(() => {
    if (!bannerRef.current) return;

    const tween = gsap.to(bannerRef.current, {
      y: shouldShow ? 0 : 120,
      opacity: shouldShow ? 1 : 0,
      pointerEvents: shouldShow ? 'auto' : 'none',
      duration: 0.55,
      ease: shouldShow ? 'back.out(1.4)' : 'power3.in',
    });

    return () => { tween.kill(); };
  }, { dependencies: [shouldShow] });

  const handleDismiss = () => {
    setDismissed(true);
    dismissBanner();
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
        'fixed bottom-0 start-0 end-0 z-50',
        'translate-y-[120px] opacity-0 pointer-events-none'
      )}
      role="region"
      aria-live="polite"
      aria-label="تثبيت التطبيق"
    >
      {/* Gradient border top */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className={cn(
        'bg-[hsl(var(--card)/0.97)] backdrop-blur-xl',
        'shadow-[0_-8px_32px_hsl(var(--shadow-color)/0.18)]',
        'px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]'
      )}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {/* App Icon */}
          <div className="relative shrink-0">
            <img
              src={logoImage}
              alt="وصلني"
              className="w-14 h-14 rounded-2xl object-cover shadow-md shadow-primary-500/20"
            />
            {/* Verified badge */}
            <div className="absolute -bottom-1 -end-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[hsl(var(--foreground))]">
              وصلني
            </p>
            {/* Stars */}
            <div className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3 h-3',
                    i < 4
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-amber-400/50 text-amber-400/50'
                  )}
                />
              ))}
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] ms-1">
                خدمة نقل موثوقة
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              تجربة أسرع · يعمل بدون إنترنت
            </p>
          </div>

          {/* Actions */}
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
              className={cn(
                'p-3 rounded-xl',
                'text-[hsl(var(--muted-foreground))]',
                'hover:text-[hsl(var(--foreground))]',
                'hover:bg-[hsl(var(--muted))]',
                'transition-colors',
                'touch-manipulation'
              )}
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
