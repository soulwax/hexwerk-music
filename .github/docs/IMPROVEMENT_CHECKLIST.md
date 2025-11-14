# Quick Action Checklist

## 🔴 CRITICAL - Fix Immediately

- [ ] **List Virtualization** - Add `react-window` to EnhancedQueue, Queue, and playlist pages
  - Files: `src/components/EnhancedQueue.tsx`, `src/components/Queue.tsx`, `src/app/playlists/[id]/page.tsx`
  - Package: `npm install react-window @types/react-window`
  
- [ ] **Remove unoptimized Images** - Remove `unoptimized` prop from Image components
  - Files: `src/components/EnhancedQueue.tsx:118`, `src/components/Queue.tsx:80`, `src/app/[userhash]/page.tsx:228`
  
- [ ] **Add ARIA Labels** - Add accessibility labels to all buttons
  - Files: `src/components/MobilePlayer.tsx`, `src/components/Player.tsx`, `src/components/EnhancedQueue.tsx`
  
- [ ] **Fix Audio Race Condition** - Add load tracking to prevent overlapping loads
  - File: `src/hooks/useAudioPlayer.ts:341-390`

- [ ] **Add Error Boundary to Layout** - Wrap app in ErrorBoundary
  - File: `src/app/layout.tsx`

---

## 🟠 IMPORTANT - Fix Soon

- [ ] **Logger Utility** - Replace console.log with production-safe logger
  - Create: `src/utils/logger.ts`
  - Update: 22 files with console statements
  
- [ ] **Shared AudioContext** - Prevent multiple context instances
  - Create: `src/contexts/AudioContextProvider.tsx`
  - Update: `src/hooks/useAudioVisualizer.ts`, `src/hooks/useEqualizer.ts`
  
- [ ] **Fix Debounce Leaks** - Use refs instead of global variables
  - Files: `src/hooks/useQueuePersistence.ts:21`, `src/hooks/useEqualizer.ts:220`
  
- [ ] **Handle Promise Rejections** - Add error handlers to void promises
  - File: `src/contexts/AudioPlayerContext.tsx:234,244,263`
  
- [ ] **Landscape Optimizations** - Add CSS for horizontal viewing
  - File: `src/styles/globals.css`

---

## 🟡 NICE TO HAVE - Do When Time Permits

- [ ] **Pull-to-Refresh** - Add to main pages
  - Files: `src/app/page.tsx`, `src/app/library/page.tsx`, `src/app/playlists/page.tsx`
  
- [ ] **Testing Setup** - Install and configure Jest
  - Command: `npm install --save-dev @testing-library/react jest`
  
- [ ] **Split Context** - Separate state and actions
  - File: `src/contexts/AudioPlayerContext.tsx`
  
- [ ] **Constants File** - Extract magic numbers
  - Create: `src/config/constants.ts`
  
- [ ] **Keyboard Navigation** - Add keyboard handlers for queue reordering
  - File: `src/components/EnhancedQueue.tsx`

---

## 📝 Quick Wins (< 30 min each)

1. **Remove unoptimized flags** (3 locations)
2. **Add aria-label to play/pause buttons** (2 components)
3. **Create constants for magic numbers** (useAudioPlayer.ts)
4. **Add localStorage quota handler** (services/storage.ts)
5. **Increase service worker cache size** (next.config.js)

---

## 🎯 This Week's Goals

### Monday-Tuesday
- [ ] Implement list virtualization
- [ ] Remove unoptimized images

### Wednesday-Thursday  
- [ ] Add ARIA labels
- [ ] Create logger utility
- [ ] Fix debounce leaks

### Friday
- [ ] Testing and verification
- [ ] Documentation updates

---

## 📦 Packages to Install

```bash
# Performance
npm install react-window
npm install --save-dev @types/react-window

# Testing (optional)
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Accessibility testing (optional)
npm install --save-dev axe-core @axe-core/react
```

---

## 🔍 Verification Commands

```bash
# Check for console.log usage
grep -r "console\\.log" src/ | wc -l

# Check for unoptimized images
grep -r "unoptimized" src/

# Run linter
npm run lint

# Type check
npm run typecheck

# Build production
npm run build
```

---

## 📊 Success Metrics

Track these before and after:

- [ ] Lighthouse Performance Score
- [ ] Lighthouse Accessibility Score  
- [ ] Time to Interactive (TTI)
- [ ] First Contentful Paint (FCP)
- [ ] Memory usage with 500 tracks in queue
- [ ] Scroll performance (fps) in queue

---

**Tip:** Use this checklist with GitHub Projects or Issues to track progress!

