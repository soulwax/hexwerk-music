# Smart Queue Implementation Roadmap

## Current State Analysis

### ✅ **What's Already Implemented**

1. **Database Schema** (`src/server/db/schema.ts`)
   - `userPreferences` table has all smart queue settings:
     - `autoQueueEnabled` - Enable/disable auto-queue
     - `autoQueueThreshold` - Trigger when queue ≤ N tracks
     - `autoQueueCount` - Number of tracks to add
     - `smartMixEnabled` - Use audio feature analysis
     - `similarityPreference` - strict/balanced/diverse

2. **Backend API Endpoints** (`src/server/api/routers/music.ts`)
   - ✅ `getSmartQueueSettings` - Fetch user settings
   - ✅ `updateSmartQueueSettings` - Save settings
   - ✅ `getSimilarTracks` - Basic fallback endpoint
   - ✅ `generateSmartMix` - tRPC mutation for smart mixes

3. **Smart Queue Service** (`src/services/smartQueue.ts`)
   - ✅ `getSmartQueueRecommendations()` - Main recommendation engine
   - ✅ `generateSmartMix()` - Multi-seed intelligent mixing
   - ✅ `analyzeTrack()` - Spotify audio features
   - ✅ `searchHexMusicTracks()` - HexMusic integration
   - ✅ Fallback to Deezer radio API

4. **Context Integration** (`src/contexts/AudioPlayerContext.tsx`)
   - ✅ `handleAutoQueueTrigger` - Calls smart queue service
   - ✅ `addSimilarTracks` - Adds similar tracks to queue
   - ✅ `generateSmartMix` - Generates smart mix
   - ✅ Fetches `smartQueueSettings` via tRPC

5. **UI Components** (`src/components/EnhancedQueue.tsx`)
   - ✅ Sparkles button - Add similar tracks
   - ✅ Zap button - Generate smart mix
   - ✅ Auto-queue toggle
   - ✅ Settings panel with sliders
   - ✅ Similarity preference selector

---

## 🔴 **Issues & Missing Pieces**

### **1. Settings Not Persisting** ❌
**Problem:** Settings panel updates but may not save to database
**Fix Needed:** Verify `updateSettings.mutateAsync()` is working

### **2. Auto-Queue Not Triggering** ❌
**Problem:** Auto-queue doesn't activate when queue is low
**Root Cause:** `useAudioPlayer` hook needs to check queue length and trigger
**Fix Needed:** Add queue monitoring logic in `useAudioPlayer.ts`

### **3. Add Similar Tracks Button Does Nothing** ❌
**Problem:** Click doesn't add tracks to queue
**Root Cause:** Might be authentication issue or API not responding
**Fix Needed:** Add error logging and verify API calls

### **4. Generate Smart Mix Button Does Nothing** ❌
**Problem:** Click doesn't generate mix
**Root Cause:** Similar to #3
**Fix Needed:** Add error logging and verify API calls

### **5. No Visual Feedback** ❌
**Problem:** No loading states or success/error messages
**Fix Needed:** Add toast notifications or inline feedback

### **6. Backend API May Be Unreachable** ❌
**Problem:** `smartQueue.ts` uses `process.env.NEXT_PUBLIC_API_URL`
**Fix Needed:** Verify API_URL is set correctly, test endpoints

---

## 📋 **Implementation Roadmap**

### **Phase 1: Debug & Fix Core Functionality** (Priority: CRITICAL)

#### **Step 1.1: Verify Backend API Connection**
- [ ] Test if backend API is accessible
- [ ] Check `process.env.NEXT_PUBLIC_API_URL` value
- [ ] Add console logs to trace API requests
- [ ] Test endpoints with curl/Postman

#### **Step 1.2: Fix Settings Persistence**
- [ ] Add error handling to `updateSettings.mutateAsync()`
- [ ] Verify database updates are happening
- [ ] Add optimistic updates in UI
- [ ] Show success/error feedback

#### **Step 1.3: Fix "Add Similar Tracks" Button**
- [ ] Add loading state to button
- [ ] Add try-catch with detailed error logging
- [ ] Test with console.log to trace execution
- [ ] Verify tracks are being added to queue
- [ ] Add toast notification on success/failure

#### **Step 1.4: Fix "Generate Smart Mix" Button**
- [ ] Add loading state to button
- [ ] Add try-catch with detailed error logging
- [ ] Test with console.log to trace execution
- [ ] Verify queue is being replaced with new mix
- [ ] Add toast notification on success/failure

---

### **Phase 2: Implement Auto-Queue** (Priority: HIGH)

#### **Step 2.1: Add Queue Monitoring**
Location: `src/hooks/useAudioPlayer.ts`

**Requirements:**
- Monitor `queue.length` on every track change
- When `queue.length <= autoQueueThreshold`, trigger auto-queue
- Don't trigger if already auto-queueing (prevent spam)
- Respect `autoQueueEnabled` setting

