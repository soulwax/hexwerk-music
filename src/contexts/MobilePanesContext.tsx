// File: src/contexts/MobilePanesContext.tsx

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type PaneIndex = 0 | 1 | 2;

interface MobilePanesContextValue {
  currentPane: PaneIndex;
  navigateToPane: (pane: PaneIndex) => void;
}

const MobilePanesContext = createContext<MobilePanesContextValue | null>(null);

export function MobilePanesProvider({ children }: { children: ReactNode }) {
  const [currentPane, setCurrentPane] = useState<PaneIndex>(2); // Start on content pane

  const navigateToPane = (pane: PaneIndex) => {
    setCurrentPane(pane);
  };

  return (
    <MobilePanesContext.Provider value={{ currentPane, navigateToPane }}>
      {children}
    </MobilePanesContext.Provider>
  );
}

export function useMobilePanes() {
  const context = useContext(MobilePanesContext);
  if (!context) {
    // Return a no-op function if context is not available (e.g., on desktop)
    return {
      currentPane: 2 as PaneIndex,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      navigateToPane: () => {},
    };
  }
  return context;
}

