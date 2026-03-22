# Current State Review — 2026-03-22

## 🟠 Important

- [x] **[Header.tsx:4-5]** FSD violation — widget imports other widgets (LangSwitcher, ThemeSwitcher). Move to `@features/`
- [x] **[eslint.config.mjs:20]** `sourceType: 'commonjs'` but project is ESM — change to `'module'`
- [x] **[layout.tsx:11]** Static title `"Hedgeflix | Homepage"` overrides all pages — use template
- [x] **[package.json:29]** `@jest/globals` in `dependencies` — move to `devDependencies`
- [x] **[backend/pnpm-lock.yaml]** Duplicate lockfile in monorepo — remove and gitignore
- [x] **[schema.prisma]** Missing indexes on FK columns (MovieCast.personId, MovieCrew.personId, Comment.movieId/userId, PersonImage.personId)

## 🟡 Suggestions

- [x] **[ThemeSwitcher.tsx:21-33]** Flash of wrong theme — add inline script to set `data-theme` before hydration
- [x] **[ThemeSwitcher.tsx:37-46]** Theme options are `<div onClick>` — replace with `<button>` for accessibility
- [x] **[main.ts]** No CORS config — add `app.enableCors()` before frontend integration
- [x] **[main.ts]** No global ValidationPipe — add for future POST/PATCH endpoints
- [ ] **[ci.yml]** No `pnpm build` step — add when setting up deployment

## 🔵 Minor

- [x] **[.env.example]** Missing `PORT` variable
- [x] **[schema.prisma:165]** `gender Int` magic numbers — consider Prisma enum
- [x] **[globals.css]** Dark theme doesn't override status colors (danger/success/warning/info)
- [x] **[README.md]** Setup/Development sections only cover backend — add frontend steps
- [x] **[CLAUDE.md]** Mentions `packages/shared/` but it doesn't exist
