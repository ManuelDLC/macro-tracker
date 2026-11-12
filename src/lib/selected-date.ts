import { useSyncExternalStore } from 'react';

import { toDateKey } from './dates';

let selectedDate = toDateKey();
const listeners = new Set<() => void>();

export function getSelectedDate() {
  return selectedDate;
}

export function setSelectedDate(date: string) {
  if (date === selectedDate) return;
  selectedDate = date;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The day the user is viewing on the Today tab; new log entries go to this day. */
export function useSelectedDate(): [string, (date: string) => void] {
  return [useSyncExternalStore(subscribe, getSelectedDate), setSelectedDate];
}
