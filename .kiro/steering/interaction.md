# Interaction Patterns

## Interview Before Implementing

For ambiguous or complex requests, ask clarifying questions BEFORE writing code.
Skip the interview for clear, well-defined tasks.

## Plan Mode

For multi-step tasks (new features, refactors, architecture changes):
1. Write a short numbered plan first
2. Wait for approval before implementing
3. Adapt if requirements change mid-execution

Skip planning for single-file fixes or simple questions.

## Context Hygiene

- Keep each steering/spec file under ~200 lines
- One concern per file
- Update specs when features are completed or changed

## Git Rules

- **NEVER commit, push, or create tags** — the developer handles all git operations
- Prepare changes and suggest a commit message
