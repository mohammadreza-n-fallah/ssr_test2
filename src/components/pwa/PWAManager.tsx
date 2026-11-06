"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// Minimal typing for the non-standard beforeinstallprompt event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

export default function PWAManager() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  // Register the service worker once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // avoid dev caching
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
  }, []);

  // Capture the install prompt (Chromium/Android) for a custom button.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-sm rounded-2xl bg-[#1e3a8a] text-white shadow-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 bg-[#f97316] rounded-xl flex items-center justify-center shrink-0">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 text-sm">
        <div className="font-bold">نصب اپلیکیشن مِین استوریج</div>
        <div className="text-blue-200 text-xs">دسترسی سریع‌تر، حتی آفلاین</div>
      </div>
      <button
        onClick={install}
        className="bg-gradient-accent hover:brightness-110 transition-colors rounded-xl px-4 py-2 text-sm font-medium"
      >
        نصب
      </button>
      <button onClick={dismiss} aria-label="بستن" className="text-blue-300 hover:text-white">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

