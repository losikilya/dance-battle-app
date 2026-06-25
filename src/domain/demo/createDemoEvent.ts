import { DanceEvent } from '../event/types';
import { Participant } from '../participant/types';
import { Judge } from '../judge/types';
import { createId } from '../../shared/lib/createId';

export function createDemoEvent(): DanceEvent {
  return {
    id: createId('event'),
    title: 'Urban Clash 2026',
    categoryTitle: 'Hip-Hop 1x1',
    status: 'draft',
    format: 'top8',
    judgesCount: 1,
    createdAt: new Date().toISOString(),
  };
}

export function createDemoParticipants(): Participant[] {
  return [
    { id: 'participant_1', number: 1, name: 'Max Flow', crew: 'Street Unit', city: 'Warsaw', checkIn: 'absent', status: 'registered' },
    { id: 'participant_2', number: 2, name: 'Lina Wave', crew: 'Wave Lab', city: 'Krakow', checkIn: 'absent', status: 'registered' },
    { id: 'participant_3', number: 3, name: 'D-Knight', crew: 'Night Crew', city: 'Gdansk', checkIn: 'absent', status: 'registered' },
    { id: 'participant_4', number: 4, name: 'Mira Step', crew: 'Step House', city: 'Poznan', checkIn: 'absent', status: 'registered' },
    { id: 'participant_5', number: 5, name: 'Alex Pop', crew: 'Pop District', city: 'Wroclaw', checkIn: 'absent', status: 'registered' },
    { id: 'participant_6', number: 6, name: 'Noa Flex', crew: 'Flex Zone', city: 'Lodz', checkIn: 'absent', status: 'registered' },
    { id: 'participant_7', number: 7, name: 'Vito Spin', crew: 'Spin Masters', city: 'Katowice', checkIn: 'absent', status: 'registered' },
    { id: 'participant_8', number: 8, name: 'Zara Beat', crew: 'Beat Club', city: 'Warsaw', checkIn: 'absent', status: 'registered' },
    { id: 'participant_9', number: 9, name: 'Kai Groove', crew: 'Groove Point', city: 'Lublin', checkIn: 'absent', status: 'registered' },
    { id: 'participant_10', number: 10, name: 'Tina Lock', crew: 'Lockers', city: 'Sopot', checkIn: 'absent', status: 'registered' },
  ];
}

export function createDemoJudges(): Judge[] {
  return [
    { id: 'judge_1', name: 'Judge Alex', role: 'head' },
  ];
}
