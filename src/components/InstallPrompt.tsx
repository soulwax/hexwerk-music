"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDaysInMs) {
        setIsDismissed(true);
        return;
      }
    }

    // Show prompt after a short delay for better UX
    if (isInstallable && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isDismissed]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!isVisible || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up md:bottom-28 md:left-auto md:right-8 md:max-w-sm">
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/95 to-purple-600/95 p-4 shadow-2xl backdrop-blur-lg">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-lg p-1 transition-colors hover:bg-white/10"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          {/* Icon */}
          <div className="flex-shrink-0 rounded-xl bg-white/10 p-3">
            <Download className="h-6 w-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold text-white">
              Install Starchild Music
            </h3>
            <p className="mb-3 text-sm text-white/80">
              Add to your home screen for quick access and offline playback
            </p>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition-transform hover:scale-105 active:scale-95"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
              >
                Not now
              </button>
            </div>
          </div>
        </div>

        {/* iOS specific hint */}
        <style jsx>{`
          @keyframes slide-up {
            from {
              transform: translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
