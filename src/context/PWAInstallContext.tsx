import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { BeforeInstallPromptEvent } from '@/types';

interface PWAInstallContextType {
  readonly isInstallable: boolean;
  readonly installPWA: () => Promise<void>;
}

interface PWAInstallProviderProps {
  readonly children: React.ReactNode;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export function PWAInstallProvider({ children }: PWAInstallProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    globalThis.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    globalThis.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      globalThis.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      globalThis.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[PWA] install prompt failed:', err);
      }
    } finally {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  }, [deferredPrompt]);

  const contextValue = useMemo<PWAInstallContextType>(
    () => ({ isInstallable, installPWA }),
    [isInstallable, installPWA]
  );

  return (
    <PWAInstallContext.Provider value={contextValue}>
      {children}
    </PWAInstallContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (context === undefined) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
}
