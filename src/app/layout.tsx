// File: src/app/layout.tsx

"use client";

import "@/styles/globals.css";

import { SessionProvider } from "next-auth/react";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";

// Note: Metadata export needs to be in a separate server component
// For now, we'll handle it differently since we need SessionProvider

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        <title>HexMusic Stream</title>
        <meta name="description" content="Modern music streaming application" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
