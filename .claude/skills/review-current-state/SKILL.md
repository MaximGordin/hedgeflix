---
name: review-current-state
description: Review all existing code for bugs, pattern violations, and quality issues. Ignores unimplemented features — focuses only on what's already built. Use after completing a feature or a chunk of functionality.
allowed-tools: Read, Grep, Glob, Bash(git *), Agent, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# Current State Review

Deep review of all **existing code** — architecture, quality, patterns, conventions, configs. Does NOT compare against design or flag missing features/pages. If something isn't implemented yet, it's not a finding.

## Core principle

> Only flag problems in code that exists. "This page/endpoint/feature doesn't exist yet" is NEVER a finding. The project is under active development — missing functionality is expected.

## Phase 1 — Gather context

1. **Project instructions**: Read `CLAUDE.md` to understand stack, architecture, conventions.
2. **Project structure**: Explore the full directory tree.
   - !`find . -type f -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/dist/*' -not -path '*/generated/*' -not -path '*/.git/*' -not -path '*/design/*' | head -200`
3. **Git state**: Recent commits for context.
   - !`git log --oneline -15 2>/dev/null`
4. **Package configs**: Read `package.json` files (root, backend, frontend) for dependencies and scripts.

## Phase 2 — Review existing backend code

Use Agent tool to parallelize backend and frontend exploration. Read **every source file** in the project.

For each existing module/service/controller:
1. Read all source files (module, controller, service, DTOs, guards, pipes, interceptors)
2. Check Prisma schema: indexes, relations, constraints, types
3. Verify Prisma queries: N+1 problems, missing error handling, inefficient selects/includes
4. NestJS patterns: DI, module encapsulation, exception handling, validation
5. API design: REST conventions, HTTP status codes, response shapes
6. Security: input validation, auth guards, injection vectors, CORS, rate limiting
7. Test quality: are existing tests correct, thorough, following good patterns?

## Phase 3 — Review existing frontend code

For each existing component/page/widget:
1. FSD compliance: correct layer placement, no cross-slice imports within same layer, public API via index files
2. Server vs client components: correct `'use client'` boundaries, no unnecessary client components
3. State management: Zustand store patterns, selector usage, persistence
4. Tailwind: design tokens consistency, no arbitrary values where utilities exist, responsive patterns
5. Dark mode: correct theme switching, no flash of wrong theme, all components handle both themes
6. Accessibility: semantic HTML, aria attributes, keyboard navigation, focus management
7. Next.js patterns: metadata, layouts, loading/error boundaries, image optimization

## Phase 4 — Cross-cutting concerns

1. **TypeScript strictness**: `strict` mode enabled, no unnecessary `any`, proper generics, type inference
2. **Error handling**: consistent patterns, proper error boundaries, meaningful error messages
3. **Environment variables**: `.env.example` up to date, no secrets in code
4. **CI/CD pipeline**: does it cover what exists? Gaps in lint/format/test/build steps
5. **Dependencies**: outdated packages, unused dependencies, security vulnerabilities
6. **Configs**: ESLint, Prettier, tsconfig — are they correct and consistent between backend/frontend?
7. **Testing**: coverage of existing code, test quality, mocking patterns
8. **Performance**: unnecessary re-renders, heavy queries, bundle size concerns
9. **Security**: OWASP top 10 across existing code
10. **Documentation accuracy**: does README/CLAUDE.md match what's actually in the code right now?

## Output format

---

### Current State Summary

Brief assessment (3-5 sentences). What's built, what's the quality level, what are the main risks in existing code.

| Area | Status | Notes |
|------|--------|-------|
| Architecture | 🟢/🟡/🔴 | ... |
| Code quality | 🟢/🟡/🔴 | ... |
| Testing | 🟢/🟡/🔴 | ... |
| Security | 🟢/🟡/🔴 | ... |
| CI/CD | 🟢/🟡/🔴 | ... |
| Configs & DX | 🟢/🟡/🔴 | ... |

---

### 🔴 Critical — Bugs & Security

Errors that will cause crashes, data loss, security vulnerabilities, or incorrect behavior in **existing code**.

### 🟠 Important — Should Fix Soon

Architectural problems, convention violations, patterns that will compound as the project grows.

### 🟡 Suggestions — Worth Improving

Better approaches, performance wins, stricter typing, missing patterns in existing code.

### 🔵 Minor — Nice to Have

Style, naming, small inconsistencies.

---

### 📝 Documentation Accuracy

Only check if existing docs match existing code. Flag:
- README instructions that don't work or are outdated
- CLAUDE.md conventions that aren't actually followed in the code
- Missing setup steps for features that ARE implemented
- Incorrect information about existing functionality

### 🗺️ Recommended Fixes

Prioritized list of what to fix — only things found in existing code. Order by impact.

---

## Finding format

Same as review-changes:

**[File:line] Short description**

_What's wrong:_ Clear explanation.

_Suggested fix:_ Code or approach. For complex findings, use a table:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| A: ... | ... | ... | ... |
| B: ... | ... | ... | ... |

## Best practices per technology

When verifying best practices, use the `context7` MCP tools to look up current official documentation. Resolve library IDs first with `resolve-library-id`, then query specific topics with `query-docs`.

Key areas to verify against official docs:
- **NestJS**: module architecture, DI patterns, guards, pipes, interceptors, exception filters
- **Prisma**: query optimization, error handling, schema design
- **Next.js (App Router)**: server/client components, data fetching, caching, metadata
- **Feature-Sliced Design**: layer rules, slice isolation, public API patterns
- **Tailwind CSS**: configuration, design system integration, dark mode

## What to flag

- Bugs in existing code
- Security vulnerabilities in existing code
- Pattern/convention violations (FSD, NestJS, Prisma, etc.) in existing code
- Incorrect or missing configs for existing functionality
- Tests that are wrong or test the wrong thing
- Performance issues in existing queries/components
- Accessibility problems in existing UI
- Documentation that doesn't match existing code

## What NOT to flag

- Missing pages, endpoints, or features that simply haven't been built yet
- "You should add X endpoint" or "This page needs Y feature"
- Design coverage gaps (that's review-project's job)
- Roadmap suggestions or next steps for new functionality
- Missing tests for code that doesn't exist yet
- Missing i18n, auth, or other planned-but-not-started modules

## Self-review before output

Before presenting findings to the user, do a self-review pass over every finding:

1. **Verify the claim**: Re-read the exact line/file referenced. Does the code actually do what you say it does? Don't rely on memory or assumptions — re-check.
2. **Check context**: Is the "problem" intentional? Is there a comment, TODO, or surrounding code that explains why it's done this way?
3. **Test the fix**: Would your suggested fix actually work? Does the API/function/type you're recommending exist?
4. **Drop false positives**: If a finding doesn't hold up after verification, remove it silently. Don't mention it was considered and dropped.

This step is mandatory. Skipping it leads to false positives that waste the user's time and erode trust in reviews.

## Rules

- Read every existing source file — be thorough
- Use Agent tool to parallelize exploration of backend and frontend
- Verify findings against official docs before flagging — avoid false positives
- Be specific: file paths, line numbers, code examples
- Skip severity levels with no findings
- If the codebase is clean, say so — don't invent findings
- Focus on "what IS broken/wrong" not "what COULD be added"
- The review should be thorough enough that running it after each feature catches regressions
