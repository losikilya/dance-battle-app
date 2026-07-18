# UI Store API

UI code should read store state and call the public actions below. Screens should
not create `AppCommand` or apply `AppEvent` directly.

## Session Roles and Active Views

Import:

```ts
import { useSessionStore } from '@stores/session/useSessionStore';
```

Session state:

- `roles`: local permissions/duties enabled for the current session
- `activeViewRole`: the local role view currently displayed
- `selfJudgeId`: the Host judge identity used for local scoring and voting

Actions:

- `setRoles(roles)`
- `toggleRole(role)`
- `hasRole(role)`
- `isHost()`
- `isJudge()`
- `isMC()`
- `isSpectator()`
- `setActiveViewRole(role | null)`
- `setSelfJudgeId(judgeId | null)`
- `clearSession()`
- `resetSession()`

`roles` is the single source of truth for local permissions and routing. A Host
session always includes both `host` and `spectator`; those two duties cannot be
removed through `toggleRole`. Host may also include `mc` and/or `judge`.
Remote sessions use one role in the array: `judge`, `mc`, or `spectator`.

App-level session reset should also stop the Host server and disconnect the
Judging client before clearing `roles`, `activeViewRole`, and `selfJudgeId`.
This prevents stale Host TCP listeners and stale remote connection roles from
surviving a role change.

`activeViewRole` controls which local view is shown. Changing it does not start
a client connection or affect TCP messages. The Host remains authoritative in
every Host-local view.

Network join still uses a single connection role. The TCP join payload and
`connectToHost({ role: 'judge' | 'mc' | 'spectator', ... })` keep their
existing `role` field. UI should pass that role explicitly from the selected
remote role or current remote `activeViewRole`, not from local session state.

Role selection writes session state as:

```ts
// Host
setRoles(['host', 'spectator']);
setActiveViewRole('host');

// Remote Judge
setRoles(['judge']);
setActiveViewRole('judge');

// Remote MC
setRoles(['mc']);
setActiveViewRole('mc');

// Remote Spectator
setRoles(['spectator']);
setActiveViewRole('spectator');
```

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

Create Event UI also collects `qualificationDurationSeconds` and
`qualificationAdvanceMode`. Duration should be validated as a positive
reasonable integer before calling `createEvent(params)`.
The `/create-event` route is Host-only: no-role sessions are redirected to
discovery, and remote Judge/MC/Spectator sessions are redirected back to the
main tabs instead of being promoted into Host by direct navigation.

## Shared Battle Read Model

Shared Brackets, Rankings, and Battle Result screens should read visible event
state through `useBattleState()` / `useVisibleBattleState()` from
`@stores/battle/useBattleState`.

- Host sessions read from `useDemoBattleStore`.
- Remote Judge, MC, and Spectator sessions read from
  `useJudgingClientStore.syncedState`.
- Remote shared screens are read-only and must not show Host controls such as
  participant/admin CTAs, battle start, open voting, mock votes, generate next
  round, generate Top 8, or manual broadcast/recovery actions.
- If remote `syncedState` is missing, shared screens should show a waiting or
  connect state instead of falling back to local Host store data.

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
- `qualificationTimer`
- `isHydrated`
- `isHydrating`
- `storageError`

Selectors:

- `getCurrentQualificationParticipant()`
- `getQualificationTimer()`
- `getQualificationTimerRemainingMs(nowMs?)`
- `getQualificationTimingConfig()`
- `getScoresForCurrentParticipant()`
- `getRanking()`
- `getChampionId()`
- `getVotesForBattle(battleId)`
- `getJudgeVoteForBattle(battleId, judgeId)`
- `canStartQualification()`
- `canGoToNextQualificationParticipant()`
- `canManuallyAdvanceQualificationParticipant()`
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
- `pauseQualificationTimer()`
- `resumeQualificationTimer()`
- `restartQualificationTimer()`
- `advanceQualificationParticipant()`
- `markCurrentParticipantAbsent()`
- `moveCurrentParticipantToEnd()`
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
- `getQualificationTimer()`
- `getQualificationTimerRemainingMs(nowMs?)`
- `getQualificationTimingConfig()`
- `getScoresForCurrentParticipant()`
- `canManuallyAdvanceQualificationParticipant()`
- `advanceQualificationParticipant()`
- `markCurrentParticipantAbsent()`
- `moveCurrentParticipantToEnd()`
- `canFinishQualification()`
- `finishQualification()`

