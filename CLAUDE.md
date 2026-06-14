# Project Overview

Dance Battle App is a React Native/Expo mobile application for managing break-dance tournaments. It supports qualification stages, Top-8 bracket generation, semifinals, and finals. Entry point: `expo-router/entry`.

---

# Architecture

The app uses **Event Sourcing** as its core architectural pattern:

```
User Action → Command → Validation → AppEvent → applyEvent() → New State
```

- **Commands** (`src/domain/commands/`) — describe user intent
- **AppEvent** (`src/domain/sync/appEvent.ts`) — immutable facts recorded after a command executes
- **applyEvent** (`src/domain/sync/applyEvent.ts`) — pure state transition function
- **Store** (`src/stores/`) — Zustand store wrapping the event log and computed properties

Navigation is built on **Expo Router** (file-based routing) with route groups `(tabs)` and `(auth)`.

---

# Directory Structure

```
src/
├── app/                  # Expo Router — routes (file-based routing)
│   ├── _layout.tsx       # Root Stack layout
│   ├── (auth)/           # Auth screen group
│   └── (tabs)/           # Tab group (Home, Profile, Event, Design)
├── components/           # Reusable UI components
├── constants/            # Colors, Dimensions
├── domain/               # Business logic (event sourcing, types, utilities)
│   ├── battle/
│   ├── bracket/
│   ├── commands/
│   ├── demo/
│   ├── event/
│   ├── judge/
│   ├── participant/
│   ├── qualification/
│   └── sync/
├── resources/            # Localization strings
├── screens/              # Feature screens (DemoBattleScreen, CreateEventScreen)
├── shared/               # Shared utilities (lib/createId.ts)
└── stores/               # Zustand stores
```

---

# Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Root layout | `src/app/_layout.tsx` | Stack navigation, font loading |
| Tab layout | `src/app/(tabs)/_layout.tsx` | Custom TabBar with 4 tabs |
| Demo store | `src/stores/demoBattle/useDemoBattleStore.ts` | Main Zustand store with event log |
| applyEvent | `src/domain/sync/applyEvent.ts` | Pure event reducer |
| Commands | `src/domain/commands/` | Command types + createCommand + handlers |
| Bracket | `src/domain/bracket/` | Top-8 bracket generation |
| ID generation | `src/shared/lib/createId.ts` | `prefix_timestamp_random` format |
| Colors | `src/constants/Colors.ts` | Single color palette |
| Dimensions | `src/constants/Dimensions.ts` | SCREEN_WIDTH, SCREEN_HEIGHT, HEADER_HEIGHT, FOOTER_HEIGHT |

---

# Development Workflow

- **Start**: `npm start` / `expo start`
- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Type checking**: `tsc --noEmit`
- **Routes**: added via file system under `src/app/`
- **New components**: created in `src/components/<ComponentName>/` with a required `index.ts` barrel export

---

# Code Style

## General

- **TypeScript strict mode** — no `any`, no `as any`, no unnecessary casts
- **React Native StyleSheet** — styles only via `StyleSheet.create()`, not inline objects
- **No inline styles** in JSX (except computed values that cannot be moved to StyleSheet)
- **No default exports from components** — use named exports through barrel `index.ts`
- **No comments** unless the WHY is non-obvious from context

## Component File Structure

```
src/components/ComponentName/
├── ComponentName.tsx   # Implementation
└── index.ts            # Barrel: export { ComponentName } from './ComponentName'
```

## Screen File Structure

```
src/screens/FeatureName/
├── FeatureName.tsx     # Root screen
├── SubComponent.tsx    # Child parts
└── index.ts
```

---

# Naming Conventions

| Entity | Style | Example |
|--------|-------|---------|
| Components | PascalCase | `AvatarStack`, `RangeSlider` |
| Hooks | camelCase with `use` prefix | `useDemoBattleStore` |
| Functions | camelCase | `calculateWinner`, `generateBracket` |
| Types/Interfaces | PascalCase | `DanceEvent`, `Participant` |
| Constants | UPPER_SNAKE_CASE | `SCREEN_WIDTH`, `FOOTER_HEIGHT` |
| Component files | PascalCase.tsx | `RangeSlider.tsx` |
| Utility/hook files | camelCase.ts | `createId.ts`, `applyEvent.ts` |
| ID strings | `prefix_timestamp_random` | `event_1718000000_abc123` |
| Expo Router routes | kebab-case or index | `(tabs)/index.tsx`, `profile/settings.tsx` |

---

# Testing Rules

