export type ParticipantStatus =
  | 'registered'
  | 'qualified'
  | 'eliminated'
  | 'winner';

export type CheckInStatus = 'present' | 'absent';

export type Participant = {
  id: string;
  battleConfigurationId?: string;
  number: number;
  name: string;
  crew?: string;
  city?: string;
  photoUri?: string;
  checkIn: CheckInStatus;
  status: ParticipantStatus;
};
