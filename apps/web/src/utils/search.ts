/** Case and accent insensitive matching for client-side quick search in displayed lists. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function matchesSearch(text: string, search: string): boolean {
  const query = normalizeForSearch(search);
  return query === '' || normalizeForSearch(text).includes(query);
}
