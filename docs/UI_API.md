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

Create Event UI also collects `qualificationDurationSeconds` and
`qualificationAdvanceMode`. Duration should be validated as a positive
reasonable integer before calling `createEvent(params)`.

### Session Reset and Host Guards

Routes that create or configure Host-owned event state are Host-only:

- `/create-event`
- `/configure-battle`

The route wrapper must check session state before rendering the screen. Users
with no role are redirected to discovery. Remote or non-Host users are
redirected to the main tabs. Direct route navigation must not call
`setRole('host')` or otherwise grant Host access.

Exit and reset flows should use the centralized app session cleanup helper
instead of calling `setRole(null)` directly. Cleanup order is:

1. Stop the Host TCP server.
2. Disconnect/reset the Judging client connection target and synced state.
3. Clear session roles, active view, self Judge identity, Judge ID, and Judge
   name.

`AppBootstrap` also protects future reset paths: the Host server may run only
in local Host mode, which means the session has the Host role and the Judging
client does not have an assigned remote role. If an impossible mixed state
appears, the server is stopped instead of started. When the session has no
roles, stale Judging client state is cleared. Active remote client sessions are
not disconnected while a role remains selected.

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
  timer restart, participant advance, participant absent, participant late, and
  qualification finish commands.
- MC Next is available in manual and automatic qualification modes. Automatic
  mode still follows the Host timer coordinator when the timer expires.
- MC controls use icon buttons: pause uses `pause`, resume/start uses `play`,
  restart uses `reload-outline`, next uses `play-forward-outline`, late uses
  `bed`, and absent uses `trash-outline`.
- Next and Late are disabled for the last participant. Absent remains available
  for the last participant. Absent, Late, and Next are disabled when
  qualification is not active or no current participant exists.
MC clients cannot generate brackets, start battles, open voting, submit battle
votes, configure battles, manage participants, or finish the whole event.
The remote client store does not expose a public bracket generation action;
bracket generation is Host-only and the Host server still rejects
`bracket.generate` from MC clients.

`markCurrentParticipantAbsent()` marks the Host-current qualification
participant absent by creating a `0` qualification score for every Judge
assigned to the active battle configuration. Existing partial scores for that
participant are overwritten to `0` during replay because
`qualification.scoreSubmitted` is unique by participant and judge. Normal Judge
score submission still validates `1..10`; only the MC/Host absent command can
create score `0`. The participant is considered complete for
`qualification.finish`, but the command does not auto-advance or reset the
timer.

`moveCurrentParticipantToEnd()` moves the Host-current qualification
participant to the end of the active present participant order, preserves the
participant ID and any existing scores, keeps the current index pointed at the
next participant that slides into that slot, and restarts the qualification
timer for that new current participant. The command is rejected for the last
participant.

Both absent and late commands carry `{ participantId }`. The Host command
handler resolves the authoritative current qualification participant and
rejects the command if the payload ID no longer matches. This prevents stale
remote MC screens from applying absent or late to the wrong participant.

### Battle Lifecycle

The Host controls battle voting in two explicit steps:

1. `startBattle(battleId)` changes a pending battle to `active`.
2. `openBattleVoting(battleId)` changes the active battle to `voting`.

Judge UI may call `submitBattleVote({ battleId, winnerId })` only while the
synced battle status is `voting`. An `active` battle is visible to Judges, but
voting remains locked until the Host opens it.

### Destructive Data Guards

Battle configuration deletion is allowed only while the configuration is still
draft and has no scores, battles, votes, or active qualification timer state.
Deleting the selected draft configuration must leave the app on another safe
configuration or with no active configuration; `activeBattleConfigurationId`
must never point at a deleted configuration.

Battle configuration selection rejects missing configurations and should not
switch away from or into a configuration while qualification or battles are in
progress. Screens should not rely on selection to mix scores or battles across
configurations.

Participant add, import, remove, and check-in changes are draft-only for the
target battle configuration. Once qualification starts for that configuration,
participant list and presence changes are rejected. Participant numbers and
case-insensitive names must be unique inside the configuration. Imports target
one configuration, trim names, reject empty names and invalid numbers, and
store each imported participant with the target `battleConfigurationId`.

Bracket generation is allowed only after qualification is finished, before a
bracket exists for the active configuration. `participantIds` must be unique,
must exist in the active configuration's qualification ranking, and must use a
valid MVP size. If the configuration has an explicit format such as `top8`,
`top16`, or `top32`, the selected participant count must match that format.

Qualification finish checks the active configuration only. It requires every
present active participant to have one score from every assigned active Judge,
so legacy or out-of-scope scores cannot satisfy missing required scores.

