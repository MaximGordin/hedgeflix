---
name: retro
description: Analyze the current conversation and give feedback on communication patterns, prompt quality, and interaction efficiency. Use at the end of a session or after a long task.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Session Retrospective

Analyze this conversation and give the user actionable feedback on how to improve their interaction with Claude Code.

## What to analyze

1. **Prompt clarity** — Were requests clear and unambiguous? Did vague prompts cause unnecessary back-and-forth?
2. **Iteration count** — Could results have been achieved in fewer messages? What caused extra rounds?
3. **Context sharing** — Did the user provide enough context upfront, or did I have to ask/guess?
4. **Task scoping** — Were tasks well-scoped, or too broad/too narrow?
5. **Good patterns** — What worked well? Reinforce effective habits.
6. **Tool/skill awareness** — Did the user miss opportunities to use available skills or tools?

## Output format

Keep it concise and honest. No fluff.

---

### Session Stats

- Messages exchanged: ~N
- Tasks completed: N
- Unnecessary back-and-forth rounds: N

### What Worked Well

Bullet list of effective patterns the user used in this session.

### What to Improve

Each item:
- **Pattern observed**: What happened
- **Why it's inefficient**: What it cost (extra messages, wrong direction, etc.)
- **Better approach**: Concrete example of a better prompt or workflow

### Recurring Patterns

Only if this matches patterns from previous retros saved in memory. Skip if first retro or no matches.

---

## Rules

- Be honest and direct — the user explicitly asked for this feedback (see memory: feedback_honesty.md)
- Give specific examples FROM THIS conversation, not generic advice
- If the session was short (< 5 substantive messages), say so and suggest running retro on longer sessions
- If communication was already good, say so — don't invent problems
- Save any significant new feedback pattern to memory (type: feedback) if it's likely to recur
- Keep the retro under 300 words
- Write in the same language the user has been using in this session
