"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // ✅ التحقق من وضع التثبيت (standalone)
    const checkInstalled = () => {
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsInstalled(true);
      }
    };

    // استدعاء الدالة فوراً
    checkInstalled();

    // ✅ مستمع الحدث beforeinstallprompt
    const handleInstallable = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallable);

    // ✅ مستمع لتغير وضع العرض (في حال تغير من standalone إلى browser)
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallable);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setIsInstallable(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return { isInstallable, isInstalled, install };
}

export function useServiceWorker() {
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setSwRegistration(reg);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!swRegistration) return null;

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return null;

      const existing = await swRegistration.pushManager.getSubscription();
      if (existing) return existing;

      // Convert VAPID key
      const padding = "=".repeat((4 - (vapidPublicKey.length % 4)) % 4);
      const base64 = (vapidPublicKey + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: outputArray as any,
      });

      return subscription;
    } catch (err) {
      console.error("[PWA] Push subscription failed:", err);
      return null;
    }
  }, [swRegistration]);

  return { swRegistration, subscribeToPush };
}