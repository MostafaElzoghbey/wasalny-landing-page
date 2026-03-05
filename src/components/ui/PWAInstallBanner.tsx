import { useState, useRef, useEffect } from 'react';
import { Download, X, Star, Shield } from 'lucide-react';
import gsap, { useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { usePWAInstall } from '@/context/PWAInstallContext';

const DISMISS_KEY = 'wasalny-pwa-banner-dismissed-at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  try {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;
    return Date.now() - Number.parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;
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

interface PWAInstallBannerProps {
  readonly logoSrc: string;
}

export function PWAInstallBanner({ logoSrc }: PWAInstallBannerProps) {
  const { isInstallable, installPWA } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => isDismissed());
  const [isReady, setIsReady] = useState(false);
  const bannerRef = useRef<HTMLElement>(null);
  const hasInit = useRef(false);

  const shouldShow = isInstallable && !dismissed && isReady;

  useEffect(() => {
    if (!isInstallable || dismissed) return;
    const timer = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(timer);
  }, [isInstallable, dismissed]);

  useGSAP(() => {
    if (!bannerRef.current) return;
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    const hiddenY = desktop ? 20 : 120;
    const showEase = desktop ? 'power3.out' : 'back.out(1.4)';

    if (!hasInit.current) {
      gsap.set(bannerRef.current, { y: hiddenY, opacity: 0, pointerEvents: 'none' });
      hasInit.current = true;
      if (!shouldShow) return;
    }

    const tween = gsap.to(bannerRef.current, {
      y: shouldShow ? 0 : hiddenY,
      opacity: shouldShow ? 1 : 0,
      pointerEvents: shouldShow ? 'auto' : 'none',
      duration: 0.55,
      ease: shouldShow ? showEase : 'power3.in',
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
    <section
      ref={bannerRef}
      className={cn(
        'fixed bottom-0 start-0 end-0 md:bottom-6 md:start-auto md:end-6 md:w-full md:max-w-xs z-50'
      )}
      aria-live="polite"
      aria-label="تثبيت التطبيق"
    >
      {/* Mobile bottom sheet — hidden on desktop */}
      <div className="md:hidden">
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
                src={logoSrc}
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

      {/* Desktop card — hidden on mobile */}
      <div className="hidden md:flex flex-col bg-[hsl(var(--card)/0.97)] backdrop-blur-xl rounded-2xl border border-[hsl(var(--border))] shadow-[0_8px_32px_hsl(var(--shadow-color)/0.18)] overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative shrink-0">
              <img src={logoSrc} alt="وصلني" className="w-12 h-12 rounded-2xl object-cover shadow-md shadow-primary-500/20" />
              <div className="absolute -bottom-1 -end-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[hsl(var(--foreground))]">ثبّت تطبيق وصلني</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-3 h-3', i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400/50 text-amber-400/50')} />
                ))}
              </div>
            </div>
            <button onClick={handleDismiss} className="shrink-0 p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors" aria-label="إغلاق">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">تجربة أسرع · يعمل بدون إنترنت</p>
          <Button variant="primary" size="sm" icon={Download} onClick={handleInstall} className="w-full">تثبيت التطبيق</Button>
        </div>
      </div>
    </section>
  );
}
