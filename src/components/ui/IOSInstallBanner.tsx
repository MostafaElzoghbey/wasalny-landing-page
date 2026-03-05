import { useState, useRef, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';
import gsap, { useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { IOSInstallBannerProps } from '@/types';

const DISMISS_KEY = 'wasalny-ios-banner-dismissed-at';
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

function isIOSDevice(): boolean {
  const isStandardIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIPadOS =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isStandardIOS || isIPadOS;
}

function isInStandaloneMode(): boolean {
  return (
    !!(window.navigator as { standalone?: boolean }).standalone ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function IOSInstallBanner({ logoSrc, className }: IOSInstallBannerProps) {
  const [dismissed, setDismissed] = useState(() => isDismissed());
  const [isReady, setIsReady] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const isEligible =
    typeof window !== 'undefined' && isIOSDevice() && !isInStandaloneMode();

  const shouldShow = isEligible && !dismissed && isReady;

  useEffect(() => {
    if (!isEligible || dismissed) return;
    const timer = setTimeout(() => setIsReady(true), 4000);
    return () => clearTimeout(timer);
  }, [isEligible, dismissed]);

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

  if (!isEligible) return null;

  return (
    <div
      ref={bannerRef}
      className={cn(
        'fixed bottom-0 start-0 end-0 z-50',
        'translate-y-[120px] opacity-0 pointer-events-none',
        className
      )}
      role="region"
      aria-live="polite"
      aria-label="تثبيت تطبيق وصلني على iOS"
    >
      {/* Gradient border top */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className={cn(
        'bg-[hsl(var(--card)/0.97)] backdrop-blur-xl',
        'shadow-[0_-8px_32px_hsl(var(--shadow-color)/0.18)]',
        'px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]'
      )}>
        <div className="max-w-lg mx-auto">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-3">
            <img
              src={logoSrc}
              alt="وصلني"
              className="w-12 h-12 rounded-2xl object-cover shadow-md shadow-primary-500/20 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[hsl(var(--foreground))]">
                ثبّت تطبيق وصلني
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                أضفه إلى الشاشة الرئيسية للوصول السريع
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className={cn(
                'shrink-0 p-3 rounded-xl',
                'text-[hsl(var(--muted-foreground))]',
                'hover:text-[hsl(var(--foreground))]',
                'hover:bg-[hsl(var(--muted))]',
                'transition-colors touch-manipulation'
              )}
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Steps */}
          <ol className="space-y-2">
            <li className="flex items-start gap-2.5 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                1
              </span>
              <span>
                اضغط على زر المشاركة{' '}
                <Share className="inline w-3.5 h-3.5 mb-0.5 text-primary-600" />{' '}
                في أسفل المتصفح
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                2
              </span>
              <span>
                اختر{' '}
                <strong className="text-[hsl(var(--foreground))] font-semibold">
                  إضافة إلى الشاشة الرئيسية
                </strong>{' '}
                <PlusSquare className="inline w-3.5 h-3.5 mb-0.5 text-primary-600" />
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                3
              </span>
              <span>
                اضغط{' '}
                <strong className="text-[hsl(var(--foreground))] font-semibold">
                  إضافة
                </strong>{' '}
                لتثبيت التطبيق
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
