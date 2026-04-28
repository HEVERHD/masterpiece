"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("pwa-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setVisible(false);
    if (outcome === "dismissed") localStorage.setItem("pwa-dismissed", "1");
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem("pwa-dismissed", "1");
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#1a1209] text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Masterpiece"
        className="h-11 w-11 rounded-xl object-contain bg-amber-900/30 p-1 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight">Instala la app</p>
        <p className="text-xs text-amber-400 mt-0.5 leading-tight">
          Accede sin el navegador, más rápido
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-amber-500 hover:bg-amber-400 text-[#1a1209] font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 flex-shrink-0 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Instalar
      </button>
      <button
        onClick={handleDismiss}
        className="text-stone-400 hover:text-stone-200 p-1 flex-shrink-0 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
