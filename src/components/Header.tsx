"use client";

import { haptic } from "@/utils/haptics";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SettingsMenu from "./SettingsMenu";

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-black/95 backdrop-blur-lg">
        <div className="container flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold shadow-lg">
              S
            </div>
            <span className="hidden text-lg font-bold text-white md:block accent-gradient">Starchild</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Home
            </Link>
            {session && (
              <>
                <Link
                  href="/library"
                  className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
                >
                  Library
                </Link>
                <Link
                  href="/playlists"
                  className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
                >
                  Playlists
                </Link>
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Settings/Menu Button */}
            <button
              onClick={() => {
                haptic("medium");
                setIsSettingsOpen(true);
              }}
              className="btn-ghost touch-target"
              aria-label="Open settings"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* User Profile Button (Desktop) */}
            {session ? (
              <Link
                href="/profile"
                className="hidden items-center gap-2 btn-secondary md:flex"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user?.name ?? "User"}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                )}
                <span>{session.user?.name}</span>
              </Link>
            ) : (
              <Link href="/api/auth/signin" className="hidden md:block">
                <button className="btn-primary">Sign In</button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Settings Menu */}
      <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
