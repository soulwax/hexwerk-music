# 🌟 Starchild Music Stream

![Starchild Music Stream Banner](.github/assets/emily-the-strange_vivid.png)

*An attempt at amodern full-stack music search & streaming interface.*

---

## ✨ Project Status

**Development Stage**: This is an early-stage music streaming interface built as a proof-of-concept. The project should display a modern full-stack architecture with Next.js, TypeScript, and TailwindCSS, suitable as foundation for music discovery and playback.

## 📋 Core Features

### Current Implementation

- **Music Search Interface**: Type-safe search functionality integrated with backend API endpoints
- **Type-Safe Environment Validation**: Strict environment variable management using `@t3-oss/env-nextjs`
- **Responsive UI**: Flat design with neon indigo accents, built with TailwindCSS v4
- **HTML5 Audio Playback**: Lightweight audio player components using native browser APIs (no external player libraries)
- **NextAuth Integration Ready**: OAuth 2.0 infrastructure configured for Discord authentication
- **Database Schema Support**: Drizzle ORM configuration for PostgreSQL integration

### Capabilities

The application provides:

- Pre-configured search UI components for music discovery
- Player component scaffolding for audio preview playback
- Type-safe React components with full TypeScript coverage
- Environment management for multiple deployment stages
- Responsive design system with CSS animations

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Server-side rendering & routing |
| **Language** | TypeScript | Type-safe development |
| **Styling** | TailwindCSS v4 | Utility-first CSS framework |
| **Environment** | @t3-oss/env-nextjs | Type-safe environment configuration |
| **Authentication** | NextAuth.js | OAuth 2.0 / Session management |
| **Database** | Drizzle ORM | PostgreSQL schema & queries |
| **Audio** | HTML5 Audio API | Native playback control |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (for production use)

### Installation

1. **Clone & Install**

    ```bash
    git clone https://github.com/soulwax/starchild-music-frontend.git
    cd starchild-music-frontend
    npm install
    ```

2. **Environment Configuration**

    Create a `.env.local` file with required variables:

    ```yaml
    # NextAuth Configuration
    AUTH_SECRET=generate-with->npx auth secret
    AUTH_DISCORD_ID="your-discord-app-id"
    AUTH_DISCORD_SECRET="your-discord-app-secret"

    # Database
    DATABASE_URL="postgres://user:password@host:port/dbname?sslmode=require"

    # API Configuration
    API_URL="https://your-music-api.com/"
    STREAMING_KEY="your-secure-stream-key"
    ```

    **Generate NextAuth Secret:**

    ```bash
    npx auth secret
    ```

3. **Database Setup (Optional)**

    For database operations, create `drizzle.env.ts`:

    ```typescript
    // File: drizzle.env.ts
    import "dotenv/config";

    const required = (key: string) => {
      const val = process.env[key];
      if (!val) throw new Error(`Missing required env var: ${key}`);
      return val;
    };

    const config = {
      DB_HOST: required("DB_HOST"),
      DB_PORT: required("DB_PORT"),
      DB_ADMIN_USER: required("DB_ADMIN_USER"),
      DB_ADMIN_PASSWORD: required("DB_ADMIN_PASSWORD"),
      DB_NAME: required("DB_NAME"),
    };

    export default config;
    ```

4. **Run Development Server**

  ```bash
  npm run dev
  ```

  Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```shell
src/
├── app/
│   ├── layout.tsx          # Root layout with App Router setup
│   └── page.tsx            # Main application page
├── components/
│   ├── Player.tsx          # Audio playback component
│   └── TrackCard.tsx       # Individual track display
├── styles/
│   └── globals.css         # TailwindCSS v4 theme & animations
├── utils/
│   └── api.ts              # Type-safe API client functions
├── types/
│   └── index.ts            # Shared TypeScript interfaces
└── env.js                  # Typed environment validation
```

## 🎨 Design System

| Element | Description |
|---------|-------------|
| **Cards & Buttons** | Rounded corners, flat surfaces with neon indigo borders/text |
| **Background** | Matte deep gray gradient with subtle animated accents |
| **Typography** | System sans-serif stack for crisp, accessible typography |
| **Animations** | CSS-based `slide-up`, `fade-in`, and gradient flows |
| **Color Palette** | Indigo accents on dark backgrounds for modern, minimal aesthetic |

### Design Tokens

Available in `src/styles/globals.css`:

```css
:root {
  --primary: #6366f1;      /* Indigo accent */
  --background: #0f172a;   /* Deep gray */
  --surface: #1e293b;      /* Card surface */
  --text: #f1f5f9;         /* Primary text */
  --text-muted: #94a3b8;   /* Secondary text */
}
```

