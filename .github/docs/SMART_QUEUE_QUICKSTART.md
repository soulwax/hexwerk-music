# Smart Queue - Quick Start Guide

## 🚀 Setup (5 minutes)

### 1. Run Database Migration

```bash
# Make sure your database is running first
npm run db:push
```

This will create:

- `recommendation_cache` table
- `audio_features` table (for future Essentia integration)
- New columns in `user_preferences` table

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Test the Features

1. **Open the Queue Panel** - Click the queue icon in the player
2. **Enable Auto-Queue**:
   - Click the ⚙️ Settings button in queue header
   - Toggle "Auto-queue" switch
   - Adjust threshold (default: 3 tracks)
   - Adjust count (default: 5 tracks)
3. **Try Manual Similar Tracks**:
   - Play any track
   - Click the ✨ Sparkles button in queue header
   - Watch 5 similar tracks get added
4. **Watch Auto-Queue Work**:
   - Play a few tracks
   - Let queue drop to ≤ 3 tracks
   - Auto-queue will automatically add 5 similar tracks

---

## 🎯 Key Features

### Auto-Queue

- **What**: Automatically adds similar tracks when queue runs low
- **Where**: Queue settings panel (⚙️ icon)
- **How**: Enable toggle, set threshold and count

### Add Similar Tracks

- **What**: Manually add similar tracks to queue
- **Where**: Queue header (✨ sparkles icon)
- **How**: Click once, get 5 similar tracks

### Smart Mix (API Only - Frontend UI Coming Soon)

- **What**: Generate playlist from multiple seed tracks
- **Where**: Available via tRPC API
- **How**: Call `music.generateSmartMix` with track IDs

---

## 🎨 UI Elements

### Queue Header Buttons

| Icon | Name | Description |
|------|------|-------------|
| ⚡ | Auto-Queue Toggle | Green = enabled, Gray = disabled |
| ✨ | Add Similar | Add 5 similar tracks now |
| ⚙️ | Settings | Configure smart queue |
| 💾 | Save Playlist | Save queue as playlist |
| 🗑️ | Clear Queue | Remove all tracks |

### Settings Panel

- **Auto-queue Toggle**: Enable/disable automatic queueing
- **Trigger Threshold**: When to add tracks (0-10)
- **Tracks to Add**: How many tracks (1-20)
- **Similarity**: Strict / Balanced / Diverse

---

## 🔧 Configuration

### Feature Flags

File: `src/config/features.ts`

```typescript
// Smart queue (enabled by default)
export const ENABLE_SMART_QUEUE = true;

// Audio features (disabled - enable when Essentia is ready)
export const ENABLE_AUDIO_FEATURES = false;

// Cache duration
export const RECOMMENDATION_CACHE_HOURS = 24;
```

### User Defaults

Default settings for new users:

```typescript
{
  autoQueueEnabled: false,      // Off by default
  autoQueueThreshold: 3,        // Add when ≤ 3 tracks
  autoQueueCount: 5,            // Add 5 tracks
  similarityPreference: 'balanced'
}
```

---

## 📊 How It Works

### Recommendation Algorithm

1. **Deezer Track Radio**:
   - Fetches similar tracks from Deezer API
   - Based on genre, artist, and popularity

2. **Personalization**:
   - Analyzes your listening history
   - Identifies your top artists
   - Blends artist radio if you like the artist

3. **Caching**:
   - Recommendations cached for 24 hours
   - Reduces API calls by ~80%
   - Improves performance

4. **Diversity Control**:
   - **Strict**: Very similar tracks only
   - **Balanced**: Mix of similar and varied (default)
   - **Diverse**: Wide variety of tracks

---

## 🐛 Troubleshooting

### Auto-Queue Not Working?

1. Check that auto-queue is **enabled** (toggle should be green)
2. Verify queue has ≤ threshold tracks (default: 3)
3. Make sure you're **logged in**
4. Check browser console for errors

### No Similar Tracks?

1. Try a different seed track (popular tracks work best)
2. Check internet connection (needs Deezer API access)
3. Clear cache: Call `music.cleanupRecommendationCache`

### Slow Performance?

1. Recommendations cache should kick in after first fetch
2. Check database indexes are created
3. Reduce `autoQueueCount` to 3-4 tracks

---

## 🔮 Coming Soon

### Short Term

- [ ] Smart mix UI in queue panel
- [ ] "Generate from favorites" button
- [ ] Recommendation reason badges
- [ ] Similar track preview

### Medium Term

- [ ] Collaborative filtering (ML-based)
- [ ] Listening pattern analysis
- [ ] Time-of-day recommendations

### Long Term (When Essentia is Ready)

- [ ] BPM matching for smooth transitions
- [ ] Key matching (harmonic mixing)
- [ ] Energy-based playlists
- [ ] Mood-based recommendations

---

## 📚 More Information

- **Full Documentation**: [SMART_QUEUE_DOCUMENTATION.md](./SMART_QUEUE_DOCUMENTATION.md)
- **Backend API**: See tRPC routes in `src/server/api/routers/music.ts`
- **Frontend Components**: Check `src/components/EnhancedQueue.tsx`

---

## 🎉 Quick Test Script

Try this in your browser console:

```javascript
// Get recommendations for a track
const recs = await fetch('/api/trpc/music.getSimilarTracks?input={"trackId":3135556,"limit":5}');
const data = await recs.json();
console.log(data);

// Check your settings
const settings = await fetch('/api/trpc/music.getSmartQueueSettings');
const userSettings = await settings.json();
console.log(userSettings);
```
