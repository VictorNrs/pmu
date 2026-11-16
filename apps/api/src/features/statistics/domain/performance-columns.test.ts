import { selectDistanceColumns, selectTerrainColumns } from './performance-columns';

const terrains = [
  { id: 1, label: 'Bon', isActive: true },
  { id: 2, label: 'Souple', isActive: true },
  { id: 3, label: 'Collant', isActive: false },
];

describe('selectTerrainColumns', () => {
  it('shows every active terrain by default, in the given order', () => {
    expect(selectTerrainColumns(terrains, undefined, new Set())).toEqual([
      { key: 1, label: 'Bon' },
      { key: 2, label: 'Souple' },
    ]);
  });

  it('keeps an inactive terrain that still holds data', () => {
    const keys = selectTerrainColumns(terrains, undefined, new Set([3])).map(
      (column) => column.key,
    );
    expect(keys).toEqual([1, 2, 3]);
  });

  it('restricts to the selected terrains', () => {
    const keys = selectTerrainColumns(terrains, [2, 3], new Set()).map((column) => column.key);
    expect(keys).toEqual([2, 3]);
  });
});

describe('selectDistanceColumns', () => {
  it('lists the exact distances holding data in ascending order', () => {
    expect(selectDistanceColumns(undefined, new Set([2400, 1200, 1600]))).toEqual([
      { key: 1200, label: '1200 m' },
      { key: 1600, label: '1600 m' },
      { key: 2400, label: '2400 m' },
    ]);
  });

  it('keeps a selected distance without data so it is shown as empty', () => {
    const keys = selectDistanceColumns([1400], new Set()).map((column) => column.key);
    expect(keys).toEqual([1400]);
  });
});
