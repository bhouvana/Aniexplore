<img width="1400" src="https://capsule-render.vercel.app/api?type=waving&color=c9a01f&height=200&section=header&text=Aniexplore&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=Anime%20%26%20Manga%20without%20limits&descAlignY=58&descSize=22" />

<div align="center">

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![TMDB](https://img.shields.io/badge/TMDB-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://themoviedb.org)
[![MangaDex](https://img.shields.io/badge/MangaDex-FF6740?style=for-the-badge)](https://mangadex.org)
[![AniList](https://img.shields.io/badge/AniList-02A9FF?style=for-the-badge)](https://anilist.co)

**A full-stack anime streaming and manga reading platform built with a modern monorepo.**  
Browse trending anime, watch with multiple embed providers, and read manga — all in one dark gold experience.

</div>

---

## What is Aniexplore?

Aniexplore is a cinematic discovery and reading platform for anime and manga. It aggregates content from TMDB, MangaDex, and AniList to give you a unified place to find what to watch or read next. Built as a production-quality monorepo with a shared OpenAPI type system, an Express proxy backend, and a React SPA frontend.

---

## Features

| Category | Feature |
|---|---|
| **Anime** | Trending, popular, top-rated, and seasonal anime powered by TMDB |
| **Browse** | Filtered browse pages for both anime and manga with real-time search |
| **Watch** | 8 embedded video providers with a one-click switcher if any goes down |
| **Manga** | Popular and latest titles merged from MangaDex + AniList |
| **Reader** | Full-page vertical manga reader with keyboard chapter navigation (← →) |
| **Details** | Full anime pages — cast, seasons, episode list, YouTube trailer modal |
| **Continue Watching** | In-browser watch progress saved to localStorage |
| **UX** | Dark gold theme, glass morphism cards, skeleton loaders, Radix UI |

---

## Tech Stack

### Frontend (`artifacts/ember-realm`)

| Tool | Purpose |
|---|---|
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://typescriptlang.org) | End-to-end type safety |
| [Vite 7](https://vite.dev) | Dev server and bundler |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling with CSS custom properties |
| [Radix UI](https://radix-ui.com) | Accessible headless UI primitives |
| [TanStack React Query](https://tanstack.com/query) | Server state, caching, auto-generated hooks |
| [Wouter](https://github.com/molefrog/wouter) | Lightweight client-side router |
| [Framer Motion](https://framer.com/motion) | Animations and transitions |

### Backend (`artifacts/api-server`)

| Tool | Purpose |
|---|---|
| [Node.js 22](https://nodejs.org) | JavaScript runtime |
| [Express 5](https://expressjs.com) | HTTP server and API routing |
| [TypeScript](https://typescriptlang.org) | Type-safe backend |
| [Pino](https://getpino.io) | Structured JSON logging |
| [TMDB API](https://themoviedb.org) | Anime metadata (trending, details, episodes) |
| [MangaDex API](https://mangadex.org) | Manga chapters and page images |
| [AniList GraphQL](https://anilist.co) | Manga metadata and discovery |

### Shared Libraries (`lib/`)

| Package | Contents |
|---|---|
| `lib/api-spec` | OpenAPI specification — single source of truth for the API contract |
| `lib/api-client-react` | Generated React Query hooks (do not edit — run `pnpm generate`) |
| `lib/api-zod` | Generated Zod validators and inferred TypeScript types |
| `lib/db` | Drizzle ORM + PostgreSQL schema (scaffolded for future persistence) |

Managed by [pnpm workspaces](https://pnpm.io/workspaces) with [Orval](https://orval.dev) for code generation.

---

## Architecture

```
┌───────────────────────────────────────────────────┐
│                    Browser                         │
│   React 19 SPA  ·  Wouter  ·  TanStack Query       │
│   Radix UI  ·  Tailwind CSS  ·  Framer Motion      │
└──────────────────────┬────────────────────────────┘
                       │  REST  /api/*
┌──────────────────────▼────────────────────────────┐
│            Express API  (port 5001)                │
│   /api/anime/*   /api/manga/*   /api/healthz       │
│   In-memory TTL cache  ·  Rate limit 300/15min     │
│   Trust proxy  ·  Security headers  ·  Pino logs   │
└──────────┬─────────────────────┬──────────────────┘
           │                     │
┌──────────▼──────────┐  ┌──────▼────────────────────┐
│  TMDB REST API       │  │  MangaDex REST API         │
│  Anime metadata      │  │  Chapters + page images    │
│  Episodes, cast      │  └──────┬────────────────────┘
│  Trailers            │         │
└─────────────────────┘  ┌──────▼────────────────────┐
                          │  AniList GraphQL           │
                          │  Manga metadata + staff    │
                          └───────────────────────────┘
```

**Code generation flow:**

```
lib/api-spec/openapi.yaml
       │
       ▼  Orval
lib/api-client-react/  →  useGetAnimeDetails(), useGetMangaChapters(), …
lib/api-zod/           →  Zod schemas + TypeScript types
```

---

## Project Structure

```
aniexplore/
├── artifacts/
│   ├── api-server/              # Express backend
│   │   └── src/
│   │       ├── app.ts           # Express setup, middleware chain
│   │       ├── index.ts         # Entry point, graceful SIGTERM shutdown
│   │       ├── lib/
│   │       │   ├── cache.ts     # In-memory TTL cache with periodic sweep
│   │       │   └── logger.ts    # Pino logger
│   │       ├── middleware/
│   │       │   ├── rate-limit.ts
│   │       │   ├── security-headers.ts
│   │       │   └── error-handler.ts
│   │       └── routes/
│   │           ├── anime.ts     # TMDB anime routes
│   │           └── manga.ts     # MangaDex + AniList manga routes
│   │
│   └── ember-realm/             # React SPA
│       └── src/
│           ├── pages/           # Route-level page components
│           ├── components/
│           │   ├── layout/      # TopNav, BottomNav, SearchModal
│           │   ├── anime/       # HeroSection, AnimeCarousel, AnimeCard
│           │   └── manga/       # MangaCarousel, MangaCard
│           ├── lib/
│           │   └── tmdb.ts      # TMDB image URL builders
│           └── App.tsx          # Router + React Query provider
│
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml         # API contract (source of truth)
│   ├── api-client-react/        # Generated React Query hooks
│   ├── api-zod/                 # Generated Zod validators
│   └── db/                      # Drizzle ORM + PostgreSQL (future)
│
├── render.yaml                  # Render deployment config
└── pnpm-workspace.yaml          # Workspace + supply-chain security
```

---

## Local Development

### Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

### 1. Clone the repo

```bash
git clone https://github.com/bhouvana/Aniexplore.git
cd Aniexplore
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

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
| `DATABASE_URL` | No | PostgreSQL URL (future: watch history persistence) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `LOG_LEVEL` | No | Pino log level: `trace` / `debug` / `info` / `warn` / `error` |

### 4. Start both apps

```bash
# Terminal 1 — API server (port 5001)
pnpm --filter @workspace/api-server dev

# Terminal 2 — Frontend (port 3000)
pnpm --filter @workspace/ember-realm dev
```

Vite proxies all `/api/*` requests to `http://localhost:5001` in development, so no CORS setup is needed.

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

All routes are prefixed with `/api`.

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/healthz` | Returns `{ status: "ok" }` |

### Anime

| Method | Path | Params | Description |
|---|---|---|---|
| `GET` | `/anime/trending` | `page` | Trending anime |
| `GET` | `/anime/popular` | `page` | Most popular anime |
| `GET` | `/anime/top-rated` | `page` | Top-rated (200+ votes) |
| `GET` | `/anime/seasonal` | `page` | Released in last 4 months |
| `GET` | `/anime/search` | `q`, `page` | Search by title |
| `GET` | `/anime/genres` | — | All TMDB genre list |
| `GET` | `/anime/:id` | — | Full details — cast, seasons, networks |
| `GET` | `/anime/:id/recommendations` | — | Similar shows |
| `GET` | `/anime/:id/videos` | — | Trailers and teasers |
| `GET` | `/anime/:id/seasons/:n/episodes` | — | Episode list |
| `GET` | `/anime/:id/embed/:season/:episode` | — | 8 video provider embed URLs |

### Manga

| Method | Path | Params | Description |
|---|---|---|---|
| `GET` | `/manga/popular` | `limit`, `offset` | Popular titles from MangaDex + AniList |
| `GET` | `/manga/latest` | `limit`, `offset` | Latest updates + trending |
| `GET` | `/manga/search` | `q`, `limit`, `offset` | Search by title |
| `GET` | `/manga/:id` | — | Details. `:id` is a MangaDex UUID or `al-{anilistId}` |
| `GET` | `/manga/:id/chapters` | `limit`, `offset` | Chapter list |
| `GET` | `/manga/chapter/:chapterId/pages` | — | Page image URLs for a chapter |

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero banner, trending/popular/seasonal carousels, popular manga |
| `/anime` | Anime browse with search and filters |
| `/anime/:id` | Anime detail — poster, overview, cast, seasons, trailer modal |
| `/watch/:id/:season/:episode` | Watch page — embed player with 8-provider switcher |
| `/manga` | Manga browse with search |
| `/manga/:id` | Manga detail — cover, synopsis, full chapter list |
| `/manga/read/:id/:chapterId` | Manga reader — vertical scroll, keyboard chapter navigation |

---

## Scripts

```bash
pnpm run build               # Build all packages for production
pnpm run typecheck           # TypeScript check across the monorepo
pnpm run generate            # Regenerate API hooks + Zod types from openapi.yaml

pnpm --filter @workspace/api-server dev    # API server with hot reload
pnpm --filter @workspace/ember-realm dev   # Frontend dev server
pnpm --filter @workspace/api-server build  # Build API server
pnpm --filter @workspace/ember-realm build # Build frontend
```

---

## License

MIT © [Bhouvana](https://github.com/bhouvana)

---

<div align="center">
  <sub>Built with React 19 · Powered by TMDB · Manga by MangaDex & AniList</sub>
</div>

<img width="1400" src="https://capsule-render.vercel.app/api?type=waving&color=c9a01f&height=120&section=footer" />
