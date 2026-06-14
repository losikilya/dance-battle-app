# Architecture

## Product idea

Dance battle management app.

The app helps organize:
- participant registration
- qualification rounds
- judges' scores
- automatic ranking
- Top 8 bracket generation
- battle voting
- automatic winner advancement
- spectator read-only mode

No cloud server in MVP.

## Roles

### Host Admin

The source of truth.

Responsibilities:
- create event
- manage participants
- manage judges
- start qualification
- finish qualification
- generate Top 8
- start battles
- collect votes
- confirm or override results later
- persist event log
- later broadcast events to connected devices

### Judge

Responsibilities:
- score qualification participants
- vote in battles

### MC / Presenter

Responsibilities:
- see current participant
- see queue
- see ranking
- see bracket
- see current battle and winner

### Spectator

Responsibilities:
- read-only view
- live event state
- current battle
- ranking
- bracket

## Architecture layers

### UI Layer

React Native screens and components.

Should:
- render state from Zustand
- call store actions
- avoid business rules

Should not:
- calculate winners
- generate brackets
- mutate event log directly

### Store Layer

Zustand store.

Responsibilities:
- expose state to UI
- expose actions to UI
- create commands
- execute command handlers
- apply events
- persist events

### Command Layer

Location:

src/domain/commands/

Responsibilities:
- validate user/system intentions
- convert commands into events
- reject invalid actions

Example:

battle.submitVote command
→ validation
→ battle.voteSubmitted event
→ maybe battle.finished event

### Event Layer

Location:

src/domain/sync/

Responsibilities:
- define AppEvent
- define BattleAppState
- apply events to state
- replay event log

### Domain Logic

Location:

src/domain/

Responsibilities:
- calculate ranking
- generate bracket
- calculate battle winner
- advance winners

Domain logic must be pure TypeScript.

### Infrastructure Layer

Location:

src/infrastructure/

Responsibilities:
- SQLite
- local storage
- network transport later
- QR/local connection later

## State flow

UI action
→ Zustand action
→ createCommand()
→ handleCommand(state, command)
→ AppEvent[]
→ save AppEvent[] to SQLite
→ applyEvent()
→ update Zustand state

## Future sync flow

Client device
→ sends AppCommand to Host

Host
→ handleCommand()
→ saves AppEvent[] to SQLite
→ applies events
→ broadcasts AppEvent[] to all clients

Client devices
→ receive AppEvent[]
→ applyEvent()
→ update local UI