Screens must not advance the participant or finish qualification by mutating
state directly.

Qualification timing is authoritative in the Host store and persisted through
the event log. Event config supports `qualificationDurationSeconds` and
`qualificationAdvanceMode: 'manual' | 'automatic'`; defaults are `60` seconds
and `'manual'`.

Timer state:

```ts
{
  status: 'idle' | 'running' | 'paused' | 'expired',
  participantId: string | null,
  durationSeconds: number,
  endsAt: string | null,
  remainingMsWhenPaused: number | null,
}
```

UI should derive ticking display time from `endsAt` or
`remainingMsWhenPaused`; it should not write events every second.
The shared timer display renders `mm:ss`, freezes while paused, shows expired
state at `00:00`, and switches to warning styling at `10` seconds or less.

`startQualification()` starts a timer for the first participant. Manual or
automatic advancement starts a fresh timer for the next participant. Paused
timers never auto-advance. `resumeQualificationTimer()` creates a new absolute
`endsAt`, and `restartQualificationTimer()` starts the full duration again for
the current participant.

In manual mode, expiry marks the timer expired but does not advance. In
automatic mode, expiry advances without waiting for Judge scores. Last
participant expiry stops the timer as expired. `finishQualification()` still
requires all required scores. Judges may submit scores for earlier participants
while qualification remains active.

MC timer controls use the public timer actions:

- Host-local MC reads `useDemoBattleStore` directly.
- Remote MC reads `useJudgingClientStore` synced state and calls the matching
  client actions.
- The Host server permits MC clients to send only timer pause, timer resume,
  timer restart, participant advance, participant absent, and participant late
  commands.
- MC Next is shown only in manual qualification mode. Automatic mode follows
  the Host timer coordinator.
- MC Absent records zero scores for all judges through its own domain
  command/event path. Normal Judge score submission remains validated as `1..10`.
- MC Late moves the current qualification participant to the end of the queue
  and restarts the qualification timer for the next current participant. Late
  and manual Next are unavailable for the last participant.
- MC Absent and Late commands are participant-specific. Store actions include
  the visible/current `participantId` in the command payload, and the Host
  rejects the command if that participant no longer matches the Host-current
  qualification participant. This prevents stale remote MC screens from
  affecting the wrong participant.

### Battle Lifecycle

The Host controls battle voting in two explicit steps:

1. `startBattle(battleId)` changes a pending battle to `active`.
2. `openBattleVoting(battleId)` changes the active battle to `voting`.

Judge UI may call `submitBattleVote({ battleId, winnerId })` only while the
synced battle status is `voting`. An `active` battle is visible to Judges, but
voting remains locked until the Host opens it.

### Host Self-Run Views

The Host dashboard provides local Host Control, MC, Judge, and Spectator views.
`activeViewRole` switches between these views, while `roles` controls which
local duties are enabled.

- Host Control reads and changes `useDemoBattleStore`.
- Host MC and Spectator views are read-only and read `useDemoBattleStore`.
- Host Judge view reads `useDemoBattleStore` and uses `selfJudgeId`.
- Remote Judge, MC, and Spectator screens continue to use
  `useJudgingClientStore`.

In Create Event self-run options, Host and Spectator are always checked and
disabled. MC and Judge are optional. The selected self-run options update the
session `roles` array; no session `role` is used.

Host local Judge submissions do not use TCP. When Judge self-role is enabled
and `selfJudgeId` is available, the UI calls:

- `submitQualificationScore({ participantId, judgeId, score })`
- `submitBattleVote({ battleId, judgeId, winnerId })`

The local Judge view is read-only when Judge self-role is disabled. Scoring and
voting are disabled when `selfJudgeId` is missing, and voting is enabled only
while the active battle status is `voting`. During qualification, the Host can
advance participants with `advanceQualificationParticipant()` according to the
configured timing mode; advancement does not require the current participant to
have all scores. `finishQualification()` still requires all required scores.
Remote Judge screens cannot advance or finish qualification.

