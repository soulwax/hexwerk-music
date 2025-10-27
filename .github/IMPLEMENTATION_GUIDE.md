# HexMusic Stream - Full Implementation Guide

## 🚀 Quick Setup

### 1. Database Schema Update

Add the new tables to your `src/server/db/schema.ts`:

```bash
# Copy the enhanced schema sections
cat schema-enhanced.ts >> src/server/db/schema.ts
```

Then generate and apply migrations:

```bash
npm run db:generate
npm run db:push
```

### 2. Add Music Router

Create `src/server/api/routers/music.ts` from the `music.ts` file provided.

Update `src/server/api/root.ts`:

```typescript
import { musicRouter } from "@/server/api/routers/music";

export const appRouter = createTRPCRouter({
  post: postRouter,
  music: musicRouter, // Add this line
});
```

### 3. Replace Components

Replace or create the following files:

- `src/components/EnhancedPlayer.tsx` (replaces `Player.tsx`)
- `src/components/EnhancedTrackCard.tsx` (replaces `TrackCard.tsx`)
- `src/app/page.tsx` (enhanced version with queue)

### 4. Create New Pages

Create these new route folders and files:

```
src/app/
├── library/
│   └── page.tsx           # Copy from library-page.tsx
├── playlists/
│   ├── page.tsx           # Copy from playlists-page.tsx
│   └── [id]/
│       └── page.tsx       # Copy from playlist-detail-page.tsx
```

### 5. Update Layout for Session Provider

Update `src/app/layout.tsx` to include SessionProvider:

```typescript
import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

## 📁 File Structure

```
src/
├── app/
│   ├── page.tsx                    # Enhanced home with queue
│   ├── library/
│   │   └── page.tsx                # Favorites & history
│   ├── playlists/
│   │   ├── page.tsx                # All playlists
│   │   └── [id]/
│   │       └── page.tsx            # Playlist detail
│   └── api/
│       └── ... (existing)
├── components/
│   ├── EnhancedPlayer.tsx          # Full-featured player
│   └── EnhancedTrackCard.tsx       # Track card with actions
├── server/
│   ├── api/
│   │   ├── routers/
│   │   │   ├── music.ts            # NEW: Music operations
│   │   │   └── post.ts             # Existing
│   │   └── root.ts                 # Updated with musicRouter
│   └── db/
│       └── schema.ts               # Extended with music tables
└── ... (existing)
```

## ✨ New Features

### 1. Enhanced Player

- Play/pause controls
- Progress bar with seeking
- Volume control
- Next/previous track
- Queue display
- Time remaining

### 2. Queue Management

- Add tracks to queue
- View queue sidebar
- Remove from queue
- Auto-play next track
- Visual queue counter

### 3. User Library

- **Favorites**: Save tracks you love
- **Listening History**: See what you've played
- One-click favorite toggle on all tracks

### 4. Playlist System

- Create unlimited playlists
- Add/remove tracks
- Public/private playlists
- Playlist cover mosaics
- Play all tracks in order

### 5. Search Enhancements

- Search history saved
- Recent searches quick access
- Improved UI/UX

### 6. Track Actions

- Favorite button on each track
- Add to queue button
- Add to playlist dropdown
- Play on click/hover

## 🎨 UI Improvements

All pages now include:

- Consistent navigation header
- Smooth transitions
- Loading states
- Empty states with helpful messages
- Responsive design
- Better error handling

## 🔑 Authentication

All user-specific features require authentication:

- Sign in with Discord (already configured)
- Protected routes automatically redirect
- Session-aware components

## 🗄️ Database Tables

New tables added:

- **favorites**: User's favorite tracks
- **playlists**: User playlists metadata
- **playlist_tracks**: Tracks in playlists
- **listening_history**: What users have played
- **search_history**: Recent search queries

All tables include proper indexes and foreign key constraints.

## 🛠️ API Endpoints (tRPC)

### Favorites

- `music.addFavorite` - Add track to favorites
- `music.removeFavorite` - Remove from favorites
- `music.getFavorites` - Get all favorites
- `music.isFavorite` - Check if track is favorited

### Playlists

- `music.createPlaylist` - Create new playlist
- `music.getPlaylists` - Get all user playlists
- `music.getPlaylist` - Get single playlist with tracks
- `music.addToPlaylist` - Add track to playlist
- `music.removeFromPlaylist` - Remove track
- `music.deletePlaylist` - Delete entire playlist

### History

- `music.addToHistory` - Log a play
- `music.getHistory` - Get listening history

### Search

- `music.addSearchQuery` - Save search
- `music.getRecentSearches` - Get recent searches

## 🎯 Usage Examples

### Playing a Track

```typescript
const handlePlay = (track: Track) => {
  setCurrentTrack(track);
  // Automatically logged to history if authenticated
};
```

### Adding to Queue

```typescript
const handleAddToQueue = (track: Track) => {
  setQueue(prev => [...prev, track]);
};
```

### Favoriting a Track

```typescript
const addFavorite = api.music.addFavorite.useMutation({
  onSuccess: () => {
    // UI automatically updates
  },
});

addFavorite.mutate({ track });
```

## 🔒 Security

- All music operations require authentication
- User data isolated by session
- SQL injection protection via Drizzle ORM
- CSRF protection via tRPC
- Secure cookie handling via NextAuth

## 🚨 Important Notes

1. **Environment Variables**: Ensure all variables in `.env` are set correctly
2. **Database Connection**: Run `npm run db:push` after schema changes
3. **Session Provider**: Required for authentication to work
4. **Type Safety**: All API calls are fully typed via tRPC

## 📈 Performance Optimizations

- Optimistic UI updates
- Query invalidation on mutations
- Pagination support on all lists
- Image lazy loading
- Audio preloading

## 🎨 Styling

The app uses:

- TailwindCSS v4 for utility classes
- CSS custom properties in `globals.css`
- Consistent color scheme (indigo/purple accent)
- Smooth transitions and animations
- Responsive breakpoints

## 🐛 Troubleshooting

### "Playlist not found"

- Ensure user is authenticated
- Check playlist belongs to current user

### Tracks not playing

- Verify `API_URL` and `STREAMING_KEY` in `.env`
- Check browser console for errors
- Ensure backend API is running

### Session issues

- Clear cookies and sign in again
- Verify Discord OAuth credentials
- Check `AUTH_SECRET` is set

## 📝 Next Steps

Potential enhancements:

- [ ] Shuffle mode
- [ ] Repeat mode (one/all)
- [ ] Share playlists
- [ ] Artist/album detail pages
- [ ] Lyrics integration
- [ ] Collaborative playlists
- [ ] Mobile app
- [ ] Social features

## 🤝 Contributing

The codebase follows these principles:

- Clean, maintainable code
- Full TypeScript coverage
- Consistent formatting (Prettier)
- ESLint compliance
- Descriptive variable names

---

## Enjoy your fully functional music streaming app! 🎧