- Tests are not configured in the project (no test framework installed).
- When adding tests, place them next to the tested file: `applyEvent.test.ts`.
- Prioritize testing pure domain functions: `applyEvent`, `generateBracket`, `calculateWinner`.

---

# Project Conventions

- **Spacing via `Box`**: use props `m`, `p`, `mx`, `py`, etc. on the `Box` component rather than `View` + `StyleSheet` margin/padding.
- **Text only via `Text` component** with variants (`h1`, `h2`, `body`, `bodyBold`, `body2`, `button`, `caption`), never raw React Native `<Text>`.
- **Colors only from `Colors.ts`** — no hardcoded hex/rgb values in components.
- **Icons via `Icon` component** (wrapper over `@expo/vector-icons`).
- **Font**: Hauora (Regular, Bold, ExtraBold) — loaded in the root layout.

---

# Architecture Decisions

1. **Event Sourcing** chosen for a full audit trail and replay/undo support.
2. **Zustand** (not Redux/MobX) — minimal boilerplate, good compatibility with React 19.
3. **Expo Router** (not bare React Navigation) — file-based routing simplifies navigation structure.
4. **Zod** used for validation at boundaries (commands, forms).
5. **Domain-driven design**: business logic is isolated in `src/domain/` with no dependency on UI or React.
6. **Custom TabBar** instead of the default Expo Router tab bar — for full design control.

---

# Known Patterns

## Creating IDs

```ts
import { createId } from '@/shared/lib/createId'
const id = createId('event') // → "event_1718000000_abc123"
```

## Barrel export

```ts
// src/components/MyComponent/index.ts
export { MyComponent } from './MyComponent'
```

## Path aliases (tsconfig.json)

```
@screens/*   → src/screens/*
@components  → src/components
@constants/* → src/constants/*
@resources   → src/resources
@stores/*    → src/stores/*
@domain/*    → src/domain/*
```

Path aliases are resolved by Metro automatically (Expo SDK 50+) — no `babel.config.js` needed.

## Route files (src/app/**)

Route files do **not** need `import React` — Expo's tsconfig provides the `React` namespace globally. All routes use `React.JSX.Element` return type without importing React.

## Component import rules

Components inside `src/components/` must import siblings via **relative paths**, never via `@components` barrel:

```ts
// ✅ correct
import { Text } from '../Text';
// ❌ wrong — creates require cycle logged at runtime
import { Text } from '@components';
```

## Strings and colors

- All user-facing strings → `src/resources/resources.ts`, accessed via `getResource(key)` from `@resources`. Keys sorted alphabetically.
- Resource key naming: `<screen_name>_<key>` prefix per screen (e.g. `role_selection_title`, `judging_subtitle`).
- All color values → `src/constants/Colors.ts`. No inline hex/rgba anywhere. Sections: `Colors.border`, `Colors.role`, `Colors.warning` added in 2026-06-14 session.

## Native modules (Dev Build required)

`react-native-tcp-socket` requires a native Dev Build — Expo Go will crash.
- Simulator: `npx expo run:ios`
- Physical device: `npx expo run:ios --device`
- Rebuild after adding packages: `npx expo prebuild --clean && npx expo run:ios`

## Zustand stores with native refs

Non-serializable values (native server handles, socket Maps) live at **module level**, outside Zustand state. Hot reload (Fast Refresh) resets these refs while native resources keep running — full reload (Cmd+R) needed after editing such stores.

## Event status flow (DanceEvent.status)

```
draft → qualification → qualification_finished → battle → finished
```

---

# Important User Instructions

- **Never run `git commit`** without explicit direct permission from the user.
- **Never run `git push`** without explicit direct permission from the user.
- **Never create Git tags.**
- **Never modify Git history** (no amend, rebase, or reset --hard without explicit request).
- **Never auto-commit** during work.
- All changes are confined to the project working tree.
- **Keep CLAUDE.md current**: after every task, check whether new patterns or decisions emerged and update this file.

---

# Change Log For Conventions

| Date | Change |
|------|--------|
| 2026-06-14 | Created CLAUDE.md from full project analysis (structure, architecture, code style, conventions) |
| 2026-06-14 | Added: component import rules, resource/color patterns, native build notes, Zustand module-level ref pattern |
| 2026-06-14 | Added: resource key naming convention, missing path alias note, route file React import rule |
| 2026-06-14 | Added `@stores/*` and `@domain/*` path aliases to tsconfig; migrated all relative `../../stores/` and `../../domain/` imports |

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**Setup:** `.mcp.json` (gitignored) configures the MCP server locally. The graph cache lives in `.code-review-graph/` (also gitignored). Run `build_or_update_graph` if the graph is missing or stale.

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
