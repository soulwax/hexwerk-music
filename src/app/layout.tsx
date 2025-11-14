// File: src/app/layout.tsx

import "@/styles/globals.css";

import { Geist } from "next/font/google";
import { type ReactNode } from "react";

import Header from "@/components/Header";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Starchild Music",
  },
  other: {
    "mobile-web-app-capable": "yes",
    // Enhanced mobile meta tags
    "format-detection": "telephone=no", // Prevent auto-linking phone numbers
    "apple-mobile-web-app-status-bar-style": "black-translucent",
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
        {/* Enhanced mobile touch icons for better home screen experience */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/AppIcons/Assets.xcassets/AppIcon.appiconset/180.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/AppIcons/Assets.xcassets/AppIcon.appiconset/152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/AppIcons/Assets.xcassets/AppIcon.appiconset/144.png"
        />
        {/* Enhanced mobile viewport for iOS notch support */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
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
                </AudioPlayerProvider>
              </ToastProvider>
            </TRPCReactProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}