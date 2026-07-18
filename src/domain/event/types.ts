import type { QualificationAdvanceMode } from '../qualification/types';

export type EventStatus =
  | 'draft'
  | 'qualification'
  | 'qualification_finished'
  | 'battle'
  | 'finished';
  
export type BattleFormat = 'top8' | 'top16' | 'top32';

export type BattleConfiguration = {
  id: string;
  categoryTitle: string;
  status: EventStatus;
  format: BattleFormat | null;
  assignedJudgeIds: string[];
  qualificationDurationSeconds: number;
  qualificationAdvanceMode: QualificationAdvanceMode;
};

export type DanceEvent = {
  id: string;
  title: string;
  status: EventStatus;
  battleConfiguration: BattleConfiguration | null;
  battleConfigurations: BattleConfiguration[];
  activeBattleConfigurationId: string | null;
  createdAt: string;
};
