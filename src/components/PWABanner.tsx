"use client";

import React, { useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { usePWA, useServiceWorker } from "@/hooks/usePWA";

export default function PWABanner() {
  const { isInstallable, install } = usePWA();
  const { swRegistration: _ } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-linear-to-l from-blue-900 to-indigo-800 rounded-2xl p-4 shadow-2xl z-50 pwa-banner border border-blue-700"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="bg-white/20 rounded-xl p-2 shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm mb-0.5">
            ثبّت التطبيق!
          </h3>
          <p className="text-blue-200 text-xs mb-3">
            أضف Novex Pharma إلى شاشتك الرئيسية للوصول السريع
          </p>
          <button
            onClick={install}
            className="flex items-center gap-2 bg-white text-blue-800 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            تثبيت التطبيق
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-300 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}     