import { ScrollView, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Box, Button, IconButton, QualificationTimerDisplay, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';

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
  const getRanking = useDemoBattleStore(state => state.getRanking);
  const getChampionId = useDemoBattleStore(state => state.getChampionId);

  const currentParticipant = participants[currentIndex] ?? null;
  const nextParticipant = participants[currentIndex + 1] ?? null;
  const activeBattle =
    battles.find(battle => battle.id === activeBattleId) ?? null;
  const ranking = scores.length > 0 ? getRanking().slice(0, 8) : [];
  const championId = getChampionId();
  const champion = participants.find(item => item.id === championId);
  const isManualMode = event.qualificationAdvanceMode === 'manual';
  const isQualificationActive =
    event.status === 'qualification' && currentParticipant !== null;
  const isLastParticipant = currentIndex >= participants.length - 1;
  const canMoveLate = isQualificationActive && !isLastParticipant;
  const canPauseResume =
    qualificationTimer.status === 'running' ||
    qualificationTimer.status === 'paused';
  const canRestart = isQualificationActive;
  const canAdvance =
    isQualificationActive && isManualMode && !isLastParticipant;
  const isTimerPaused = qualificationTimer.status === 'paused';

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
          {event.categoryTitle} · {event.status.toUpperCase()}
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
            {participants.find(item => item.id === activeBattle.participantAId)
              ?.name ?? 'Unknown'}
            {' VS '}
            {participants.find(item => item.id === activeBattle.participantBId)
              ?.name ?? 'Unknown'}
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
            {currentParticipant.name}
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
            durationSeconds={event.qualificationDurationSeconds}
          />
          <Box direction="row" gap={8}>
            <Box flex={1}>
              <Button
                variant="outlined"
                color="secondary"
                onPress={() => {
                  void markCurrentParticipantAbsent();
                }}
                disabled={!isQualificationActive}
              >
                {getResource('mc_participant_absent')}
              </Button>
            </Box>
            <Box flex={1}>
              <Button
                variant="outlined"
                color="secondary"
                onPress={() => {
                  void moveCurrentParticipantToEnd();
                }}
                disabled={!canMoveLate}
              >
                {getResource('mc_participant_late')}
              </Button>
            </Box>
          </Box>
          <Box direction="row" justify="center" align="center" gap={24}>
            <IconButton
              variant="contained"
              style={[styles.smallTransportButton, !canRestart && styles.disabledControl]}
              onPress={() => {
                if (canRestart) {
                  void restartQualificationTimer();
                }
              }}
            >
              <Ionicons
                name="refresh"
                size={22}
                color={canRestart ? Colors.text.primary : Colors.text.secondary}
              />
            </IconButton>
            <IconButton
              variant="contained"
              style={[styles.primaryTransportButton, !canPauseResume && styles.disabledControl]}
              onPress={() => {
                if (canPauseResume) {
                  void (
                    isTimerPaused
                      ? resumeQualificationTimer()
                      : pauseQualificationTimer()
                  );
                }
              }}
            >
              <Ionicons
                name={isTimerPaused ? 'play' : 'pause'}
                size={30}
                color={Colors.dark.background}
              />
            </IconButton>
            {isManualMode && (
              <IconButton
                variant="contained"
                style={[styles.smallTransportButton, !canAdvance && styles.disabledControl]}
                onPress={() => {
                  if (canAdvance) {
                    void advanceQualificationParticipant();
                  }
                }}
              >
                <Ionicons
                  name="play-skip-forward"
                  size={22}
                  color={canAdvance ? Colors.text.primary : Colors.text.secondary}
                />
              </IconButton>
            )}
          </Box>
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
  highlightCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  smallTransportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
  primaryTransportButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: 'transparent',
    backgroundColor: Colors.primary.main,
  },
  disabledControl: {
    opacity: 0.45,
  },
});