## 🔌 API Integration

### Required Backend API

To function, this frontend requires a backend music API that provides:

1. **Search Endpoint**

   ```plaintext
   GET /music/search?q={query}
   ```

   Returns: Array of track objects

2. **Streaming Endpoint** (Optional)

   ```plaintext
   GET /music/stream?key={KEY}&q={query}
   ```

   Returns: Audio stream or preview URL

### Supported API Formats

The application expects JSON responses compatible with **Deezer API format**:

```json
{
  "data": [
    {
      "id": "123456",
      "title": "Track Name",
      "artist": {
        "name": "Artist Name"
      },
      "album": {
        "title": "Album Name",
        "cover": "https://..."
      },
      "preview": "https://..."
    }
  ]
}
```

### Type-Safe API Functions

Example usage in `src/utils/api.ts`:

```typescript
import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";

export async function searchTracks(query: string): Promise<Track[]> {
  const url = new URL("music/search", env.API_URL);
  url.searchParams.set("q", query);
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Search failed");
  
  const json: SearchResponse = await res.json();
  return json.data;
}
```

## ⚖️ Legal & Licensing

### Important Notice

This project does **not** include or distribute copyrighted music. It is a frontend interface designed to work with legitimate, licensed music APIs.

**To deploy publicly, you must connect it to a legally compliant music service**, such as:

- **Deezer API** - Official music catalog with licensing
- **Spotify Web API** - Requires OAuth and subscription agreement
- **Apple Music API** - Licensed music streaming service
- **Your own licensed content** - Self-hosted audio with proper rights

**Do not use this with unauthorized music sources.**

### License

This project is licensed under the **GPL-3.0 License**. See the LICENSE file for details.

## 🛠️ Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting (if configured)
npm run lint
```

### TypeScript Configuration

The project enforces strict TypeScript settings:

- Full type checking enabled
- No implicit `any` types
- Required explicit null/undefined handling
- Strict property initialization

### Working with TailwindCSS v4

This project uses **TailwindCSS v4** with pure CSS Variables (no `@apply` directives):

```css
/* globals.css */
@import "tailwindcss";

:root {
  --primary: #6366f1;
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded bg-[rgb(var(--primary))];
  }
}
```

## 🚨 Common Issues & Solutions

### Issue: "Missing required env var"

**Solution**: Ensure all required environment variables in `.env.local` are set and valid.

### Issue: NextAuth not working

**Solution**:

1. Generate secret: `npx auth secret`
2. Verify Discord OAuth app credentials
3. Check callback URL matches your domain

### Issue: Routing conflicts

**Solution**: Ensure `src/pages/` directory is removed if using App Router (`src/app/`).

### Issue: Database connection fails

**Solution**:

1. Verify DATABASE_URL format includes `?sslmode=require`
2. Check PostgreSQL is running and accessible
3. Confirm database exists and credentials are correct

## 📈 Future Roadmap

Potential enhancements for this project:

- **Playlist Management** - Create and save playlists
- **User Accounts** - Persist user preferences and favorites
- **Advanced Search** - Filters by genre, artist, release date
- **Audio Visualization** - Waveform display during playback
- **Queue System** - Manage upcoming tracks
- **Social Features** - Share playlists and recommendations
- **Responsive Audio Player** - Enhanced mobile UI
- **Dark/Light Theme Toggle** - User preference saving
- **Offline Mode** - Cache downloaded tracks

## 📝 Configuration Examples

### Minimal Setup (No Database)

For a basic search-only interface:

```yaml
AUTH_SECRET="your-secret"
API_URL="https://api.deezer.com/"
STREAMING_KEY="optional"
```

### Full Production Setup

```yaml
AUTH_SECRET="your-secret"
AUTH_DISCORD_ID="discord-app-id"
AUTH_DISCORD_SECRET="discord-app-secret"

DATABASE_URL="postgres://prod_user:prod_pass@prod-host:5432/starchild?sslmode=require"

API_URL="https://your-music-api.com/"
STREAMING_KEY="your-secure-key"
```

## 🤝 Contributing

Contributions are welcome! Please ensure:

1. All code is TypeScript with strict mode enabled
2. Components are properly typed with interfaces
3. Styling follows TailwindCSS v4 conventions
4. Environment variables are added to type validation

## 📜 Acknowledgments

Built with the **T3 Stack** - a modern, type-safe full-stack framework for Next.js applications.

---

## © 2025 soulwax @ GitHub

*All music data, streaming rights, and trademarks remain the property of their respective owners.*
