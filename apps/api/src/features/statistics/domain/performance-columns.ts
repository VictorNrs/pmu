import type { PerformanceColumn } from '@pmu/shared';

interface TerrainOption {
  id: number;
  label: string;
  isActive: boolean;
}

/**
 * Terrain columns: the selected terrains, or every active terrain when none is selected.
 * A terrain holding data is always kept (even if deactivated) so that the columns
 * add up to the row total.
 */
export function selectTerrainColumns(
  terrains: readonly TerrainOption[],
  selectedIds: readonly number[] | undefined,
  keysWithData: ReadonlySet<number>,
): PerformanceColumn[] {
  const isSelected = (terrain: TerrainOption) =>
    selectedIds?.length ? selectedIds.includes(terrain.id) : terrain.isActive;
  return terrains
    .filter((terrain) => isSelected(terrain) || keysWithData.has(terrain.id))
    .map((terrain) => ({ key: terrain.id, label: terrain.label }));
}

/** Distance columns: every exact distance holding data, plus the explicitly selected ones. */
export function selectDistanceColumns(
  selectedDistances: readonly number[] | undefined,
  keysWithData: ReadonlySet<number>,
): PerformanceColumn[] {
  const distances = new Set([...(selectedDistances ?? []), ...keysWithData]);
  return [...distances]
    .sort((left, right) => left - right)
    .map((distance) => ({ key: distance, label: formatDistance(distance) }));
}

export function formatDistance(distanceMeters: number): string {
  return `${distanceMeters} m`;
}
