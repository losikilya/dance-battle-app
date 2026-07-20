import { StyleSheet, TouchableOpacity } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';

type ScoreNumpadProps = {
  selected: number | null;
  onSelect: (score: number) => void;
  locked?: boolean;
};

const SCORE_ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10],
] as const;

export const ScoreNumpad: React.FC<ScoreNumpadProps> = ({ selected, onSelect, locked }) => (
  <Box gap={8} fullWidth>
    {SCORE_ROWS.map((row) => (
      <Box key={row.join('-')} direction="row" gap={8} fullWidth>
        {row.length === 1 && <Box flex={1} />}
        {row.map(score => {
          const isSelected = selected === score;
          return (
            <TouchableOpacity
              key={score}
              onPress={() => !locked && onSelect(score)}
              style={[styles.button, isSelected ? styles.selected : styles.default]}
              disabled={locked}
            >
              <Text variant="h2" color={isSelected ? 'dark' : locked ? 'textSecondary' : 'textPrimary'}>
                {score}
              </Text>
            </TouchableOpacity>
          );
        })}
        {row.length === 1 && <Box flex={1} />}
      </Box>
    ))}
  </Box>
);

const styles = StyleSheet.create({
  button: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    backgroundColor: Colors.dark.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  selected: {
    backgroundColor: Colors.primary.main,
  },
});
