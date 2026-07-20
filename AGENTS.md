# AGENTS.md

## Project

This is an Android-first mobile app for managing dance battles.

The app works offline-first and without a cloud server.

One device acts as Host Admin and is the source of truth.
Other devices will later connect locally as:
- Judge
- MC / Presenter
- Spectator

Current target:
- Android-first
- React Native / Expo
- TypeScript
- Zustand
- SQLite event log persistence
- No external backend

iOS will be a separate app/client later.

## Current architecture

Use this flow for business logic:

UI
→ Zustand action
→ AppCommand
→ handleCommand()
→ AppEvent[]
→ applyEvent()
→ Zustand state
→ SQLite event log

Do not mutate battle state directly in UI.

Domain logic must stay independent from React Native.

Important folders:

src/domain/
- pure business/domain logic
- no React Native imports
- no UI
- no SQLite
- no network

src/domain/commands/
- command types
- command handlers
- command validation

src/domain/sync/
- AppEvent
- BattleAppState
- applyEvent
- initial state

src/infrastructure/
- SQLite
- storage
- network later

src/stores/
- Zustand stores
- connects UI with domain and infrastructure

src/screens/
- UI screens
- screens may call store actions
- screens should not contain business rules

## Main domain rules

Qualification:
- 3 judges by default
- Participants receive scores from each judge
- Score range is 1–10
- Ranking is based on average score
- Top 8 is generated after qualification is finished

Top 8 bracket:
- 1 vs 8
- 4 vs 5
- 2 vs 7
- 3 vs 6

Battle voting:
- Judges vote for participant A or participant B
- Winner is calculated by majority
- For MVP, collect all judges' votes before finishing the battle
- Winners advance to semifinal, then final
- Final winner is champion

## Coding rules

- Use TypeScript.
- Prefer explicit types for domain models.
- Keep domain functions pure.
- Do not add new production dependencies without asking.
- Do not add a backend.
- Do not introduce cloud sync.
- Do not implement Bluetooth/Wi-Fi sync yet unless the task explicitly asks.
- Do not rewrite architecture without asking.
- Do not move UI logic into domain.
- Do not put SQLite code inside domain.
- Do not add tests unless explicitly requested for this project stage.
- Do not hardcode user-facing UI labels, placeholders, or messages. Add a key to
  `src/resources/resources.ts` and read it through `getResource()`.

## Current project priorities

1. Finish local domain/store architecture.
2. Persist event log in SQLite.
3. Prepare Host Sync Core without real network.
4. Later connect local WebSocket transport.
5. UI screens are handled by another developer, so avoid large UI work unless requested.

## Commands

Before changing code, inspect the existing package.json scripts.

Preferred checks after changes:
- npm run typecheck, if available
- npm run lint, if available
- npm run start should not be broken

Do not invent scripts if they do not exist.

## Working style

For each task:
1. Briefly summarize what files you plan to change.
2. Make small focused changes.
3. Avoid broad refactors.
4. Explain what changed.
5. Mention any assumptions or skipped checks.

When unsure, ask before changing architecture.
