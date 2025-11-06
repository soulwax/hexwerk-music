// File: src/components/MobileNavigation.tsx

"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const tabs = [
    {
      name: "Home",
      path: "/",
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "Library",
      path: "/library",
      icon: (
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
      ),
      requiresAuth: true,
    },
    {
      name: "Playlists",
      path: "/playlists",
      icon: (
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
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
      requiresAuth: true,
    },
    {
      name: session ? "Profile" : "Sign In",
      path: session ? "/profile" : "/api/auth/signin",
      icon: (
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  const visibleTabs = tabs.filter(
    (tab) => !tab.requiresAuth || (tab.requiresAuth && session),
  );

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-black/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`touch-target-lg flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all ${
                active ? "text-accent scale-105" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <div className={active ? "text-accent" : "opacity-80"}>{tab.icon}</div>
              <span className={`text-xs font-medium ${active ? "text-accent" : "text-gray-300"}`}>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
