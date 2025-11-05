// File: src/components/BottomSheet.tsx

"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[]; // Heights in vh (e.g., [50, 90])
  initialSnap?: number; // Index of snapPoints
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [90],
  initialSnap = 0,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const currentHeight = useRef<number>(snapPoints[initialSnap] ?? 90);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when sheet is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]?.clientY ?? 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!sheetRef.current) return;

    const currentY = e.touches[0]?.clientY ?? 0;
    const diff = dragStartY.current - currentY;
    const newHeight = currentHeight.current + (diff / window.innerHeight) * 100;

    // Constrain between 20vh and 95vh
    const constrainedHeight = Math.max(20, Math.min(95, newHeight));
    sheetRef.current.style.height = `${constrainedHeight}vh`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!sheetRef.current) return;

    const currentY = e.changedTouches[0]?.clientY ?? 0;
    const diff = dragStartY.current - currentY;

    // If dragged down significantly, close
    if (diff < -100) {
      onClose();
      return;
    }

    // Snap to nearest snap point
    const currentHeightVh =
      (sheetRef.current.offsetHeight / window.innerHeight) * 100;
    const nearest = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - currentHeightVh) < Math.abs(prev - currentHeightVh)
        ? curr
        : prev,
    );

    currentHeight.current = nearest;
    sheetRef.current.style.height = `${nearest}vh`;
  };

  const handleBackdropClick = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`bottom-sheet-backdrop ${isOpen ? "open" : ""}`}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? "open" : ""}`}
        style={{ height: `${snapPoints[initialSnap]}vh` }}
      >
        {/* Drag handle */}
        <div
          className="touch-target cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bottom-sheet-handle" />
        </div>

        {/* Title */}
        {title && (
          <div className="border-b border-gray-800 px-6 pb-4">
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="scrollbar-hide h-full overflow-y-auto px-4 pb-8">
          {children}
        </div>
      </div>
    </>
  );
}
