// File: src/app/layout.tsx

import "@/styles/globals.css";

import { Geist } from "next/font/google";
import { type ReactNode } from "react";

import MobileNavigation from "@/components/MobileNavigation";
import PersistentPlayer from "@/components/PersistentPlayer";
import { SessionProvider } from "@/components/SessionProvider";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { TRPCReactProvider } from "@/trpc/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata = {
  title: "Starchild Music Stream",
  description: "Modern music streaming application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            <ToastProvider>
              <AudioPlayerProvider>
                {/* Main content with bottom padding for player and mobile nav */}
                <div className="pb-24 md:pb-24">{children}</div>
                {/* Mobile bottom navigation */}
                <MobileNavigation />
                {/* Persistent player - stays on all pages */}
                <PersistentPlayer />
              </AudioPlayerProvider>
            </ToastProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}