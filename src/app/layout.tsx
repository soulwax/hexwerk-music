// File: src/app/layout.tsx

import "@/styles/globals.css";

import { Geist } from "next/font/google";
import { type ReactNode } from "react";

import PersistentPlayer from "@/components/PersistentPlayer";
import { SessionProvider } from "@/components/SessionProvider";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { TRPCReactProvider } from "@/trpc/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata = {
  title: "HexMusic Stream",
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
            <AudioPlayerProvider>
              {/* Main content with bottom padding for player */}
              <div className="pb-24">{children}</div>
              {/* Persistent player - stays on all pages */}
              <PersistentPlayer />
            </AudioPlayerProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}