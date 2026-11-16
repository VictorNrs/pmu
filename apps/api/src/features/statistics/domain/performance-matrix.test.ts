import { buildPerformanceMatrix, type GroupCounts } from './performance-matrix';

const stallions = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Bravo' },
];
const columns = [
  { key: 10, label: 'Bon' },
  { key: 20, label: 'Lourd' },
];

function group(
  stallionId: number,
  columnKey: number,
  [raceCount, winCount, placeCount, finishPositionSum]: [number, number, number, number],
): GroupCounts {
  return { stallionId, columnKey, raceCount, winCount, placeCount, finishPositionSum };
}

describe('buildPerformanceMatrix', () => {
  const matrix = buildPerformanceMatrix('terrain', stallions, columns, [
    group(1, 10, [2, 1, 1, 3]),
    group(1, 20, [3, 0, 1, 15]),
  ]);

  it('keeps every stallion, including those without race', () => {
    expect(matrix.rows.map((row) => row.stallionName)).toEqual(['Alpha', 'Bravo']);
    expect(matrix.rows[1]?.total).toMatchObject({ raceCount: 0, winRate: null });
  });

  it('fills missing cells with zero races and null indicators', () => {
    expect(matrix.rows[1]?.cells[20]).toEqual({
      raceCount: 0,
      winCount: 0,
      placeCount: 0,
      winRate: null,
      placeRate: null,
      averageFinishPosition: null,
    });
  });

  it('computes each cell independently', () => {
    expect(matrix.rows[0]?.cells[10]).toMatchObject({
      raceCount: 2,
      winRate: 0.5,
      averageFinishPosition: 1.5,
    });
    expect(matrix.rows[0]?.cells[20]).toMatchObject({
      raceCount: 3,
      winRate: 0,
      averageFinishPosition: 5,
    });
  });

  it('computes the total from summed counters, not by averaging cell averages', () => {
    expect(matrix.rows[0]?.total).toMatchObject({
      raceCount: 5,
      winCount: 1,
      placeCount: 2,
      winRate: 0.2,
      placeRate: 0.4,
      averageFinishPosition: 18 / 5,
    });
  });

  it('computes the reference average from the summed counters of every stallion', () => {
    const withBravo = buildPerformanceMatrix('terrain', stallions, columns, [
      group(1, 10, [2, 1, 1, 3]),
      group(2, 10, [3, 0, 1, 15]),
    ]);
    // Bon: 5 races, 1 win, 2 places, positions sum 18
    expect(withBravo.average.cells[10]).toEqual({
      raceCount: 5,
      winCount: 1,
      placeCount: 2,
      winRate: 0.2,
      placeRate: 0.4,
      averageFinishPosition: 3.6,
    });
    expect(withBravo.average.cells[20]).toMatchObject({ raceCount: 0, winRate: null });
    expect(withBravo.average.total).toMatchObject({ raceCount: 5, winRate: 0.2 });
  });

  it('rejects duplicated aggregates for the same cell', () => {
    const duplicated = [group(1, 10, [1, 1, 0, 1]), group(1, 10, [1, 1, 0, 1])];
    expect(() => buildPerformanceMatrix('terrain', stallions, columns, duplicated)).toThrow(
      'Duplicate aggregate',
    );
  });

  it('rejects aggregates outside the displayed columns, which would break the totals', () => {
    expect(() =>
      buildPerformanceMatrix('terrain', stallions, columns, [group(1, 99, [1, 1, 0, 1])]),
    ).toThrow('Unknown column');
  });
});
