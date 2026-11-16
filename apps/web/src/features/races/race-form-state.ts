import type { RaceDetail, RaceInput } from '@pmu/shared';
import { isoDateToTimestamp, timestampToIsoDate } from '@/utils/date';

export interface ParticipationDraft {
  /** Stable key for the list rendering only. */
  uid: number;
  horseId: number | null;
  finishPosition: number | null;
}

export interface RaceFormState {
  raceDate: number | null;
  racecourseName: string;
  distanceMeters: number | null;
  terrainConditionId: number | null;
  participations: ParticipationDraft[];
}

let nextUid = 1;

export function createParticipationDraft(position: number | null = null): ParticipationDraft {
  return { uid: nextUid++, horseId: null, finishPosition: position };
}

export function createRaceFormState(race: RaceDetail | null, defaultDate: number): RaceFormState {
  if (!race) {
    return {
      raceDate: defaultDate,
      racecourseName: '',
      distanceMeters: null,
      terrainConditionId: null,
      participations: [createParticipationDraft(1)],
    };
  }
  return {
    raceDate: isoDateToTimestamp(race.raceDate),
    racecourseName: race.racecourseName,
    distanceMeters: race.distanceMeters,
    terrainConditionId: race.terrainConditionId,
    participations: race.participations.map((entry) => ({
      uid: nextUid++,
      horseId: entry.horseId,
      finishPosition: entry.finishPosition,
    })),
  };
}

/** Builds the payload validated by the shared schema; empty rows are ignored. */
export function toRaceInput(state: RaceFormState): RaceInput {
  return {
    raceDate: state.raceDate === null ? '' : timestampToIsoDate(state.raceDate),
    racecourseName: state.racecourseName,
    distanceMeters: state.distanceMeters ?? Number.NaN,
    terrainConditionId: state.terrainConditionId ?? Number.NaN,
    participations: state.participations
      .filter((entry) => entry.horseId !== null || entry.finishPosition !== null)
      .map((entry) => ({
        horseId: entry.horseId ?? Number.NaN,
        finishPosition: entry.finishPosition ?? Number.NaN,
      })),
  };
}

/** Suggests the next free finish position when a row is added. */
export function nextFinishPosition(participations: readonly ParticipationDraft[]): number {
  const positions = participations
    .map((entry) => entry.finishPosition)
    .filter((position): position is number => position !== null);
  return positions.length === 0 ? 1 : Math.max(...positions) + 1;
}
