---
name: sync-docs
description: Analyze and sync information between CLAUDE.md, memory files, and README.md. Removes duplicates, updates outdated info, ensures consistency.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(ls *)
---

# Sync Docs

Analyze the current state of the project and synchronize information across CLAUDE.md, memory, and README.md.

## Steps

### 1. Read all sources

Read the following files:
- `/Users/maximgordin/projects/hedgeflix/CLAUDE.md`
- `/Users/maximgordin/projects/hedgeflix/README.md`
- All files in memory: `/Users/maximgordin/.claude/projects/-Users-maximgordin-projects-hedgeflix/memory/`
- Scan `backend/src/` and `frontend/src/` (if exists) to understand actual project state

### 2. Analyze and detect issues

Check for:
- **Outdated info**: memory or docs that don't match the actual code state (e.g., "next step: create X" when X already exists)
- **Duplicates**: information that exists in both CLAUDE.md and memory (memory should not duplicate CLAUDE.md)
- **Missing info**: important project context that isn't documented anywhere
- **Misplaced info**: feedback/rules in memory that belong in CLAUDE.md, or project details in CLAUDE.md that belong in README

### 3. Apply rules for where information belongs

| Information type | Where it belongs |
|---|---|
| Code style, architecture, commands | CLAUDE.md |
| Collaboration rules | CLAUDE.md |
| Stack, project structure | CLAUDE.md + README |
| Commit style and other workflow rules | CLAUDE.md |
| Who the user is, their experience | Memory (user) |
| Current progress, what's next | Memory (project) |
| External resources (design files, etc.) | Memory (reference) |
| User feedback NOT already in CLAUDE.md | Memory (feedback) |
| Database schema, data sources | README (detailed), CLAUDE.md (summary) |
| Roadmap | README (source of truth) |
| Getting started, setup instructions | README only |

### 4. Present findings and apply changes

Present a summary table of all proposed changes BEFORE making them:

| Action | File | What |
|---|---|---|
| DELETE | memory/xxx.md | Reason |
| UPDATE | memory/yyy.md | What changed |
| ADD | CLAUDE.md | What section |
| MOVE | memory → CLAUDE.md | What info |

Wait for user confirmation, then apply all changes. After changes, update `memory/MEMORY.md` index to reflect current state.

## Important

- Never delete memory that contains unique information not available elsewhere
- When updating project_next_steps.md, check actual code to determine what's done vs planned
- Keep CLAUDE.md concise — it's read every session, so avoid bloat
- README can be more detailed — it's for humans browsing the repo
- All comments and content in files should be in English