`createHostDemoEvent()` defaults to:

```ts
{
  title: 'Urban Clash 2026',
  categoryTitle: 'Hip-Hop 1x1',
  participantsCount: 10,
  judgesCount: 1,
  format: 'top8',
  qualificationDurationSeconds: 60,
  qualificationAdvanceMode: 'manual',
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
- `hostAddressCandidates`
- `manualHostOverride`

`connectionInfo` is either `null` or:

```ts
{
  host: string;
  port: number;
  address: string;
  interfaceName: string | null;
  source: 'expo-network' | 'android-interface' | 'manual-override';
}
```

Actions:

- `startServer()`
- `stopServer()`
- `restartServer()`
- `refreshHostAddress()` refreshes the advertised address without restarting TCP
- `selectAdvertisedHost(host)` selects one discovered candidate
- `setManualHostOverride(host)` manually overrides only the advertised IP
- `clearManualHostOverride()` returns to automatic address selection
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
- `pauseQualificationTimer()`
- `resumeQualificationTimer()`
- `restartQualificationTimer()`
- `advanceQualificationParticipant()`
- `markCurrentParticipantAbsent()`
- `moveCurrentParticipantToEnd()`
- `requestSnapshot()`

Selectors:

- `getCurrentQualificationParticipant()`
- `getActiveBattle()`
- `getParticipantName(participantId)`

Compatibility actions `connect`, `sendScore`, and `sendVote` remain available
for existing screens. New UI should prefer the public actions above.

`submitCurrentQualificationScore(score)` resolves both the assigned judge and
the oldest participant up to the current Host participant that this Judge has
not scored. If no pending participant exists, it uses the current Host
participant. Judge UI should keep showing that pending participant when the
Host advances, show `Сейчас выступает: <current participant>` when the Judge is
behind, and move to the next oldest unscored participant after submitting.
Remote Judge UI must not expose participant advance controls.
`submitBattleVote(...)` adds the Host-assigned judge ID before sending the
command.

## Local TCP Connection

Both devices must be connected to the same Wi-Fi network or to the Host phone's
hotspot. The Host TCP server always binds to `0.0.0.0:<port>`, but the
advertised address is selected separately for screen display and QR generation.
UI must display and share a usable LAN/private IPv4 address, not `0.0.0.0`,
`127.0.0.1`, or `localhost`.

Host `connectionInfo` is the source of truth for display and QR generation:

```ts
{
  host: '192.168.1.10',
  port: 8080,
  address: '192.168.1.10:8080',
  interfaceName: 'wlan0',
  source: 'android-interface',
}
```

Address selection priority is:

1. usable Expo `expo-network` LAN IPv4
2. Android native network-interface candidates from Wi-Fi/hotspot-like
   interfaces (`wlan`, `wifi`, `ap`, `softap`, `swlan`)
3. other private IPv4 candidates, including `10.x.x.x`, `172.16-31.x.x`,
   `192.168.x.x`, and `100.64.0.0/10`
4. no advertised address

The Android native resolver enumerates
`java.net.NetworkInterface.getNetworkInterfaces()` and returns active
non-loopback IPv4 addresses with interface name, address, `isLoopback`, and
`isUp`. It ignores IPv6, `0.0.0.0`, `127.x.x.x`, loopback, VPN/tun-style
interfaces, and obvious cellular interfaces when possible.

The server may start successfully before an advertised address is found. If no
usable IPv4 address is available, Host UI should show a warning and must not
encode a QR payload with localhost or the bind address. Host UI can call
`refreshHostAddress()` after enabling Wi-Fi or hotspot.

If multiple valid candidates are discovered, Host UI may call
`selectAdvertisedHost(host)`. `setManualHostOverride(host)` allows a validated
IPv4 override for display and QR generation. Overrides do not change the TCP
bind address.

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
state/IP diagnostics. After native module changes, rebuild the Android native
app, for example:

```bash
npm run android
```

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
- Remote shared rankings, brackets, and results use synced Host state from
  `useJudgingClientStore.syncedState` through `useBattleState()` and remain
  read-only.
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
