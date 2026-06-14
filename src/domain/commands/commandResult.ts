import { AppEvent } from '../sync/appEvent';

export type CommandErrorCode =
  | 'invalid_status'
  | 'not_found'
  | 'invalid_score'
  | 'invalid_winner'
  | 'not_enough_data'
  | 'already_finished'
  | 'action_not_allowed'
  | 'invalid_number';

export type CommandError = {
  code: CommandErrorCode;
  message: string;
};

export type CommandHandlerResult = {
  events: AppEvent[];
  error?: CommandError;
};

export function commandSuccess(events: AppEvent[]): CommandHandlerResult {
  return {
    events,
  };
}

export function commandFailure(
  code: CommandErrorCode,
  message: string,
): CommandHandlerResult {
  return {
    events: [],
    error: {
      code,
      message,
    },
  };
}