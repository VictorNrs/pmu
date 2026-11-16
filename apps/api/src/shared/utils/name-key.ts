/**
 * Normalized key used to detect duplicates regardless of case, accents and spacing:
 * "Très  Souple" and "tres souple" are the same terrain.
 */
export function toNameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim();
}
