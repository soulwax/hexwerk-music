"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { haptic } from "@/utils/haptics";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SettingsMenu from "./SettingsMenu";

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { data: session } = useSession();
  const player = useGlobalPlayer();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-black/95 backdrop-blur-xl shadow-lg">
        <div className="container flex items-center justify-between py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/AppIcons/Assets.xcassets/AppIcon.appiconset/48.png"
              alt="Starchild Music"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl shadow-lg ring-2 ring-indigo-500/20 transition-all group-hover:scale-105 group-hover:shadow-indigo-500/50"
              priority
            />
            <span className="accent-gradient hidden text-lg font-bold md:block">
              Starchild Music
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:text-white hover:scale-105"
            >
              Home
            </Link>
            {session && (
              <>
                <Link
                  href="/library"
                  className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:text-white hover:scale-105"
                >
                  Library
                </Link>
                <Link
                  href="/playlists"
                  className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:text-white hover:scale-105"
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
              className="btn-ghost touch-target transition-all hover:scale-105"
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
                className="btn-secondary hidden items-center gap-2 transition-all hover:scale-105 md:flex"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user?.name ?? "User"}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full ring-2 ring-white/10"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-xs font-bold text-white shadow-lg">
                    {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                )}
                <span className="text-sm">{session.user?.name}</span>
              </Link>
            ) : (
              <Link href="/api/auth/signin" className="hidden md:block">
                <button className="btn-primary transition-all hover:scale-105">
                  Sign In
                </button>
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
