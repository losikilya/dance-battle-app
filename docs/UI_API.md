# UI Store API

UI code should read store state and call the public actions below. Screens should
not create `AppCommand` or apply `AppEvent` directly.

## Session and Self-Run Roles

Import:

```ts
import { useSessionStore } from '@stores/session/useSessionStore';
```

`role` remains the primary device role used by existing routing and networking.
It is not replaced by self-run mode.

Additional self-run state:

- `roles`: local duties enabled for the current session
- `activeViewRole`: the Host dashboard view currently displayed
- `selfJudgeId`: the Host judge identity used for local scoring and voting

Actions:

- `setRoles(roles)`
- `toggleRole(role)`
- `hasRole(role)`
- `setActiveViewRole(role | null)`
- `setSelfJudgeId(judgeId | null)`

When `role === 'host'`, `roles` always includes both `host` and `spectator`.
Those two duties cannot be removed. MC and Judge duties are optional.

Changing `activeViewRole` changes only the local Host presentation. It does not
change `role`, start a client connection, or affect TCP messages. The Host
remains authoritative in every local view.

When a Host creates an event with the Judge self-role enabled,
`selfJudgeId` is assigned to the first Judge created by the Host event command.
If Judge is not enabled, `selfJudgeId` is cleared. The Host server reserves
`selfJudgeId` so the same Judge identity is not assigned to a remote device.
This does not change the TCP protocol.

Event creation offers Judge counts `1`, `3`, and `5`. One-Judge self-run events
are supported. When the Host enables the Judge self-role, the only Judge in a
one-Judge event becomes `selfJudgeId`. For larger panels, the first Judge is
used for the Host self-role. Loading the default Host demo event follows the
same assignment rule.

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
- `canOpenBattleVoting(battleId)`
- `canGenerateNextRound()`

Actions:

- `hydrateFromStorage()`
- `createEvent(params)` returns the first created Judge ID, or `null`
- `createHostDemoEvent(params?)`
- `resetDemo()`
- `startQualification()`
- `submitQualificationScore({ participantId, judgeId, score })`
- `goToNextQualificationParticipant()`
- `finishQualification()`
- `generateTop8()`
- `startBattle(battleId)`
- `openBattleVoting(battleId)`
- `generateNextRound()`

### Host Qualification Control

The reachable Host qualification UI reads the current participant and scores
from the Host battle store. It advances and finishes qualification through:

- `getCurrentQualificationParticipant()`
- `getScoresForCurrentParticipant()`
- `canGoToNextQualificationParticipant()`
- `goToNextQualificationParticipant()`
- `canFinishQualification()`
- `finishQualification()`

Screens must not advance the participant or finish qualification by mutating
state directly.

### Battle Lifecycle

The Host controls battle voting in two explicit steps:

1. `startBattle(battleId)` changes a pending battle to `active`.
2. `openBattleVoting(battleId)` changes the active battle to `voting`.

Judge UI may call `submitBattleVote({ battleId, winnerId })` only while the
synced battle status is `voting`. An `active` battle is visible to Judges, but
voting remains locked until the Host opens it.

### Host Self-Run Views

The Host dashboard provides local Host Control, MC, Judge, and Spectator views.
The primary session `role` stays `host` while switching between them.

- Host Control reads and changes `useDemoBattleStore`.
- Host MC and Spectator views are read-only and read `useDemoBattleStore`.
- Host Judge view reads `useDemoBattleStore` and uses `selfJudgeId`.
- Remote Judge, MC, and Spectator screens continue to use
  `useJudgingClientStore`.

Host local Judge submissions do not use TCP. When Judge self-role is enabled
and `selfJudgeId` is available, the UI calls:

- `submitQualificationScore({ participantId, judgeId, score })`
- `submitBattleVote({ battleId, judgeId, winnerId })`

The local Judge view is read-only when Judge self-role is disabled. Scoring and
voting are disabled when `selfJudgeId` is missing, and voting is enabled only
while the active battle status is `voting`. After submitting a qualification
score, the Host local Judge can use `goToNextQualificationParticipant()` when
the current participant has all required scores, or `finishQualification()`
when qualification is complete. Remote Judge screens cannot advance or finish
qualification.

`createHostDemoEvent()` defaults to:

```ts
{
  title: 'Urban Clash 2026',
  categoryTitle: 'Hip-Hop 1x1',
  participantsCount: 10,
  judgesCount: 1,
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

## Local TCP Connection

Both devices must be connected to the same Wi-Fi network or the same phone
hotspot. The Host listens on `0.0.0.0`, but UI must display and share the
usable LAN IPv4 address, not `0.0.0.0`, `127.0.0.1`, or `localhost`.

Host `connectionInfo` is the source of truth for display and QR generation:

```ts
{
  host: '192.168.1.10',
  port: 8080,
  address: '192.168.1.10:8080',
}
```

If no usable LAN IPv4 address is available, Host UI should show a warning and
must not encode a QR payload with localhost or the bind address.

The QR payload format is JSON:

```json
{
  "version": 1,
  "host": "192.168.1.10",
  "port": 8080
}
```

QR scanning also accepts the legacy manual format `host:port`, but new QR codes
must use the JSON payload above. After a valid scan, the app either immediately
calls `connectToHost({ host, port, role, name, requestedJudgeId })` when the
client role is already selected, or stores the parsed `host:port` as the
prefilled manual address so the user can explicitly connect after selecting a
role. Invalid QR data should show an error.

Manual address entry uses the same parser as legacy QR data. It trims
whitespace, accepts IPv4 addresses or hostnames, requires a port from `1` to
`65535`, and rejects `0.0.0.0`, `127.*`, and `localhost`.

The TCP transport uses `react-native-tcp-socket`, so it requires a native
Android build or Expo development build. It will not work in Expo Go. Android
requires `INTERNET`; `ACCESS_NETWORK_STATE` is also configured for network
state/IP diagnostics.

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
