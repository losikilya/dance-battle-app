export type JudgeRole = 'head' | 'standard';

export type Judge = {
  id: string;
  name: string;
  role: JudgeRole;
};