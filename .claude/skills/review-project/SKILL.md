---
name: review-project
description: Deep full-project review — architecture, code quality, design consistency, documentation. Use for periodic comprehensive audits, not for reviewing recent changes.
allowed-tools: Read, Grep, Glob, Bash(git *), Agent, mcp__pencil__get_editor_state, mcp__pencil__open_document, mcp__pencil__batch_get, mcp__pencil__get_screenshot, mcp__pencil__snapshot_layout, mcp__pencil__get_variables, mcp__pencil__search_all_unique_properties, mcp__context7__resolve-library-id, mcp__context7__query-docs, WebFetch
---

# Full Project Review

Comprehensive review of the entire project: architecture, code quality, design file, documentation, and alignment between all of them.

## Phase 1 — Gather context

1. **Project instructions**: Read `CLAUDE.md` to understand stack, architecture, conventions.
2. **Project structure**: Explore the full directory tree to understand how the project is organized.
3. **Git state**: Check recent commits, branches, and overall project history.
   - !`git log --oneline -20 2>/dev/null`
   - !`git branch -a 2>/dev/null`
4. **Package configs**: Read `package.json` files (root, backend, frontend) for dependencies and scripts.
5. **Design file**: Open the Pencil design file (`design/HedgFlex.pen`) and examine all screens, components, and design tokens. Take screenshots of key screens.
6. **Documentation**: Read `README.md` and any other docs.

## Phase 2 — Analyze each layer

### Backend (NestJS + Prisma)

Review the full backend. Use the `context7` MCP tools to look up official docs when verifying best practices.

For each module:
1. Read the module file, controller, service, DTOs
2. Check Prisma schema and queries for correctness and efficiency
3. Verify NestJS patterns: DI, module encapsulation, exception handling, validation pipes
4. Check for N+1 queries, missing indexes, unhandled Prisma errors
5. Review API design: REST conventions, proper HTTP status codes, response shapes
6. Security: auth guards, input validation, SQL injection, rate limiting

### Frontend (Next.js + FSD)

Review the full frontend:
1. FSD layer compliance: app → pages → widgets → features → entities → shared
2. No cross-slice imports within the same layer
3. Public API via index files for each slice
4. Server vs client components — correct boundaries
5. Data fetching patterns (server components, React Query, etc.)
6. Tailwind usage: design tokens consistency, no arbitrary values where utilities exist
7. Responsive design and dark mode handling
8. Accessibility basics (semantic HTML, aria attributes, keyboard navigation)

### Shared packages

Check `packages/shared/` (if exists):
1. Types and DTOs shared between frontend and backend
2. No runtime dependencies leaking between packages

### Design → Code roadmap

The design file is an **approximate reference**, not a pixel-perfect spec. The owner may intentionally diverge in details (colors, spacing, exact layout). Use the design to understand:
1. **Planned pages and screens** — what screens exist in the design that aren't yet implemented?
2. **Page structure and blocks** — what major UI blocks/sections does each screen contain?
3. **Feature scope** — what functionality is implied by the design (filters, modals, forms, etc.)?
4. **Navigation and user flows** — how screens connect to each other
5. **Component inventory** — what reusable components are visible across screens?

Do NOT flag pixel-level differences (exact colors, spacing, font sizes) as issues — those are expected. Focus on missing pages, missing blocks, and missing functionality.

### Documentation accuracy

1. Does README accurately describe the current state of the project?
2. Are setup instructions complete and correct?
3. Does CLAUDE.md reflect actual conventions used in the code?
4. Is the roadmap up to date?

## Phase 3 — Cross-cutting concerns

1. **TypeScript strictness**: `strict` mode, no unnecessary `any`, proper generics usage
2. **Error handling**: consistent patterns across backend and frontend
3. **Environment variables**: all documented, no secrets in code, `.env.example` up to date
4. **CI/CD**: pipeline covers lint, format, tests — are there gaps?
5. **Dependencies**: outdated packages, unnecessary dependencies, security vulnerabilities
   - Run `pnpm outdated` if available
   - Check for duplicate dependencies
6. **Testing**: coverage gaps, test quality, mocking patterns
7. **Performance**: bundle size concerns, unnecessary re-renders, heavy queries
8. **Security**: OWASP top 10 check across the full stack

## Output format

Structure the review as follows:

---

### 📊 Project Health Summary

A brief overall assessment (3-5 sentences). Current state, biggest strengths, biggest risks.

| Area | Status | Notes |
|------|--------|-------|
| Architecture | 🟢/🟡/🔴 | ... |
| Code quality | 🟢/🟡/🔴 | ... |
| Design coverage | 🟢/🟡/🔴 | ... |
| Documentation | 🟢/🟡/🔴 | ... |
| Testing | 🟢/🟡/🔴 | ... |
| Security | 🟢/🟡/🔴 | ... |
| CI/CD | 🟢/🟡/🔴 | ... |

---

### 🔴 Critical — Must Fix

Issues that will cause bugs, security vulnerabilities, data loss, or block progress.

### 🟠 Important — Should Fix Soon

Architectural problems, significant code quality issues, convention violations that will compound over time.

### 🟡 Suggestions — Worth Improving

Better approaches, performance wins, stricter typing, missing patterns.

### 🔵 Minor — Nice to Have

Style, naming, small inconsistencies.

---

### 🎨 Design Coverage Report

What's in the design vs what's implemented. Focus on structure, not pixel details:
- **Implemented screens** — what from the design is already built
- **Not yet implemented** — screens/blocks from the design that are missing in code
- **Code without design** — screens/components in code that don't appear in the design (may be fine)
- **Implied features** — functionality visible in the design that should inform backend/frontend planning

### 📝 Documentation Report

What's accurate, what's outdated, what's missing.

### 🗺️ Recommended Next Steps

Based on everything found, suggest a prioritized action plan (what to fix first and why).

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

When verifying best practices, use the `context7` MCP tools to look up current official documentation. This ensures advice is based on the latest recommendations, not outdated patterns.

Resolve library IDs first with `resolve-library-id`, then query specific topics with `query-docs`.

Key areas to verify against official docs:
- **NestJS**: module architecture, DI patterns, guards, pipes, interceptors, exception filters
- **Prisma**: query optimization, error handling, schema design, migrations
- **Next.js (App Router)**: server/client components, data fetching, caching, metadata, route handlers
- **Feature-Sliced Design**: layer rules, slice isolation, public API patterns
- **Tailwind CSS**: configuration, design system integration, dark mode

## Self-review before output

Before presenting findings to the user, do a self-review pass over every finding:

1. **Verify the claim**: Re-read the exact line/file referenced. Does the code actually do what you say it does? Don't rely on memory or assumptions — re-check.
2. **Check context**: Is the "problem" intentional? Is there a comment, TODO, or surrounding code that explains why it's done this way?
3. **Test the fix**: Would your suggested fix actually work? Does the API/function/type you're recommending exist?
4. **Drop false positives**: If a finding doesn't hold up after verification, remove it silently. Don't mention it was considered and dropped.

This step is mandatory. Skipping it leads to false positives that waste the user's time and erode trust in reviews.

## Rules

- This is a DEEP review — take your time, read every file, check everything
- Use Agent tool to parallelize exploration of backend and frontend
- Always verify findings against official docs before flagging — avoid false positives
- Be specific: file paths, line numbers, code examples
- Distinguish between "broken now" vs "will cause problems later"
- Skip severity levels that have no findings
- Provide actionable recommendations, not vague advice
- The review should be thorough enough that running it monthly catches everything important
