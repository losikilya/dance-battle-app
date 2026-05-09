export type EventStatus =
  | 'draft'
  | 'qualification'
  | 'qualification_finished'
  | 'battle'
  | 'finished';
  
export type BattleFormat = 'top8' | 'top16' | 'top32';

export type DanceEvent = {
  id: string;
  title: string;
  categoryTitle: string;
  status: EventStatus;
  format: BattleFormat;
  judgesCount: number;
  createdAt: string;
};