**Implementation:**
```typescript
useEffect(() => {
  if (!autoQueueEnabled || isAutoQueueing) return;

  if (queue.length <= autoQueueThreshold && currentTrack) {
    triggerAutoQueue();
  }
}, [queue.length, currentTrack, autoQueueEnabled]);
```

#### **Step 2.2: Add Auto-Queue State**
- [ ] Add `isAutoQueueing` state to context
- [ ] Show loading indicator in queue when auto-queueing
- [ ] Prevent duplicate triggers

---

### **Phase 3: Enhanced User Experience** (Priority: MEDIUM)

#### **Step 3.1: Add Toast Notifications**
- [ ] Install/configure toast library (sonner or react-hot-toast)
- [ ] Success: "Added 5 similar tracks to queue"
- [ ] Error: "Failed to add tracks: [reason]"
- [ ] Info: "Generating smart mix..."

#### **Step 3.2: Improve Loading States**
- [ ] Skeleton loaders for queue items being added
- [ ] Animated transitions when tracks appear
- [ ] Progress indicator for smart mix generation

#### **Step 3.3: Add Analytics**
- [ ] Track button clicks
- [ ] Track auto-queue triggers
- [ ] Track success/failure rates
- [ ] Help debug issues

---

### **Phase 4: Advanced Features** (Priority: LOW)

#### **Step 4.1: Smart Queue History**
- [ ] Remember last smart queue generation
- [ ] Allow "undo" to restore previous queue
- [ ] Show "Generated from: Track A, B, C"

#### **Step 4.2: Smart Queue Presets**
- [ ] Save favorite similarity settings
- [ ] Quick toggle between presets
- [ ] "Discovery Mode" vs "Familiar Mode"

#### **Step 4.3: Collaborative Smart Queue**
- [ ] Generate mix based on multiple users' tastes
- [ ] Party mode - blends everyone's preferences

---

## 🔧 **Immediate Action Plan** (Next 30 minutes)

### **Priority 1: Make Buttons Work**

1. **Add Debug Logging**
   - Add console.logs to trace button clicks
   - Log API requests and responses
   - Log any errors

2. **Test Backend Connection**
   - Verify `NEXT_PUBLIC_API_URL` is set
   - Test if backend endpoints respond
   - Check CORS if needed

3. **Add Error Boundaries**
   - Wrap smart queue operations in try-catch
   - Display errors to console
   - Show user-friendly error messages

4. **Verify Queue Updates**
   - Check if `player.addToQueue()` is called
   - Verify tracks are actually added
   - Check queue state updates

---

## 🐛 **Debugging Checklist**

When testing smart queue features:

- [ ] Open browser console (F12)
- [ ] Click "Add Similar Tracks" button
- [ ] Check for:
  - Button click event fired
  - `handleAddSimilar()` called
  - `onAddSimilarTracks()` called
  - `addSimilarTracks()` in context called
  - API request made
  - API response received
  - Tracks added to queue
- [ ] If any step fails, add detailed logging
- [ ] Check network tab for failed requests
- [ ] Verify authentication token is present

---

## 📊 **Success Metrics**

How we'll know it's working:

1. ✅ Click "Add Similar Tracks" → 5 tracks appear in queue
2. ✅ Click "Generate Smart Mix" → Queue is replaced with 50 tracks
3. ✅ Auto-queue enabled → Tracks added automatically when low
4. ✅ Settings changes → Saved to database and persist on reload
5. ✅ Loading states → User sees feedback during operations
6. ✅ Error handling → Clear error messages if something fails

---

## 🔍 **Known Risks**

1. **Backend API Unavailable**
   - Risk: Smart queue service may not be deployed
   - Mitigation: Fall back to tRPC endpoints

2. **Authentication Issues**
   - Risk: API requires auth token that's not being sent
   - Mitigation: Verify token in `getAuthToken()`

3. **Rate Limiting**
   - Risk: Too many API calls may be throttled
   - Mitigation: Add debouncing and caching

4. **CORS Issues**
   - Risk: Browser may block cross-origin requests
   - Mitigation: Configure CORS on backend

---

## 📝 **Next Steps**

1. **Start with Phase 1, Step 1.1** - Verify backend connection
2. **Add comprehensive logging** - See exactly what's happening
3. **Test each button individually** - Isolate issues
4. **Fix one issue at a time** - Don't try to fix everything at once
5. **Document findings** - Help future debugging

---

## 🎯 **Definition of Done**

Smart Queue feature is complete when:
- [ ] All buttons work and provide feedback
- [ ] Settings persist across sessions
- [ ] Auto-queue triggers automatically
- [ ] Error messages are clear and helpful
- [ ] Loading states are visible
- [ ] No console errors
- [ ] Works for both authenticated and unauthenticated users (where applicable)
