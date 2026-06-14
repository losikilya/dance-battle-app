# Codex Tasks

## Current status

The project is Android-first dance battle app.

Already designed architecture:
- domain logic
- Zustand store
- command layer
- event layer
- applyEvent
- eventLog
- SQLite persistence planned

UI screens are handled by another developer.

## Next tasks

### Task 1: Verify current project structure

Goal:
Inspect the current repository and report existing folders, package scripts, and installed dependencies.

Do not change files.

Expected output:
- package manager
- scripts from package.json
- current src structure
- missing folders compared to planned architecture
- recommended next implementation task

### Task 2: Add Codex project docs

Goal:
Add AGENTS.md and docs files if missing.

Files:
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/DEVELOPMENT_WORKFLOW.md
- docs/CODEX_TASKS.md

Do not change application code.

### Task 3: Implement SQLite event repository

Goal:
Create infrastructure for persisting AppEvent[] in SQLite.

Files:
- src/infrastructure/storage/database.ts
- src/infrastructure/storage/migrations.ts
- src/infrastructure/storage/appEventRepository.ts

Requirements:
- use expo-sqlite
- save AppEvent
- save AppEvent[]
- load AppEvent[]
- clear AppEvent[]
- preserve event order
- use sequence autoincrement
- store event_json

Do not modify UI screens.

### Task 4: Connect Zustand store to SQLite persistence

Goal:
Update battle store so events are persisted and restored.

Requirements:
- add hydrateFromStorage()
- add isHydrated
- add isHydrating
- add storageError
- executeCommand should save events before applying them
- reset should clear persisted events
- replay should still work

Do not rewrite domain logic.

### Task 5: Create SyncMessage types

Goal:
Prepare sync protocol types without network implementation.

Files:
- src/domain/sync/syncMessage.ts

Types:
- command
- events
- snapshot
- error
- join
- joined
- ping
- pong

Do not implement WebSocket yet.

### Task 6: Create HostSyncEngine in memory

Goal:
Create a pure TypeScript HostSyncEngine that accepts commands and returns events or errors.

Files:
- src/domain/sync/hostSyncEngine.ts

Requirements:
- no WebSocket
- no React Native
- no SQLite
- accepts BattleAppState
- uses handleCommand
- applies events
- exposes getState()
- exposes getEventLog()