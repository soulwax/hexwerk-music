// File: src/components/PullToRefreshWrapper.tsx

"use client";

import { motion } from "framer-motion";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

export interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  className?: string;
}

export function PullToRefreshWrapper({
  children,
  onRefresh,
  enabled = true,
  className = "",
}: PullToRefreshWrapperProps) {
  const { containerRef, isRefreshing, pullDistance, handlers } = usePullToRefresh({
    onRefresh,
    enabled,
  });

  const refreshProgress = Math.min(pullDistance / 80, 1);
  const showIndicator = pullDistance > 10;

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`relative ${className}`}
      {...handlers}
    >
      {/* Pull-to-refresh indicator */}
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: refreshProgress, y: 0 }}
          className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex justify-center pt-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-lg backdrop-blur-xl">
            <RefreshCw
              className="h-6 w-6 text-[var(--color-accent)]"
              style={{
                transform: `rotate(${refreshProgress * 360}deg)`,
                transition: "transform 0.2s ease",
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Loading indicator */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex justify-center pt-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-lg backdrop-blur-xl">
            <RefreshCw className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          </div>
        </motion.div>
      )}

      {/* Content with pull effect */}
      <motion.div
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance * 0.4}px)`,
          transition: isRefreshing ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefreshWrapper;



