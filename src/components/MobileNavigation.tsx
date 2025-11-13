// File: src/components/MobileNavigation.tsx

"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { springPresets } from "@/utils/spring-animations";
import { hapticLight } from "@/utils/haptics";

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

  const activeIndex = visibleTabs.findIndex((tab) => isActive(tab.path));

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={springPresets.gentle}
      className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-black/95 backdrop-blur-lg md:hidden"
    >
      <div className="relative flex items-center justify-around">
        {/* Animated active indicator */}
        <AnimatePresence mode="wait">
          {activeIndex >= 0 && (
            <motion.div
              layoutId="activeTab"
              className="absolute top-0 h-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] rounded-b-full"
              initial={false}
              animate={{
                left: `${(activeIndex / visibleTabs.length) * 100}%`,
                width: `${100 / visibleTabs.length}%`,
              }}
              transition={springPresets.snappy}
            />
          )}
        </AnimatePresence>

        {visibleTabs.map((tab, index) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              href={tab.path}
              onClick={() => hapticLight()}
              className="touch-target-lg relative flex flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  y: active ? -2 : 0,
                }}
                transition={springPresets.snappy}
                className={active ? "text-[var(--color-accent)]" : "text-gray-400 opacity-80"}
              >
                {tab.icon}
              </motion.div>
              
              <motion.span
                animate={{
                  scale: active ? 1 : 0.95,
                  opacity: active ? 1 : 0.7,
                }}
                transition={springPresets.snappy}
                className={`text-xs font-medium ${
                  active ? "text-[var(--color-accent)]" : "text-gray-300"
                }`}
              >
                {tab.name}
              </motion.span>

              {/* Ripple effect on tap */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 h-1 w-8 rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_rgba(244,178,102,0.5)]"
                  transition={springPresets.snappy}
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
