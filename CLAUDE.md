# Hedgeflix

Movie catalog application. New version of [moviebox](../moviebox/).

## Stack

- **Backend:** NestJS 11 + Prisma 7 + PostgreSQL
- **Frontend:** Next.js (App Router) + Feature-Sliced Design (FSD)
- **ORM:** Prisma
- **Package manager:** pnpm (workspaces)
- **Design:** Pencil file at `design/HedgFlex.pen`

## Monorepo Structure

```
hedgeflix/
├── backend/          # NestJS
├── frontend/         # Next.js App Router
├── packages/
│   └── shared/       # @hedgeflix/shared — shared types, DTOs, constants
├── package.json      # workspace root
└── pnpm-workspace.yaml
```

## Architecture

- **Frontend:** FSD (Feature-Sliced Design) - https://feature-sliced.design/
  - Layers: app → pages → widgets → features → entities → shared
  - Each slice: ui / model / api / lib / config
- **Backend:** NestJS modular architecture (modules / controllers / services / dto)

## Database Schema

Full schema: `backend/prisma/schema.prisma`

**Entities:** Movie, Person (actor/director/writer), Genre, User
**Localization:** Separate translation tables (MovieTranslation, PersonTranslation, GenreTranslation) — one row per language (en, ru, etc.)
**Movie metadata:** MovieRating (multi-source: IMDb, TMDB, RT, Metacritic), MovieVideo (trailers), MovieCertification (age ratings per country), MovieGenre
**Movie↔Person:** MovieCast (actors + character/order), MovieCrew (directors, writers + job)
**Movie↔Movie:** MovieSimilar, MovieRecommendation
**Person media:** PersonImage
**User interactions:** Comment (flat), Bookmark, UserRating, WatchedMovie
**Awards:** OMDb string + parsed oscars/wins/nominations counts (on Movie and Person)
**Data sources:** TMDB (primary) + OMDb (IMDb rating, Rotten Tomatoes, Metacritic, awards)

## Collaboration Rules

- **EXPLAIN FIRST**: This is a learning project. Explain concepts and approaches before writing any code.
- **CODE ONLY ON REQUEST**: Only make file changes when explicitly asked (e.g. "do it", "make the change", "write it").
- **CODE STYLE**: Follow project's `.prettierrc` and `eslint.config.mjs` when writing code — single quotes, trailing commas. Always match existing code style in the project.
- Provide guidance on best practices for NestJS, Next.js, Prisma, and FSD.

## Commits

Short messages (1-3 sentences). No Co-Authored-By or attribution lines. Title + one short paragraph max.

## Testing

- **Framework:** Jest 30 + ts-jest (ESM mode)
- **Run:** `cd backend && pnpm test`
- **ESM quirks:** Project uses `"type": "module"`, so Jest requires `--experimental-vm-modules` (already in scripts). Import `describe`, `it`, `expect`, `jest` from `@jest/globals` (not global in ESM).
- **Pattern:** Unit tests colocated with source files (`*.spec.ts`). Mock Prisma in services, mock services in controllers.
- **Migration to Vitest planned** (see README roadmap).

## Commands

- Backend: `cd backend && pnpm start:dev`
- Backend tests: `cd backend && pnpm test`
- CI: GitHub Actions (`ci.yml`) — runs lint + tests on push to main and on PRs

## Previous Version Reference

The moviebox project at `../moviebox/` has:
- Frontend: Next.js + FSD + Zustand + React Query + next-intl + Tailwind
- Backend: NestJS + Prisma (Auth, Movies, Comments, User modules)
