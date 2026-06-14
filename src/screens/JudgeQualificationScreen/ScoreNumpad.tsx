import { StyleSheet, TouchableOpacity } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';

type ScoreNumpadProps = {
  selected: number | null;
  onSelect: (score: number) => void;
  locked?: boolean;
};

export const ScoreNumpad: React.FC<ScoreNumpadProps> = ({ selected, onSelect, locked }) => (
  <Box direction="row" style={styles.grid}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
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
  </Box>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    width: 80,
    height: 80,
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
