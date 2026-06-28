# Aniexplore

A full-stack anime streaming and manga reading platform. Browse trending anime, switch between multiple video embed providers, and read manga chapters — all in one place.

Built as a monorepo with a React frontend, an Express API server, and a shared OpenAPI-driven type system.

---

## Features

- **Anime browsing** — Trending, popular, top-rated, and seasonal anime powered by TMDB
- **Video playback** — 8 embed providers (vidsrc, vidlink, embed.su, 2embed, multiembed, etc.) with a one-click switcher if any provider is down
- **Manga browsing** — Popular and latest titles from MangaDex + AniList combined
- **Manga reader** — Full-page vertical reader with keyboard navigation (← →), chapter jump list
- **Search** — Anime and manga search with 400ms debounce
- **Continue watching** — In-browser watch progress saved to localStorage
- **Dark gold & black theme** — CSS variable-based design system with glass morphism cards

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, Radix UI |
| Routing | Wouter (lightweight, Expo-compatible) |
| Server state | TanStack React Query (auto-generated hooks via Orval) |
| Backend | Node.js 22, Express 5, TypeScript |
| Logging | Pino with structured JSON |
| Cache | In-memory TTL cache (no Redis needed) |
| Data sources | TMDB, MangaDex, AniList GraphQL |
| Code gen | Orval (OpenAPI → React Query hooks + Zod validators) |
| Package manager | pnpm workspaces |
| Deployment | Render (single web service) |

---

## Repository Structure

```
.
├── artifacts/
│   ├── api-server/          # Express backend
│   │   ├── src/
│   │   │   ├── app.ts       # Express app, middleware chain
│   │   │   ├── index.ts     # Server entry, graceful SIGTERM shutdown
│   │   │   ├── lib/
│   │   │   │   ├── cache.ts # In-memory TTL cache with sweep
│   │   │   │   └── logger.ts
│   │   │   ├── middleware/
│   │   │   │   ├── rate-limit.ts     # 300 req / 15 min per IP
│   │   │   │   ├── security-headers.ts
│   │   │   │   └── error-handler.ts
│   │   │   └── routes/
│   │   │       ├── anime.ts  # TMDB anime routes
│   │   │       └── manga.ts  # MangaDex + AniList manga routes
│   │   └── build.mjs         # esbuild bundler config
│   │
│   └── ember-realm/          # React SPA
│       └── src/
│           ├── pages/        # Route-level page components
│           ├── components/   # UI primitives + feature components
│           ├── lib/
│           │   └── tmdb.ts   # TMDB image URL builders
│           └── App.tsx       # Router + React Query provider
│
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml      # Single source of truth for the API contract
│   ├── api-client-react/     # Generated React Query hooks (do not edit)
│   ├── api-zod/              # Generated Zod validators (do not edit)
│   └── db/                   # Drizzle ORM + PostgreSQL (scaffolded, future use)
│
├── render.yaml               # Render deployment config
└── pnpm-workspace.yaml       # Workspace + supply-chain security policy
```

---

## How It Works

### Data flow

```
Browser (React SPA)
  │  relative /api/* calls via React Query hooks
  ▼
Express API Server
  ├── /api/anime/*  →  TMDB API (genre 16 = Animation, language = ja)
  ├── /api/manga/*  →  MangaDex REST + AniList GraphQL (merged + deduped)
  └── /api/manga/chapter/:id/pages  →  MangaDex at-home CDN
```

The API server never exposes TMDB credentials to the browser. All third-party requests are proxied with an in-memory cache.

### Code generation

`lib/api-spec/openapi.yaml` is the single contract. Orval reads it and generates:
- `lib/api-client-react` — typed React Query hooks (`useGetAnimeDetails`, `useGetMangaChapters`, etc.)
- `lib/api-zod` — Zod validators and inferred TypeScript types

**Do not hand-edit generated files.** Edit the OpenAPI spec, then run:

```bash
pnpm run generate
```

### Manga dual-source architecture

Popular/latest/search results are fetched from **MangaDex** and **AniList** in parallel (`Promise.allSettled`), then merged and deduplicated by normalised title. MangaDex results take priority.

AniList manga are identified by an `al-{id}` prefix. When a user opens one, the backend:
1. Fetches metadata from AniList GraphQL (cover, genres, author, synopsis)
2. Resolves the title to a MangaDex manga ID via title search
3. Fetches chapters from MangaDex using that UUID

This gives you AniList's curated discovery with MangaDex's chapter availability.

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

### Install

```bash
git clone https://github.com/your-username/aniexplore
cd aniexplore
pnpm install
```

### Environment variables

