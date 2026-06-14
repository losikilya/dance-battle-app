import { MaterialCommunityIcons } from '@expo/vector-icons';

export type AppRole = 'host' | 'judge' | 'mc' | 'spectator';

export type RoleConfig = {
  role: AppRole;
  title: string;
  description: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
};

export const ROLE_CONFIG: RoleConfig[] = [
  {
    role: 'host',
    title: 'HOST ADMIN',
    description: 'Control the event, manage brackets, and oversee all battle logistics.',
    iconName: 'tune',
  },
  {
    role: 'judge',
    title: 'JUDGE',
    description: 'Access the scoring dashboard and submit real-time battle decisions.',
    iconName: 'content-cut',
  },
  {
    role: 'mc',
    title: 'MC / PRESENTER',
    description: 'Live battle updates, participant bios, and bracket announcements.',
    iconName: 'microphone',
  },
  {
    role: 'spectator',
    title: 'SPECTATOR',
    description: 'Follow the bracket, view scores, and engage with the live stream.',
    iconName: 'eye-outline',
  },
];
