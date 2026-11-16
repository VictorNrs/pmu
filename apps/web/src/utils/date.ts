/** Converts a date picker timestamp (local midnight) to YYYY-MM-DD. */
export function timestampToIsoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isoDateToTimestamp(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getTime();
}

export function todayIsoDate(): string {
  return timestampToIsoDate(Date.now());
}
