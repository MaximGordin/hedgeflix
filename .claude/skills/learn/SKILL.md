---
name: learn
description: Create a detailed learning material (MD file) on a requested topic with examples, internals, tips, and documentation links. Use when the user wants to study a new concept or technology.
argument-hint: [topic]
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch, Agent
---

# Learning Material: $ARGUMENTS

You are an expert educator. Your task is to create a comprehensive learning material on the topic: **$ARGUMENTS**

## Before writing

1. If the topic is ambiguous or too broad, ask the user to clarify or narrow it down.
2. Consider the project context (NestJS, Next.js, Prisma, TypeScript, FSD) — tailor examples to what's relevant.
3. Search the web for the latest documentation and best practices on the topic.

## Structure of the learning material

Create TWO versions of the file — Russian and English:
- `/Users/maximgordin/projects/hedgeflix/learn/ru/<filename>.md`
- `/Users/maximgordin/projects/hedgeflix/learn/en/<filename>.md`

Use the same kebab-case filename for both (e.g. `typescript-decorators.md`). The content structure is identical, only the language differs.

The file MUST follow this structure:

```
# [Topic Name]

## What is it / What problem does it solve
Brief explanation of the concept and why it exists.

## How it works (under the hood)
Explain the internals, mechanisms, and how things work behind the scenes.
Use diagrams (ASCII/text) where helpful.

## Basic usage
Simple, clear examples to get started.

## Practical examples
Real-world examples, ideally related to the Hedgeflix project stack
(NestJS, Next.js, Prisma, TypeScript).

## Advanced patterns / Pro tips
Non-obvious techniques, common patterns, performance considerations,
things that experienced developers know.

## Common mistakes / Gotchas
Pitfalls to avoid, frequent errors, misconceptions.

## Links & Resources
- Official documentation links
- Useful articles, videos, courses
- Related topics to explore next
```

## Guidelines

- RU version: write in Russian, but keep code and technical terms in English.
- EN version: write fully in English.
- Both versions should have the same depth, examples, and structure.
- Use clear, concise language. Explain like teaching a smart developer who is new to this specific topic.
- Include plenty of code examples with comments.
- Show both "what to do" and "what NOT to do" where relevant.
- After creating the files, tell the user both file paths and offer to dive deeper into any section.
