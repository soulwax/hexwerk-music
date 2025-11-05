// File: src/app/layout.tsx

import "@/styles/globals.css";

import { Geist } from "next/font/google";
import { type ReactNode } from "react";

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
                {/* Main content with bottom padding for player */}
                <div className="pb-24">{children}</div>
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