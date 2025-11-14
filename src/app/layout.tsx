// File: src/app/layout.tsx

import "@/styles/globals.css";

import { Geist } from "next/font/google";
import { type ReactNode } from "react";

import Header from "@/components/Header";
import InstallPrompt from "@/components/InstallPrompt";
import MobileNavigation from "@/components/MobileNavigation";
import PersistentPlayer from "@/components/PersistentPlayer";
import { SessionProvider } from "@/components/SessionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { TRPCReactProvider } from "@/trpc/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata = {
  title: "Starchild Music Stream",
  description: "Modern music streaming and discovery platform with smart recommendations",
  applicationName: "Starchild Music",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    {
      rel: "apple-touch-icon",
      url: "/AppIcons/Assets.xcassets/AppIcon.appiconset/180.png",
    },
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Starchild Music",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f4b266",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" />
        <link rel="dns-prefetch" href="https://api.deezer.com" />
      </head>
      <body>
        <ErrorBoundary>
          <SessionProvider>
            <TRPCReactProvider>
              <ToastProvider>
                <AudioPlayerProvider>
                  {/* Header with hamburger menu */}
                  <Header />
                  {/* Main content with bottom padding for player and mobile nav */}
                  <div className="pb-36 md:pb-24">{children}</div>
                  {/* Mobile bottom navigation */}
                  <MobileNavigation />
                  {/* Persistent player - stays on all pages */}
                  <PersistentPlayer />
                  {/* PWA install prompt */}
                  <InstallPrompt />
                </AudioPlayerProvider>
              </ToastProvider>
            </TRPCReactProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}