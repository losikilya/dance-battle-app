# Development Workflow

## Team model

This project is developed by:
- Product/Developer: Ilya
- Architecture assistant: ChatGPT
- Coding agent: Codex in VS Code
- UI developer: colleague

## Responsibilities

### Ilya

- makes product decisions
- reviews code
- runs app on device/emulator
- accepts or rejects architecture changes

### ChatGPT

- decomposes tasks
- designs architecture
- writes prompts for Codex
- reviews proposed implementation direction
- helps debug issues

### Codex

- implements focused code changes
- edits files in VS Code
- follows AGENTS.md
- avoids unrequested architecture rewrites
- reports changed files and assumptions

### UI developer

- implements screens/components
- consumes Zustand store
- does not duplicate domain rules in UI

## Branching

Recommended:
- main
- feature/domain-core
- feature/local-storage
- feature/host-sync-core
- feature/ui-mvp

Before asking Codex to change code:
1. Commit or stash current work.
2. Give Codex a focused task.
3. Review diff manually.
4. Run available checks.
5. Commit accepted changes.

## Codex task format

Use this prompt pattern:

Task:
<what to implement>

Context:
<which files/folders are relevant>

Constraints:
<what not to change>

Acceptance criteria:
<how we know it is done>

Output:
- list changed files
- explain implementation
- mention checks run
- mention assumptions

## Do not ask Codex for huge tasks

Bad:
"Build the whole sync system."

Good:
"Create src/domain/sync/syncMessage.ts with SyncMessage types only."

## Current project stage

We are not focusing on UI screens and tests right now.

Current priority:
1. Domain/store architecture
2. SQLite event log persistence
3. Host Sync Core without real network
4. Later WebSocket transport