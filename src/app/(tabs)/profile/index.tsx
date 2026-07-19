import { useRouter } from 'expo-router';
import { Box, Button } from '@components';
import { HEADER_HEIGHT } from '@constants/Dimensions';

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <Box pt={48 + HEADER_HEIGHT} px={24} gap={24}>
      <Button onPress={() => router.push('/profile/judge')}>
        Open Judging Admin
      </Button>
    </Box>
  );
}
