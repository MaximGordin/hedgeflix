# Hedgeflix

Movie catalog application with multi-language support, ratings from multiple sources, and detailed movie/person metadata.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, Prisma 7, PostgreSQL 17 |
| Frontend | Next.js (App Router), Feature-Sliced Design |
| Languages | TypeScript |
| Package manager | pnpm (workspaces) |
| Localization | en, ru, nl |

## Project Structure

```
hedgeflix/
├── backend/                # NestJS API
│   ├── src/                # Application source code
│   ├── prisma/             # Schema & migrations
│   ├── scripts/            # Seed & sync scripts
│   └── generated/          # Prisma client (auto-generated, git-ignored)
├── frontend/               # Next.js App Router (planned)
├── packages/
│   └── shared/             # @hedgeflix/shared — shared types, DTOs, constants (planned)
├── package.json            # Workspace root
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
cd backend
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Copy environment variables
cp .env.example .env
# Fill in TMDB_ACCESS_TOKEN and OMDB_API_KEY (see "Data Sources" below)

# 4. Run migrations
npx prisma migrate dev

# 5. Generate prisma client
npx prisma generate

# 6. Seed the database with movies
pnpm seed:movies -- --limit 20 --min-rating 7.5 --min-year 2000

# 7. Start the dev server
pnpm start:dev
```

## Database

### Schema Overview

Full schema: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

**Core entities:**
- `Movie` — film data (title, runtime, budget, revenue, awards, etc.)
- `Person` — actors, directors, writers (single table, one person can have multiple roles)
- `Genre` — movie genres
- `User` — application users

**Localization** is handled via separate translation tables (`MovieTranslation`, `PersonTranslation`, `GenreTranslation`), one row per language. This allows adding new languages without schema changes.

**Movie metadata:**
- `MovieRating` — ratings from multiple sources (IMDb, TMDB, Rotten Tomatoes, Metacritic), each with original value and normalized 0-10 score
- `MovieVideo` — trailers (YouTube links)
- `MovieCertification` — age ratings per country (e.g., US: "R", RU: "18+", DE: "16")
- `MovieGenre` — many-to-many relation

**Movie-Person relations:**
- `MovieCast` — actors with character name and billing order
- `MovieCrew` — directors, writers, screenwriters with job title

**Movie-Movie relations:**
- `MovieSimilar` — similar movies
- `MovieRecommendation` — recommended movies

**Person media:**
- `PersonImage` — profile photos

**User interactions:**
- `Comment` — flat comments on movies
- `Bookmark` — saved movies
- `UserRating` — user's personal score (1-10)
- `WatchedMovie` — watch history

**Awards** are stored as an OMDb text string + parsed numeric fields (`oscars_won`, `total_wins`, `total_nominations`) on both `Movie` and `Person`.

## Data Sources

Movie data is fetched from two external APIs:

| Source | What it provides | API Key |
|--------|-----------------|---------|
| [TMDB](https://www.themoviedb.org/) | Movie details, cast/crew, posters, translations, trailers, similar/recommendations, age ratings, person bios | Free — register at [themoviedb.org](https://www.themoviedb.org/settings/api) |
| [OMDb](https://www.omdbapi.com/) | IMDb rating, Rotten Tomatoes, Metacritic, awards text, US box office | Free (1000 req/day) — register at [omdbapi.com](https://www.omdbapi.com/apikey.aspx) |

Add your keys to `backend/.env`:
```env
TMDB_ACCESS_TOKEN=your_bearer_token
OMDB_API_KEY=your_key
```

## Scripts

All scripts are run from the `backend/` directory.

### Seed Movies

Fetch movies from TMDB + OMDb and populate the database.

```bash
# Seed 20 movies (default) with rating >= 7 and year >= 2000
pnpm seed:movies

# Seed with custom filters
pnpm seed:movies -- --limit 200 --min-rating 7 --min-year 2010

# All options:
#   --limit N        Max movies to fetch (default: 20)
#   --min-rating N   Minimum TMDB rating (default: 7)
#   --min-year N     Minimum release year (default: 2000)
#   --sync           Only add new movies, skip existing
#   --page N         Start from TMDB page N (default: 1)
```

What gets loaded per movie:
- Movie details + translations (en, ru, nl)
- Cast (top 20 actors) + crew (directors, writers)
- Ratings from 4 sources (TMDB, IMDb, Rotten Tomatoes, Metacritic)
- Trailers (YouTube)
- Age ratings per country
- Similar movies & recommendations (linked between existing DB movies)
- Full person details (bio, birthdate, images, translations)
- Awards (parsed from OMDb)

### Sync New Movies

Add only movies that don't already exist in the database.

```bash
pnpm sync:movies

# With custom filters
pnpm sync:movies -- --limit 100 --min-rating 7 --min-year 2024
```

### Sync Relations

Re-fetch and update similar/recommendations for all movies in the database. Run this after adding new movies so existing movies can link to them.

```bash
pnpm sync:relations
```

### Monthly Update Workflow

```bash
# 1. Add new movies
pnpm sync:movies -- --limit 100 --min-rating 7 --min-year 2024

# 2. Re-link similar/recommendations (now includes new movies)
pnpm sync:relations
```

## Roadmap

### Planned
- [ ] Frontend (Next.js App Router + FSD)
- [ ] Auth module (registration, login, JWT)
- [ ] Movie browsing UI (catalog, filters, movie page)
- [ ] User features (comments, bookmarks, ratings, watch history)
- [ ] i18n (next-intl, language switcher)

- [ ] Platform-aware keyboard shortcuts (`<Kbd>` component + `usePlatform` hook)
- [ ] Migrate from Jest to Vitest (backend + frontend)
- [x] CI/CD (GitHub Actions — lint + tests on push/PR)
- [ ] Deploy: Vercel (frontend) + Render (backend) + Neon (PostgreSQL)

### To Explore
- [ ] **Elasticsearch** — full-text search across movies and persons, multi-language analyzers, fuzzy search, autocomplete, faceted filtering (genre + year + rating)
- [ ] **Redis** — server-side API response caching (complements TanStack Query client-side cache), session storage, rate limiting, real-time popularity counters
- [ ] Structured awards (Wikidata SPARQL or manual entry for detailed Oscar categories)

## API Documentation

Swagger UI is available at `/api/doc` when the backend is running.

## Development

```bash
# Start backend in watch mode
cd backend && pnpm start:dev

# Run tests
cd backend && pnpm test

# Lint
cd backend && pnpm lint

# Format
cd backend && pnpm format
```
