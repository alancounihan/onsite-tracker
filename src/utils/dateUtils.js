// Lightweight date helpers used across the app.
// All "date strings" stored in state are ISO yyyy-MM-dd (local) so they can
// flow into <input type="date"> directly and compare as strings if needed.

import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isWeekend,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';

export function toISO(date) {
  return format(date, 'yyyy-MM-dd');
}

export function fromISO(value) {
  return parseISO(value);
}

export function todayISO() {
  return toISO(startOfDay(new Date()));
}

export function monthLabel(date) {
  return format(date, 'MMMM yyyy');
}

export function shortMonth(date) {
  return format(date, 'MMM yy');
}

export {
  addDays,
  addMonths,
  endOfMonth,
  isWeekend,
  startOfDay,
  startOfMonth,
  subMonths,
};