Create `.env` in the project root:

```env
PORT=5001
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_READ_ACCESS_TOKEN=your_tmdb_bearer_token_here
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port the API server listens on |
| `TMDB_API_KEY` | Yes | v3 API key from TMDB dashboard |
| `TMDB_READ_ACCESS_TOKEN` | Yes | Bearer token from TMDB dashboard |
| `DATABASE_URL` | No | PostgreSQL URL (future: watch history) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (defaults to permissive in dev) |
| `LOG_LEVEL` | No | Pino log level: `trace` / `debug` / `info` / `warn` / `error` |

### Run in development

Open two terminals:

```bash
# Terminal 1 — API server (hot reload)
pnpm --filter @workspace/api-server dev

# Terminal 2 — Frontend (Vite dev server on :3000)
pnpm --filter @workspace/ember-realm dev
```

The Vite config proxies `/api/*` requests to `http://localhost:5001`, so the frontend and backend work together without CORS configuration.

Open [http://localhost:3000](http://localhost:3000).

---

## Building for Production

```bash
# Build everything
pnpm run build

# Or build individually
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/ember-realm build
```

The API server builds to `artifacts/api-server/dist/index.mjs` (ESM, bundled with esbuild).

The frontend builds to `artifacts/ember-realm/dist/public/`. In production the API server serves this directory as static files and handles SPA routing via a catch-all route.

To run locally in production mode:

```bash
PORT=5001 TMDB_API_KEY=... node --enable-source-maps artifacts/api-server/dist/index.mjs
```

---

## API Reference

All routes are prefixed with `/api`.

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Returns `{ status: "ok" }` |

### Anime

| Method | Path | Query params | Description |
|---|---|---|---|
| GET | `/anime/trending` | `page` | Trending anime (TMDB) |
| GET | `/anime/popular` | `page` | Most popular anime |
| GET | `/anime/top-rated` | `page` | Top-rated (200+ votes) |
| GET | `/anime/seasonal` | `page` | Released in last 4 months |
| GET | `/anime/search` | `q`, `page` | Search anime by title |
| GET | `/anime/genres` | — | All TMDB genre list |
| GET | `/anime/:id` | — | Full show details (cast, seasons, networks) |
| GET | `/anime/:id/recommendations` | — | Similar shows |
| GET | `/anime/:id/videos` | — | Trailers and teasers |
| GET | `/anime/:id/seasons/:seasonNumber/episodes` | — | Episode list |
| GET | `/anime/:id/embed/:season/:episode` | — | 8 video provider embed URLs |

### Manga

| Method | Path | Query params | Description |
|---|---|---|---|
| GET | `/manga/popular` | `limit`, `offset` | Popular titles (MangaDex + AniList) |
| GET | `/manga/latest` | `limit`, `offset` | Latest updates + trending |
| GET | `/manga/search` | `q`, `limit`, `offset` | Search by title |
| GET | `/manga/:id` | — | Manga details. `:id` is a MangaDex UUID or `al-{anilistId}` |
| GET | `/manga/:id/chapters` | `limit`, `offset` | Chapter list |
| GET | `/manga/chapter/:chapterId/pages` | — | Page image URLs for a chapter |

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero banner, trending/popular/seasonal carousels, popular manga |
| `/anime` | Anime browse with search |
| `/anime/:id` | Anime detail — poster, overview, cast, seasons, trailer |
| `/watch/:id/:season/:episode` | Watch page — embed player with provider switcher |
| `/manga` | Manga browse with search |
| `/manga/:id` | Manga detail — cover, synopsis, chapter list |
| `/manga/read/:id/:chapterId` | Manga reader — vertical scroll, keyboard chapter navigation |

---

## Development Notes

### Regenerating API types

After editing `lib/api-spec/openapi.yaml`:

```bash
pnpm run generate
```

This rewrites files under `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`. Commit both the spec change and the generated output.

### Adding a new API route

1. Add the endpoint to `lib/api-spec/openapi.yaml`
2. Run `pnpm run generate`
3. Implement the route handler in `artifacts/api-server/src/routes/`
4. Register it in `artifacts/api-server/src/routes/index.ts`
5. Use the generated hook in the frontend (`useGetYourNewEndpoint`)

### Cache invalidation

The in-memory cache is per-process and clears on restart. To force-refresh a cached value in dev, restart the API server. TTLs are defined in `artifacts/api-server/src/lib/cache.ts`.

### Supply-chain security

`pnpm-workspace.yaml` enforces a minimum 1-day release age for all npm packages, protecting against newly-published malicious packages. This is managed automatically by pnpm's audit-ci integration.
