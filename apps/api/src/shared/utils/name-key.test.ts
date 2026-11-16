import { toNameKey } from './name-key';

describe('toNameKey', () => {
  it.each([
    ['Très Souple', 'tres souple'],
    ['  très   souple ', 'tres souple'],
    ['GALILEO (IRE)', 'galileo ire'],
    ['Rock Of Gibraltar', 'rock of gibraltar'],
    ['Saint-Cloud', 'saint cloud'],
    ['Élusive  Ça', 'elusive ca'],
  ])('normalizes %p to %p', (input, expected) => {
    expect(toNameKey(input)).toBe(expected);
  });
});
