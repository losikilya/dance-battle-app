import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert } from 'react-native';
import { useBattleState } from '@stores/battle/useBattleState';
import { BracketScreen } from '@screens/BracketScreen';
import { RankingsScreen } from '@screens/RankingsScreen';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';

function BracketsEmptyState(): React.JSX.Element {
  const router = useRouter();
  return (
    <Box
      style={styles.emptyScroll}
      pt={HEADER_HEIGHT + 24}
      pb={FOOTER_HEIGHT + 24}
      px={24}
      gap={24}
    >
      <Box align="center" gap={12}>
        <Ionicons
          name="people-outline"
          size={80}
          color={Colors.text.secondary}
        />
        <Text variant="bodyBold" centered>
          {getResource('brackets_empty_title')}
        </Text>
        <Text variant="body2" color="textSecondary" centered>
          {getResource('brackets_empty_body')}
        </Text>
      </Box>

      <Box gap={12}>
        <Button onPress={() => { router.push('/participants'); }}>
          {getResource('brackets_empty_add')}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onPress={() => { Alert.alert('Coming soon'); }}
        >
          {getResource('brackets_empty_import')}
        </Button>
      </Box>

      <Box style={styles.featureCard} p={16} gap={6}>
        <Text variant="bodyBold">
          {getResource('brackets_empty_auto_seeding_title')}
        </Text>
        <Text variant="body2" color="textSecondary">
          {getResource('brackets_empty_auto_seeding_body')}
        </Text>
      </Box>

      <Box style={styles.featureCard} p={16} gap={6}>
        <Text variant="bodyBold">
          {getResource('brackets_empty_checkin_title')}
        </Text>
        <Text variant="body2" color="textSecondary">
          {getResource('brackets_empty_checkin_body')}
        </Text>
      </Box>
    </Box>
  );
}

function RemoteBracketsWaitingState(): React.JSX.Element {
  return (
    <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24} gap={8}>
      <Text variant="bodyBold" centered>
        {getResource('connection_waiting_assignment_title')}
      </Text>
      <Text variant="body2" color="textSecondary" centered>
        {getResource('bracket_placeholder')}
      </Text>
    </Box>
  );
}

export default function BracketsTab(): React.JSX.Element {
  const { state, isHost } = useBattleState();
  const eventStatus = state?.event.status ?? 'draft';
  const participants = state?.participants ?? [];

  if (participants.length === 0) {
    if (!isHost) {
      return <RemoteBracketsWaitingState />;
    }

    return <BracketsEmptyState />;
  }

  if (eventStatus === 'qualification_finished') {
    return <RankingsScreen />;
  }

  if (eventStatus === 'battle' || eventStatus === 'finished') {
    return <BracketScreen />;
  }

  return (
    <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24}>
      <Text variant="body2" color="textSecondary" centered>{getResource('bracket_placeholder')}</Text>
    </Box>
  );
}

const styles = StyleSheet.create({
  emptyScroll: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  featureCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
