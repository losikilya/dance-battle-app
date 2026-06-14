# UI Store API

UI code should read store state and call the public actions below. Screens should
not create `AppCommand` or apply `AppEvent` directly.

## Host Battle Store

Import:

```ts
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
```

State:

- `event`
- `participants`
- `judges`
- `scores`
- `battles`
- `votes`
- `currentQualificationParticipantIndex`
- `isHydrated`
- `isHydrating`
- `storageError`

Selectors:

- `getCurrentQualificationParticipant()`
- `getScoresForCurrentParticipant()`
- `getRanking()`
- `getChampionId()`
- `getVotesForBattle(battleId)`
- `getJudgeVoteForBattle(battleId, judgeId)`
- `canStartQualification()`
- `canGoToNextQualificationParticipant()`
- `canFinishQualification()`
- `canGenerateTop8()`
- `canStartBattle(battleId)`
- `canGenerateNextRound()`

Actions:

- `hydrateFromStorage()`
- `createHostDemoEvent(params?)`
- `resetDemo()`
- `startQualification()`
- `submitQualificationScore({ participantId, judgeId, score })`
- `goToNextQualificationParticipant()`
- `finishQualification()`
- `generateTop8()`
- `startBattle(battleId)`
- `generateNextRound()`

`createHostDemoEvent()` defaults to:

```ts
{
  title: 'Urban Clash 2026',
  categoryTitle: 'Hip-Hop 1x1',
  participantsCount: 10,
  judgesCount: 3,
  format: 'top8',
}
```

It atomically replaces the SQLite event log with reset, event creation,
participant removal, and participant addition events. Judges are created by the
Host event command. The first ten participants use the existing demo fixture;
additional participants receive generated demo names.

## Host Server Store

Import:

```ts
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
```

State:

- `status`
- `hostIp`
- `port`
- `connectedClients`
- `lastError`
- `connectionInfo`

`connectionInfo` is either `null` or:

```ts
{
  host: string;
  port: number;
  address: string;
}
```

Actions:

- `startServer()`
- `stopServer()`
- `restartServer()`
- `broadcastState()` for manual recovery snapshots

The server automatically broadcasts newly appended Host events. Screens do not
need to broadcast after ordinary Host actions.

## Judge Client Store

Import:

```ts
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
```

State:

- `status`
- `host`
- `port`
- `deviceId`
- `role`
- `assignedJudgeId`
- `assignedJudgeName`
- `syncedState`
- `lastError`

Actions:

- `connectToHost({ host, port, role, name?, requestedJudgeId? })`
- `disconnect()`
- `submitCurrentQualificationScore(score)`
- `submitBattleVote({ battleId, winnerId })`
- `requestSnapshot()`

Selectors:

- `getCurrentQualificationParticipant()`
- `getActiveBattle()`
- `getParticipantName(participantId)`

Compatibility actions `connect`, `sendScore`, and `sendVote` remain available
for existing screens. New UI should prefer the public actions above.

`submitCurrentQualificationScore(score)` resolves both the assigned judge and
current participant from client state. `submitBattleVote(...)` adds the
Host-assigned judge ID before sending the command.

The Judge selectors read only from `syncedState`. They return `null` when there
is no current participant or active battle. `getParticipantName(...)` returns
`'Unknown'` when the participant is unavailable.

## Example Host Flow

```ts
const createHostDemoEvent = useDemoBattleStore(
  state => state.createHostDemoEvent,
);
const startQualification = useDemoBattleStore(
  state => state.startQualification,
);
const startServer = useJudgingServerStore(state => state.startServer);

await createHostDemoEvent();
await startServer();
await startQualification();
```

## Example Judge Flow

```ts
const connectToHost = useJudgingClientStore(state => state.connectToHost);
const submitScore = useJudgingClientStore(
  state => state.submitCurrentQualificationScore,
);

connectToHost({
  host: '192.168.1.5',
  port: 8080,
  role: 'judge',
  name: 'Judge Alex',
});

submitScore(8);
```

## Screen Ownership

- Host dashboard, participants, qualification administration, rankings,
  brackets, and results use `useDemoBattleStore`.
- Host server status, QR/manual connection details, and connected-device lists
  use `useJudgingServerStore`.
- Judge connection, qualification scoring, battle voting, and remote read-only
  state use `useJudgingClientStore`.
- Role selection and local display identity use `useSessionStore`.

## Async Actions

Store actions that persist data or start the server are asynchronous. In an
`onPress` callback where the promise is intentionally not awaited, explicitly
discard it:

```tsx
<Button onPress={() => void startQualification()}>
  Start qualification
</Button>
```
