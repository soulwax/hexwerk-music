"use client";

import { useState } from "react";
import Link from "link";
import { useSession } from "next-auth/react";
import SettingsMenu from "./SettingsMenu";
import { haptic } from "@/utils/haptics";

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-black/95 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold">
              S
            </div>
            <span className="hidden text-xl font-bold text-white md:block">Starchild</span>
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
              className="touch-target flex items-center gap-2 rounded-full p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
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
                className="hidden items-center gap-2 rounded-full bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white md:flex"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user?.name ?? "User"}
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
              <Link
                href="/api/auth/signin"
                className="hidden rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 md:block"
              >
                Sign In
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
