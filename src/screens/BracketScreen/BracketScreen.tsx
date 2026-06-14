import { ScrollView, StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { BattleRound } from '@domain/battle/types';
import { BattleCard } from './BattleCard';
import { PowerRankingsWidget } from './PowerRankingsWidget';
import { BattleFeedWidget } from './BattleFeedWidget';

const ROUND_ORDER: BattleRound[] = ['top8', 'semifinal', 'final'];

const ROUND_LABELS: Record<BattleRound, string> = {
  top8: getResource('bracket_round_top8'),
  semifinal: getResource('bracket_round_semifinal'),
  final: getResource('bracket_round_final'),
};

export const BracketScreen: React.FC = () => {
  const battles = useDemoBattleStore(s => s.battles);
  const participants = useDemoBattleStore(s => s.participants);

  const activeBattleParticipants = battles.filter(b => b.status === 'active').length * 2;

  const activeRound = battles.find(b => b.round === 'final' && b.status === 'active')
    ? ROUND_LABELS.final
    : battles.find(b => b.round === 'semifinal' && b.status === 'active')
      ? ROUND_LABELS.semifinal
      : ROUND_LABELS.top8;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={4} mb={24}>
        <Text variant="h1">{getResource('bracket_title')}</Text>
        <Box direction="row" align="center" gap={12}>
          <Box style={styles.roundChip} px={12} py={4}>
            <Text variant="body2" color="primary">{activeRound}</Text>
          </Box>
          <Text variant="body2" color="textSecondary">
            {getResource('bracket_participants_prefix')} {String(activeBattleParticipants).padStart(2, '0')} / {String(participants.length).padStart(2, '0')}
          </Text>
        </Box>
      </Box>

      {ROUND_ORDER.map(round => {
        const roundBattles = battles.filter(b => b.round === round);
        if (roundBattles.length === 0) return null;
        return (
          <Box key={round} mb={24} gap={12}>
            <Text variant="body2" color="textSecondary" centered>{ROUND_LABELS[round]}</Text>
            {roundBattles.map(battle => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </Box>
        );
      })}

      {battles.length === 0 && (
        <Box style={styles.placeholder} p={24} align="center">
          <Text variant="body2" color="textSecondary" centered>{getResource('bracket_placeholder')}</Text>
        </Box>
      )}

      <Box gap={16} mt={8}>
        <PowerRankingsWidget />
        <BattleFeedWidget />
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
    paddingTop: HEADER_HEIGHT + 24,
    paddingBottom: FOOTER_HEIGHT + 24,
    paddingHorizontal: 24,
  },
  roundChip: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  placeholder: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
