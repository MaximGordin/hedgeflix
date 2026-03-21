---
name: review-skill
description: Review changed files for bugs, improvements, and refactoring opportunities. Use when the user wants a code review of their recent changes.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git *), Edit
---

# Code Review — Changed Files

Review all files changed since the last commit for bugs, improvements, and refactoring opportunities.

## Context to gather

1. **Changed files** (staged + unstaged):
   - Diff: !`git diff HEAD 2>/dev/null`
   - Staged only: !`git diff --cached --name-only 2>/dev/null`
   - Unstaged only: !`git diff --name-only 2>/dev/null`
   - Untracked: !`git ls-files --others --exclude-standard 2>/dev/null`

2. **Recent commit history** (for context of what's been happening):
   - !`git log --oneline -10 2>/dev/null`

3. **Project instructions**: Read `CLAUDE.md` at the project root to understand stack, architecture, and conventions.

4. **Codebase context**: When reviewing a changed file, also look at related files (imports, modules it belongs to, similar patterns elsewhere) to understand the full picture.

## Review process

For each changed/added file:

1. **Read the full current file** (not just the diff) to understand the complete context
2. **Read files it imports from or is imported by** to understand integration points
3. **Check for consistency** with the rest of the codebase (naming, patterns, structure)
4. **Analyze** for bugs, type issues, security problems, performance, and best practices

## Output format

Group all findings by severity level. Within each level, group by file. Skip levels that have no findings.

### 🔴 Critical — Bugs & Security
> Errors that will cause crashes, data loss, security vulnerabilities, or incorrect behavior at runtime.

### 🟠 Warning — Potential Issues
> Code that works now but is fragile, may break under edge cases, has subtle type issues, or violates important conventions.

### 🟡 Suggestion — Improvements
> Better approaches, performance improvements, stricter typing, missing error handling for expected scenarios.

### 🔵 Nitpick — Style & Readability
> Naming, formatting, minor inconsistencies, dead code, unnecessary complexity.

---

## Finding format

For each finding, use this structure:

**[File:line] Short description of the issue**

_What's wrong:_ Explain the problem clearly and concisely.

_Solutions:_

| Approach | Code / Description | Pros | Cons |
|----------|--------------------|------|------|
| A: ... | `code snippet or explanation` | ... | ... |
| B: ... | `code snippet or explanation` | ... | ... |

If there's only one reasonable solution, skip the table and just show the fix.

---

## Refactoring section

After the severity-based review, add a separate section if applicable:

### 🔄 Adopt new patterns — Retroactive consistency check

When new functionality is added (constants, helpers, modules, shared utilities, error classes, etc.), search the **entire codebase** for older code that does the same thing inline or ad-hoc. Flag those places as candidates for migration to the new pattern.

Examples:
- New error constants file added → find all hardcoded error strings and suggest replacing with constants
- New shared DTO created → find duplicate type definitions in other modules
- New validation pipe registered globally → find manual validation logic that can be removed
- New utility function added → find duplicated logic elsewhere that could use it

### ♻️ Refactoring Opportunities

Suggest structural improvements for readability and extensibility:
- Extracting code into separate modules/methods/files
- Changing how configs or dependencies are wired
- Improving project structure or file organization
- Reducing duplication across changed files

For each suggestion, explain **why** it helps and **what it enables** in the future. Include trade-offs (is it worth doing now or later?).

---

## Best practices per technology

When reviewing, apply official best practices for each technology used in the project. Flag violations as findings at the appropriate severity level.

- **NestJS**: proper use of dependency injection, module encapsulation, DTOs for validation, guards/interceptors/pipes where appropriate, async providers, proper exception filters, following the NestJS module architecture
- **Prisma**: efficient queries (avoid N+1), proper use of `select`/`include` to limit fetched data, transactions where needed, proper error handling for Prisma exceptions (`PrismaClientKnownRequestError`), using generated types instead of `any`
- **Next.js (App Router)**: correct use of server/client components, proper data fetching patterns, metadata API, route handlers, avoiding unnecessary `'use client'`, proper loading/error boundaries
- **Feature-Sliced Design (FSD)**: correct layer hierarchy (app → pages → widgets → features → entities → shared), no cross-slice imports within the same layer, public API via index files, proper slice isolation
- **TypeScript**: strict typing, no unnecessary `any`, proper use of generics, discriminated unions over type assertions, `unknown` over `any` for unsafe data. **Type annotation hygiene:** flag missing annotations where TS cannot infer (function params, empty arrays/objects, `let` declarations, public API exports) AND flag redundant annotations where TS already infers correctly (`const` with literal, `as const`, return of typed function calls). Remove unused type imports.
- **Tailwind CSS**: consistent use of design tokens, avoiding arbitrary values when utility classes exist, responsive design patterns, proper dark mode handling
- **General**: SOLID principles, DRY (but not premature abstraction), proper error handling, security (OWASP top 10), performance considerations

## Rules

- Focus analysis on changed files, but use the rest of the codebase for context
- Follow the project's conventions from CLAUDE.md (NestJS, Prisma, FSD, code style)
- Apply best practices listed above — flag deviations with explanation of why the best practice matters
- Don't flag things that are obviously intentional TODO/test code unless they're dangerous
- Be specific — include file paths, line numbers, and concrete code examples
- If there are NO findings at a severity level, skip that section entirely
- If the changes look good overall, say so briefly at the end

## Auto-fix

Immediately fix (using Edit tool) minor stylistic issues that don't affect logic. Do NOT report these as findings — just fix them silently and list what was fixed at the end of the review under a "🔧 Auto-fixed" section.

What to auto-fix:
- Missing newline at end of file
- Trailing whitespace
- Missing blank line between logical blocks (imports vs code, metadata vs component, etc.)
- Double spaces in strings/classNames
- Unused imports that are obviously dead (not just potentially unused)

What NOT to auto-fix (report as findings instead):
- Anything that changes runtime behavior
- Renaming variables/functions
- Restructuring code
- Adding/removing logic
