export type ParticipantStatus =
  | 'registered'
  | 'qualified'
  | 'eliminated'
  | 'winner';

export type Participant = {
  id: string;
  number: number;
  name: string;
  crew?: string;
  city?: string;
  status: ParticipantStatus;
};