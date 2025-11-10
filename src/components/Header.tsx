"use client";

import { LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut({ callbackUrl: "/" });
  };

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
            {/* User Profile Dropdown (Desktop) */}
            {session ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-secondary flex items-center gap-2 transition-all hover:scale-105"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
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
                  <svg
                    className={`h-4 w-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-800 bg-gray-900 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                      {session?.user?.id && (
                        <Link
                          href={`/profile/${session.user.id}`}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                        >
                          <User className="h-4 w-4" />
                          My Profile
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
    </>
  );
}
