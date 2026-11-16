import { raceInputSchema } from '@pmu/shared';
import { describe, expect, it } from 'vitest';
import { isoDateToTimestamp } from '@/utils/date';
import {
  createParticipationDraft,
  createRaceFormState,
  nextFinishPosition,
  toRaceInput,
} from './race-form-state';

describe('race form state', () => {
  it('produces a payload accepted by the shared schema', () => {
    const state = createRaceFormState(null, isoDateToTimestamp('2026-05-04'));
    state.racecourseName = ' Longchamp ';
    state.distanceMeters = 1600;
    state.terrainConditionId = 2;
    state.participations = [
      { ...createParticipationDraft(1), horseId: 10 },
      createParticipationDraft(null),
    ];
    const parsed = raceInputSchema.parse(toRaceInput(state));
    expect(parsed).toEqual({
      raceDate: '2026-05-04',
      racecourseName: 'Longchamp',
      distanceMeters: 1600,
      terrainConditionId: 2,
      participations: [{ horseId: 10, finishPosition: 1 }],
    });
  });

  it('rejects missing terrain and incomplete rows', () => {
    const state = createRaceFormState(null, isoDateToTimestamp('2026-05-04'));
    state.racecourseName = 'Longchamp';
    state.distanceMeters = 1600;
    state.participations = [createParticipationDraft(1)];
    const result = raceInputSchema.safeParse(toRaceInput(state));
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path.join('.'));
    expect(fields).toEqual(
      expect.arrayContaining(['terrainConditionId', 'participations.0.horseId']),
    );
  });

  it('suggests the next finish position', () => {
    expect(nextFinishPosition([])).toBe(1);
    expect(nextFinishPosition([createParticipationDraft(1), createParticipationDraft(4)])).toBe(5);
  });
});
