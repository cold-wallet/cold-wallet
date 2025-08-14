import compareStrings, { compareStringsIgnoreCase } from './compareStrings';

describe('compareStrings helpers', () => {
  test('compareStrings orders alphabetically', () => {
    expect(compareStrings('a', 'b')).toBe(-1);
    expect(compareStrings('b', 'a')).toBe(1);
    expect(compareStrings('c', 'c')).toBe(0);
  });

  test('compareStringsIgnoreCase ignores casing', () => {
    expect(compareStringsIgnoreCase('A', 'a')).toBe(0);
  });
});
