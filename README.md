<p align="center">
  <img src=".github/assets/emily-the-strange_vivid.png" alt="HexMusic Stream Banner" width="640" />
</p>

<h1 align="center">🎧 HexMusic Stream</h1>
<p align="center"><em>An attempt at amodern full-stack music search & streaming interface.</em></p>


## 🎧 **HexMusic Stream**

*A modern full-stack music search & streaming interface.*

---

### 🪄 Overview

**HexMusic Stream** is a sleek **Next.js (T3 Stack)** web application for exploring and streaming music.
It provides a minimal, neon-flat design built with **TailwindCSS**, **TypeScript**, and **App Router** architecture.

Users can:

* Search for music tracks via a backend API (e.g. Deezer-style endpoints)
* Stream playable previews via a secure backend key

---

### 🧱 Tech Stack

| Layer                      | Technology                                             | Purpose                              |
| -------------------------- | ------------------------------------------------------ | ------------------------------------ |
| **Framework**              | [Next.js 15 (App Router)](https://nextjs.org/docs/app) | Frontend & routing                   |
| **Styling**                | [TailwindCSS v4](https://tailwindcss.com/)             | Responsive, flat design              |
| **Type Safety**            | [TypeScript](https://www.typescriptlang.org/)          | Strict typing throughout             |
| **Environment Management** | [@t3-oss/env-nextjs](https://env.t3.gg/)               | Typed environment validation         |
| **Authentication**         | [NextAuth](https://next-auth.js.org/)                  | OAuth 2.0 / Discord ready            |
| **Database**               | [Drizzle ORM](https://orm.drizzle.team/)               | PostgreSQL schema handling           |
| **Player Components**      | React Hooks + HTML5 Audio                              | Lightweight, no external player libs |

---

### ⚙️ Environment Setup

Create a `.env` file based on the following structure:

```env
# .env
AUTH_SECRET="your-generated-auth-secret"
AUTH_DISCORD_ID="your-discord-app-id"
AUTH_DISCORD_SECRET="your-discord-app-secret"

DATABASE_URL="postgres://user:password@host:port/dbname?sslmode=require"

API_URL="https://your-music-api.com/"
STREAMING_KEY="your-secure-stream-key"
```

> ✅ **Tip:**
> You can generate a secret for NextAuth with:
>
> ```bash
> npx auth secret
> ```

---

### 🧩 Directory Structure

```plaintext
src/
 ├── app/
 │    ├── layout.tsx        # App Router layout
 │    └── page.tsx          # Main music search page
 ├── components/
 │    ├── Player.tsx        # Audio playback component
 │    └── TrackCard.tsx     # Music track card
 ├── styles/
 │    └── globals.css       # Custom Tailwind theme
 ├── utils/
 │    └── api.ts            # Type-safe API functions
 ├── types/
 │    └── index.ts          # Shared TypeScript interfaces
 └── env.js                 # Typed environment validation
```

---

### 🚀 Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run local development server**

   ```bash
   npm run dev
   ```

3. **Visit**

   ```plaintext
   http://localhost:3000
   ```

---

### 🎨 Design System

| Element             | Description                                              |
| ------------------- | -------------------------------------------------------- |
| **Cards & Buttons** | Rounded, flat surfaces with neon indigo accents          |
| **Background**      | Matte deep gray gradient with animated accent highlights |
| **Font**            | System Sans / UI default for crisp contrast              |
| **Animation**       | Subtle `slide-up`, `fade-in`, and gradient flows         |

See `src/styles/globals.css` for design tokens and animations.

---

### 🔑 API Requirements

HexMusic Stream **requires** a backend API that:

* Provides **legal access** to music metadata and audio previews.
* Implements endpoints similar to:

  * `/music/search?q={query}`
  * `/music/stream?key={KEY}&q={query}`
* Returns JSON in the [Deezer API](https://developers.deezer.com/api) format or compatible structure.

> ⚖️ **Legal Note:**
> This project does **not** include or distribute copyrighted music.
> To use it publicly, you must connect it to a **legitimate licensed music API** or your own authorized backend that complies with copyright law in your jurisdiction.
> Examples of legal data sources include:
>
> * [Deezer API](https://developers.deezer.com/)
> * [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
> * [Apple Music API](https://developer.apple.com/documentation/applemusicapi)
> * or your self-hosted licensed audio content.

---

### 🧠 Type Safety Highlights

* Fully typed `env` schema validation (`src/env.js`)
* Strongly typed API responses (`src/types/index.ts`)
* Reusable `Track`, `Artist`, `Album`, and `StreamParams` interfaces
* Type-safe component props across all React components

---

### 🛠 Example API Integration

```ts
// File: src/utils/api.ts
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

---

### 💡 Development Notes

* If both `src/pages/` and `src/app/` exist, remove `src/pages/index.tsx` to prevent routing conflicts.
* `globals.css` is written for **TailwindCSS v4** — it uses `@import "tailwindcss";` and pure CSS variables, no `@apply`.
* When changing environment variables, restart your dev server.

---

### ⚡ Roadmap Ideas

* [ ] Add playlist & queue system
* [ ] Integrate waveform visualizer
* [ ] Support `/track/[id]` routes with SSR
* [ ] Extend theme switching (light / dark)
* [ ] Add caching and rate limiting for API calls

---

### 📜 License

To read the License, see the [LICENSE](LICENSE.md) file

---

**© 2025 soulwax@github / Kling

*All trademarks, music data, and streaming rights remain the property of their respective owners.*
