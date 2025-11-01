// File: src/app/layout.tsx

import "@/styles/globals.css";

import { Geist } from "next/font/google";
import { type ReactNode } from "react";

import { SessionProvider } from "@/components/SessionProvider";
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
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
