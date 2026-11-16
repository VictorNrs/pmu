import type { PerformanceColumn } from '@pmu/shared';

/** An entry of a reference list (terrain condition or distance), in display order. */
export interface ColumnOption {
  key: number;
  label: string;
  isActive: boolean;
}

/**
 * Columns of a comparison table: the selected entries, or every active entry when none
 * is selected. An entry holding data is always kept (even if deactivated) so that the
 * columns add up to the row total.
 */
export function selectColumns(
  options: readonly ColumnOption[],
  selectedKeys: readonly number[] | undefined,
  keysWithData: ReadonlySet<number>,
): PerformanceColumn[] {
  const isSelected = (option: ColumnOption) =>
    selectedKeys?.length ? selectedKeys.includes(option.key) : option.isActive;
  return options
    .filter((option) => isSelected(option) || keysWithData.has(option.key))
    .map((option) => ({ key: option.key, label: option.label }));
}

export function formatDistance(distanceMeters: number): string {
  return `${distanceMeters} m`;
}