Event finish is rejected from draft, qualification, and
qualification-finished states. It is also rejected while any battle is active,
voting, pending, or missing a winner. A started configuration must have a final
battle result before the event can finish.

Legacy local records without `battleConfigurationId` are still treated as part
of the active configuration by compatibility helpers. This keeps old local
event logs readable, but it can make legacy unscoped scores, battles, or votes
block destructive operations. If legacy data causes confusing guards during MVP
testing, prefer an explicit local reset/migration path over silently ignoring
unscoped records.

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

- `hydrateDeviceId()`
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

`disconnect()` and `resetConnectionTarget()` must clear stale connection
identity and target fields: `host`, `port`, `serverAddress`, `role`, `name`,
`requestedJudgeId`, assigned Judge fields, `syncedState`, pending address, and
reconnect/error metadata. Stale client role state must not drive the next
session after an exit or reset.

`deviceId` is a stable, app-local remote client identity. It is generated once
with the existing `device_*` ID format and persisted in SQLite metadata. It must
not come from personally sensitive platform identifiers. Connect and reconnect
paths should load this persisted ID before sending `join`.

Remote permissions come from the Host `joined.assignedRole` response. Clients
may send the existing single `join.role` as `spectator`, but Judge and MC UI
must trust only the Host-assigned role received in `joined`; local `roles[]`
does not grant remote Judge or MC permissions. Local `roles[]` remains
Host/self-run presentation state. A successful `joined` message updates the
assigned role, assigned Judge ID/name, snapshot, and clears reconnect/command
errors.

Reconnect reuses the stable `deviceId`, last Host address, display name, and
requested Judge ID. While the Host app/server remains alive, the server matches
the stable `deviceId` to the existing connected-client record and preserves the
latest assigned role and Judge ID. If the Host app restarts or otherwise loses
its connected-client assignment table, the reconnecting client rejoins as
Spectator and should show a waiting-for-Host-assignment state instead of acting
as Judge or MC.

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

On Host join, the server identifies remote devices by stable `deviceId`. A new
socket for the same `deviceId` replaces the old socket and updates the existing
visible client row instead of creating a duplicate row. The server preserves the
current assigned role and assigned Judge ID for that `deviceId` while its
in-memory connected-client state is alive.

The MC server allowlist is authoritative. MC may send only:

- `qualification.timer.pause`
- `qualification.timer.resume`
- `qualification.timer.restart`
- `qualification.advanceParticipant`
- `qualification.finish`

MC must be rejected for `bracket.generate`, battle start/open voting, Judge
vote commands, event finish, participant/admin commands, and battle
configuration commands.

## Shared Battle Screens

Shared Bracket, Ranking, and Battle Result screens choose their state source
through `useBattleState()`:

- Host source uses `useDemoBattleStore` and may show Host-only controls.
- Remote source uses `useJudgingClientStore.syncedState` and is read-only.
- Remote empty/missing synced state should show a waiting/connection state, not
  Host participant import or add CTAs.

Host-only bracket controls include bracket generation, next-round generation,
start battle, open voting, mock votes, and manual result broadcast/recovery.
Remote Judge, MC, and Spectator users can view brackets, rankings, and results
from synced state only.

`BattleCard` is presentational. It receives participant/vote data from the
visible battle state and remains read-only unless the Host parent passes
explicit capability flags and callbacks such as start battle, open voting, or
mock vote submission. Remote parents pass no Host callbacks.

Battle display components should prefer `battle.participantIds` and render all
participants with per-participant vote counts. The legacy
`participantAId`/`participantBId` fields are display fallbacks for older 1v1
battle records, not the primary UI model.

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

## Web Preview

Expo Web is supported only as a development screen preview mode for visual UI
testing:

```bash
npm run web
```

On web, `AppBootstrap` still hydrates the local Host battle store, but it skips
Judging client device hydration, TCP Host server startup/shutdown, native
network address discovery, and stale TCP client cleanup. Native Android/iOS
bootstrap behavior is unchanged.

The web build uses platform-specific no-op Judging client/server stores. TCP
server, TCP client connection, Host address discovery, QR/local network join,
remote command sending, and state broadcast are intentionally disabled on web.
Host event creation and local Host screens can use the web in-memory event log
for preview data; this data is not SQLite-backed.

In web development mode, selecting Judge, MC, or Spectator from role selection
creates a local preview assignment without a network connection. Remote preview
screens render their waiting/empty states unless a real synced Host snapshot is
available in native builds.

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

- Host dashboard, participants, and qualification administration use
  `useDemoBattleStore`.
- Shared rankings, brackets, and results use `useBattleState()` so Host reads
  `useDemoBattleStore` and remote clients read synced state.
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
