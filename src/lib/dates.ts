/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** "Thu, Nov 12" for the small date above the day title. */
export function formatShortDate(key: string): string {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateLabel(key: string): string {
  const today = toDateKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key === addDays(today, 1)) return 'Tomorrow';
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
