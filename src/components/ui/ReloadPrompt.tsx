import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-[hsl(var(--card))] shadow-xl rounded-xl border border-[hsl(var(--border))] max-w-sm animate-slide-up flex flex-col gap-3">
      <div className="text-sm text-[hsl(var(--foreground))] font-medium">
        {offlineReady ? (
          <span>التطبيق جاهز للعمل بدون إنترنت</span>
        ) : (
          <span>يوجد تحديث جديد متاح، انقر لتحديث التطبيق.</span>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        {needRefresh && (
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={() => updateServiceWorker(true)}
          >
            تحديث
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          icon={X}
          onClick={close}
        >
          إغلاق
        </Button>
      </div>
    </div>
  );
}