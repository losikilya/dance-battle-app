import type { AppRole } from '@domain/role/types';

type GetJudgeDisplayNameParams = {
  judgeId: string;
  judgeName: string;
  role: AppRole | null;
  selfJudgeId: string | null;
};

export function getJudgeDisplayName({
  judgeId,
  judgeName,
  role,
  selfJudgeId,
}: GetJudgeDisplayNameParams): string {
  return role === 'host' && judgeId === selfJudgeId ? 'Host' : judgeName;
}
