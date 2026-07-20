import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Colors from '@constants/Colors';
import { Text } from '../Text';
import type { QualificationTimerState } from '@domain/qualification/types';

type Props = {
  durationSeconds: number;
  timer: QualificationTimerState;
};

function getRemainingMs(timer: QualificationTimerState): number {
  if (timer.status === 'paused') {
    return timer.remainingMsWhenPaused ?? 0;
  }

  if (timer.status !== 'running' || timer.endsAt === null) {
    return 0;
  }

  return Math.max(0, Date.parse(timer.endsAt) - Date.now());
}

function formatTime(totalMs: number): string {
  const totalSeconds = Math.ceil(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const QualificationTimerDisplay: React.FC<Props> = ({
  durationSeconds,
  timer,
}) => {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(timer));

  useEffect(() => {
    setRemainingMs(getRemainingMs(timer));

    if (timer.status !== 'running') {
      return;
    }

    const interval = setInterval(() => {
      setRemainingMs(getRemainingMs(timer));
    }, 250);

    return () => clearInterval(interval);
  }, [timer]);

  const isWarning = timer.status === 'expired' || remainingMs <= 10000;
  const statusLabel = useMemo(() => {
    if (timer.status === 'running') return 'RUNNING';
    if (timer.status === 'paused') return 'PAUSED';
    if (timer.status === 'expired') return 'EXPIRED';
    return 'READY';
  }, [timer.status]);

  return (
    <View style={[styles.root, isWarning && styles.warningRoot]}>
      <Text variant="body2" color="textSecondary">
        QUALIFICATION TIMER
      </Text>
      <Text variant="h1" style={isWarning ? styles.warningText : undefined}>
        {formatTime(remainingMs)}
      </Text>
      <Text
        variant="body2"
        style={isWarning ? styles.warningText : styles.statusText}
      >
        {statusLabel} / {durationSeconds}s
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 16,
    gap: 4,
    alignItems: 'center',
  },
  warningRoot: {
    borderColor: Colors.status.warning,
    backgroundColor: Colors.warning.background,
  },
  statusText: {
    color: Colors.primary.main,
  },
  warningText: {
    color: Colors.status.warning,
  },
});
