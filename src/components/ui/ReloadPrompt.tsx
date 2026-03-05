import { useRef, useEffect } from 'react';
import { RefreshCw, X, Wifi } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import gsap, { useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function ReloadPrompt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInit = useRef<boolean>(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (import.meta.env.DEV) {
        console.log('SW Registered:', r);
      }
    },
    onRegisterError(error) {
      if (import.meta.env.DEV) {
        console.error('SW registration error', error);
      }
    },
  });

  const shouldShow = offlineReady || needRefresh;

  // Auto-dismiss offline-ready after 4s (it's informational, not actionable)
  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => {
      setOfflineReady(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  useGSAP(() => {
    if (!containerRef.current) return;

    if (!hasInit.current) {
      gsap.set(containerRef.current, { y: -100, opacity: 0, pointerEvents: 'none' });
      hasInit.current = true;
      if (!shouldShow) return;
    }

    const tween = gsap.to(containerRef.current, {
      y: shouldShow ? 0 : -100,
      opacity: shouldShow ? 1 : 0,
      pointerEvents: shouldShow ? 'auto' : 'none',
      duration: 0.5,
      ease: shouldShow ? 'back.out(1.4)' : 'power3.in',
    });

    return () => { tween.kill(); };
  }, { dependencies: [shouldShow] });

  const handleClose = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      ref={containerRef}
      role={shouldShow ? 'status' : undefined}
      aria-live={shouldShow ? 'polite' : undefined}
      aria-atomic={shouldShow ? 'true' : undefined}
      aria-hidden={shouldShow ? undefined : 'true'}
      inert={!shouldShow || undefined}
      className={cn(
        'fixed top-20 end-4 z-[60]',
        'w-full max-w-sm',
        'bg-[hsl(var(--card)/0.97)] backdrop-blur-xl',
        'border border-[hsl(var(--border))]',
        'rounded-2xl',
        'shadow-[0_8px_32px_hsl(var(--shadow-color)/0.18)]',
        'p-4'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
          needRefresh
            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
        )}>
          {needRefresh ? (
            <RefreshCw className="w-5 h-5" />
          ) : (
            <Wifi className="w-5 h-5" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[hsl(var(--foreground))]">
            {needRefresh ? 'تحديث متاح' : 'وضع عدم الاتصال'}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {needRefresh
              ? 'يوجد إصدار جديد، انقر للتحديث'
              : 'التطبيق يعمل بدون إنترنت الآن'}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={handleClose}
          disabled={!shouldShow}
          tabIndex={shouldShow ? 0 : -1}
          className="shrink-0 p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {needRefresh && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={async () => {
              try {
                await updateServiceWorker(true);
              } catch (err) {
                if (import.meta.env.DEV) {
                  console.error('[SW] update failed:', err);
                }
              }
            }}
          >
            تحديث الآن
          </Button>
        </div>
      )}
    </div>
  );
}
