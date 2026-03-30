---
name: review-ts
description: Review TypeScript correctness in changed files. Checks types, generics, narrowing, inference, edge cases, and suggests improvements. Use when the user asks to review TypeScript, check types, or says "/review-ts". By default reviews only unpushed changes; can review full files on request.
allowed-tools: Read, Grep, Glob, Bash(git *), Agent
---

# TypeScript Review

Review **only TypeScript correctness**. Ignore styling, architecture, naming, FSD, accessibility, and other non-TS concerns unless they directly cause a type error.

## Scope

**Default**: Only files with unpushed changes (new files + modified files in unpushed commits).

To determine which files to review:
1. Find the remote tracking branch: `git rev-parse --abbrev-ref @{upstream} 2>/dev/null`
2. If tracking branch exists: `git diff --name-only @{upstream}...HEAD` for committed changes + `git diff --name-only` for unstaged + `git diff --name-only --cached` for staged
3. If no tracking branch: `git diff --name-only main...HEAD` + unstaged + staged
4. Filter to only `.ts` and `.tsx` files

**Full file mode**: When the user says "review the whole file" or passes a file path — review the entire file, not just changes.

## What to check

For each file, read it fully, then analyze:

### 1. Type safety
- Missing or incorrect type annotations
- Unnecessary `any` or `unknown` where a specific type is possible
- Wrong generic parameters (e.g. `useRef(null)` without generic, `MouseEvent` without generic)
- Type assertions (`as`) that hide real problems
- Non-null assertions (`!`) that could cause runtime errors

### 2. Type narrowing & guards
- Missing null/undefined checks before access
- Incorrect narrowing (e.g. `typeof x === 'object'` doesn't exclude `null`)
- Places where discriminated unions or type predicates would be safer

### 3. Inference & redundancy
- Explicit types where TypeScript infers correctly (unnecessary verbosity)
- Places where adding an explicit type would prevent accidental changes

### 4. Generics
- Missing generics on hooks (`useRef`, `useState`, `createContext`, etc.)
- Missing generics on event handlers (`MouseEvent`, `ChangeEvent`, etc.)
- Over-constrained or under-constrained generic parameters

### 5. Edge cases
- Optional chaining (`?.`) used where value is never nullish (unnecessary)
- Optional chaining missing where value can be nullish
- Incorrect `===` comparisons between incompatible types
- Enum/union exhaustiveness — missing cases in switch/if chains

### 6. Better approaches
- Where a different TS pattern would be cleaner or safer (e.g. `satisfies`, `const` assertions, template literal types, mapped types)
- Where utility types (`Partial`, `Pick`, `Omit`, `Record`, etc.) simplify the code

## What NOT to check

- Code style, formatting, naming conventions
- Architecture, file structure, FSD compliance
- React patterns (unless they cause a type error)
- Performance, accessibility, security
- Missing features or unimplemented code
- Import order or unused imports (linter's job)

## Output format

Group findings by file. For each finding:

**[File:line] Short description**

_Problem:_ What's wrong from a TypeScript perspective.

_Fix:_ Concrete code example showing the correct approach.

_Why:_ Brief explanation of what could go wrong or what improves.

## Severity levels

### 🔴 Error — Will cause problems
Type errors, runtime crashes from incorrect types, unsafe assertions hiding bugs.

### 🟠 Improvement — Should fix
Missing generics, unnecessary `any`, weak narrowing that could lead to bugs.

### 🟡 Suggestion — Nice to have
Cleaner patterns, better inference usage, utility types that simplify code.

Skip severity levels with no findings. If everything is clean, say so.

## Rules

- Read every file in scope fully before making findings
- Be specific: file path, line number, code snippet
- Show both the problem code and the fix
- Don't invent findings — if the types are correct, say so
- Explain **why** something is a problem, not just that it is
- Focus on what TypeScript knows and doesn't know — that's the core of every finding
