type GetJudgeDisplayNameParams = {
  judgeId: string;
  judgeName: string;
  isHost: boolean;
  selfJudgeId: string | null;
};

export function getJudgeDisplayName({
  judgeId,
  judgeName,
  isHost,
  selfJudgeId,
}: GetJudgeDisplayNameParams): string {
  return isHost && judgeId === selfJudgeId ? 'Host' : judgeName;
}
