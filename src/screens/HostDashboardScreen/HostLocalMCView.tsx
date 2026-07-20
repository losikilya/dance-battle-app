import { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Box, Button, QualificationTimerDisplay, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { getQualificationParticipants } from '@domain/sync/stateSelectors';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import {
  formatBattleParticipantNames,
  getBattleParticipantDisplayRows,
} from '@screens/shared/battleDisplay';

export const HostLocalMCView: React.FC = () => {
  const event = useDemoBattleStore(state => state.event);
  const participants = useDemoBattleStore(state => state.participants);
  const scores = useDemoBattleStore(state => state.scores);
  const battles = useDemoBattleStore(state => state.battles);
  const activeBattleId = useDemoBattleStore(state => state.activeBattleId);
  const currentIndex = useDemoBattleStore(
    state => state.currentQualificationParticipantIndex,
  );
  const qualificationTimer = useDemoBattleStore(
    state => state.qualificationTimer,
  );
  const pauseQualificationTimer = useDemoBattleStore(
    state => state.pauseQualificationTimer,
  );
  const resumeQualificationTimer = useDemoBattleStore(
    state => state.resumeQualificationTimer,
  );
  const restartQualificationTimer = useDemoBattleStore(
    state => state.restartQualificationTimer,
  );
  const advanceQualificationParticipant = useDemoBattleStore(
    state => state.advanceQualificationParticipant,
  );
  const markCurrentParticipantAbsent = useDemoBattleStore(
    state => state.markCurrentParticipantAbsent,
  );
  const moveCurrentParticipantToEnd = useDemoBattleStore(
    state => state.moveCurrentParticipantToEnd,
  );
  const finishQualification = useDemoBattleStore(
    state => state.finishQualification,
  );
  const canFinishQualification = useDemoBattleStore(
    state => state.canFinishQualification,
  );
  const getRanking = useDemoBattleStore(state => state.getRanking);
  const getChampionId = useDemoBattleStore(state => state.getChampionId);

  const qualificationParticipants = useMemo(
    () =>
      getQualificationParticipants({
        event,
        participants,
      }),
    [event, participants],
  );
  const currentParticipant = qualificationParticipants[currentIndex] ?? null;
  const nextParticipant = qualificationParticipants[currentIndex + 1] ?? null;
  const activeBattle =
    battles.find(battle => battle.id === activeBattleId) ?? null;
  const activeBattleParticipantRows = activeBattle
    ? getBattleParticipantDisplayRows({
        battle: activeBattle,
        participants,
        votes: [],
      })
    : [];
  const ranking = scores.length > 0 ? getRanking().slice(0, 8) : [];
  const championId = getChampionId();
  const champion = participants.find(item => item.id === championId);
  const isFinishQualificationAvailable = canFinishQualification();
  const isQualificationActive =
    event.status === 'qualification' && currentParticipant !== null;
  const isLastParticipant =
    currentIndex >= qualificationParticipants.length - 1;
  const timerToggleIcon =
    qualificationTimer.status === 'running' ? 'pause' : 'play';
  const canToggleTimer =
    qualificationTimer.status === 'running' ||
    qualificationTimer.status === 'paused';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={4} mb={24}>
        <Text variant="body2" color="primary">LOCAL MC VIEW</Text>
        <Text variant="h1">{event.title}</Text>
        <Text variant="body2" color="textSecondary">
          {event.battleConfiguration?.categoryTitle ?? '—'} · {event.status.toUpperCase()}
        </Text>
      </Box>

      {champion && (
        <Box style={styles.highlightCard} p={20} gap={4} mb={20}>
          <Text variant="body2" color="textSecondary">CHAMPION</Text>
          <Text variant="h1">{champion.name}</Text>
        </Box>
      )}

      {activeBattle && (
        <Box style={styles.highlightCard} p={20} gap={8} mb={20}>
          <Text variant="body2" color="primary">CURRENT BATTLE</Text>
          <Text variant="h2">
            {formatBattleParticipantNames(activeBattleParticipantRows)}
          </Text>
          <Text variant="body2" color="textSecondary">
            {activeBattle.round.toUpperCase()} · {activeBattle.status.toUpperCase()}
          </Text>
        </Box>
      )}

      {event.status === 'qualification' && currentParticipant && (
        <Box style={styles.highlightCard} p={20} gap={8} mb={20}>
          <Text variant="body2" color="primary">NOW DANCING</Text>
          <Text variant="h1">
            #{String(currentParticipant.number).padStart(2, '0')}{' '}
            {currentParticipant.name} / {currentParticipant.city} / {currentParticipant.crew}
          </Text>
          {nextParticipant && (
            <Text variant="body2" color="textSecondary">
              NEXT: #{String(nextParticipant.number).padStart(2, '0')}{' '}
              {nextParticipant.name}
            </Text>
          )}
        </Box>
      )}

      {event.status === 'qualification' && (
        <Box style={styles.card} p={20} gap={12} mb={20}>
          <QualificationTimerDisplay
            timer={qualificationTimer}
            durationSeconds={event.battleConfiguration?.qualificationDurationSeconds ?? 60}
          />
          <Box direction="row" justify="space-between" align="center" gap={12}>
            <MCIconButton
              icon="bed"
              accessibilityLabel={getResource("mc_action_late")}
              disabled={!isQualificationActive || isLastParticipant}
              onPress={moveCurrentParticipantToEnd}
              variant="secondary"
            />
            <MCIconButton
              icon="trash-outline"
              accessibilityLabel={getResource("mc_action_absent")}
              disabled={!isQualificationActive}
              onPress={markCurrentParticipantAbsent}
              variant="secondary"
            />
          </Box>
          <Box direction="row" justify="center" align="center" gap={24}>
            <MCIconButton
              icon="reload-outline"
              accessibilityLabel={getResource("mc_action_restart")}
              disabled={!isQualificationActive}
              onPress={restartQualificationTimer}
            />
            <MCIconButton
              icon={timerToggleIcon}
              accessibilityLabel={
                qualificationTimer.status === "paused"
                  ? getResource("mc_action_resume")
                  : getResource("mc_action_pause")
              }
              disabled={!canToggleTimer}
              onPress={
                qualificationTimer.status === "paused"
                  ? resumeQualificationTimer
                  : pauseQualificationTimer
              }
            />
            <MCIconButton
              icon="play-forward-outline"
              accessibilityLabel={getResource("mc_action_next")}
              disabled={!isQualificationActive || isLastParticipant}
              onPress={advanceQualificationParticipant}
            />
          </Box>
          {isFinishQualificationAvailable && (
            <Button
              variant="contained"
              color="primary"
              onPress={() => {
                void finishQualification();
              }}
            >
              {getResource('host_qualification_finish')}
            </Button>
          )}
        </Box>
      )}

      <Box style={styles.card} p={20} gap={10}>
        <Text variant="bodyBold">TOP 8 RANKING</Text>
        {ranking.length === 0 ? (
          <Text variant="body2" color="textSecondary">
            Ranking will appear after scores are submitted.
          </Text>
        ) : (
          ranking.map(item => (
            <Box
              key={item.participantId}
              direction="row"
              justify="space-between"
            >
              <Text variant="body">
                #{item.rank}{' '}
                {participants.find(p => p.id === item.participantId)?.name ??
                  'Unknown'}
              </Text>
              <Text variant="bodyBold">{item.averageScore.toFixed(1)}</Text>
            </Box>
          ))
        )}
      </Box>
    </ScrollView>
  );
};

type MCIconName = React.ComponentProps<typeof Ionicons>['name'];

function MCIconButton({
  icon,
  accessibilityLabel,
  disabled,
  onPress,
  variant = 'primary',
}: {
  icon: MCIconName;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconButton, disabled && styles.iconButtonDisabled, styles[variant]]}
    >
      <Ionicons
        name={icon}
        size={variant === "primary" ? 28 : 20}
        color={disabled ? Colors.text.secondary : Colors.primary.main}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: FOOTER_HEIGHT + 24,
  },
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  iconButton: {
    width: 68,
    height: 68,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: {
    borderColor: Colors.border.subtle,
    opacity: 0.45,
  },
  highlightCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  primary: {},
  secondary: {
    width: 52,
    height: 52,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});
