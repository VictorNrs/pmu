import { selectColumns } from './performance-columns';

const terrains = [
  { key: 1, label: 'Bon', isActive: true },
  { key: 2, label: 'Souple', isActive: true },
  { key: 3, label: 'Collant', isActive: false },
];

describe('selectColumns', () => {
  it('shows every active entry by default, in the given order, even without data', () => {
    expect(selectColumns(terrains, undefined, new Set())).toEqual([
      { key: 1, label: 'Bon' },
      { key: 2, label: 'Souple' },
    ]);
  });

  it('keeps an inactive entry that still holds data', () => {
    const keys = selectColumns(terrains, undefined, new Set([3])).map((column) => column.key);
    expect(keys).toEqual([1, 2, 3]);
  });

  it('restricts to the selected entries', () => {
    const keys = selectColumns(terrains, [2, 3], new Set()).map((column) => column.key);
    expect(keys).toEqual([2, 3]);
  });
});
