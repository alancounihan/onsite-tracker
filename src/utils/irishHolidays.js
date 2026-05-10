// Compute the 10 Irish public holidays for a given year.
// Source: Citizens Information / gov.ie
//   1. New Year's Day               - 1 Jan
//   2. St. Brigid's Day             - first Mon in Feb (or 1 Feb if a Fri)
//   3. St. Patrick's Day            - 17 Mar
//   4. Easter Monday                - Mon after Easter Sunday
//   5. May Day                      - first Mon in May
//   6. June Bank Holiday            - first Mon in Jun
//   7. August Bank Holiday          - first Mon in Aug
//   8. October Bank Holiday         - last Mon in Oct
//   9. Christmas Day                - 25 Dec
//  10. St. Stephen's Day            - 26 Dec
//
// Note: when Christmas/Stephen's Day fall on a weekend a substitute weekday
// is observed, but for compliance counting purposes weekend dates are already
// excluded from working days, so we keep the canonical date.

import { format } from 'date-fns';

function pad(n) {
  return String(n).padStart(2, '0');
}

function iso(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Anonymous Gregorian algorithm for Easter Sunday.
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function firstWeekdayOfMonth(year, monthIndex /* 0-based */, weekday /* 0=Sun..6=Sat */) {
  const d = new Date(year, monthIndex, 1);
  const offset = (weekday - d.getDay() + 7) % 7;
  return new Date(year, monthIndex, 1 + offset);
}

function lastWeekdayOfMonth(year, monthIndex, weekday) {
  // Walk back from the last day of the month.
  const lastDay = new Date(year, monthIndex + 1, 0);
  const offset = (lastDay.getDay() - weekday + 7) % 7;
  return new Date(year, monthIndex, lastDay.getDate() - offset);
}

function brigidsDay(year) {
  // Since 2023: first Monday in February, unless 1 Feb is a Friday (then 1 Feb).
  const feb1 = new Date(year, 1, 1);
  if (feb1.getDay() === 5) return feb1; // Friday
  return firstWeekdayOfMonth(year, 1, 1); // Monday
}

export function irishPublicHolidays(year) {
  const easter = easterSunday(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  const entries = [
    { date: iso(year, 1, 1), label: "New Year's Day" },
    { date: format(brigidsDay(year), 'yyyy-MM-dd'), label: "St. Brigid's Day" },
    { date: iso(year, 3, 17), label: "St. Patrick's Day" },
    { date: format(easterMonday, 'yyyy-MM-dd'), label: 'Easter Monday' },
    { date: format(firstWeekdayOfMonth(year, 4, 1), 'yyyy-MM-dd'), label: 'May Day' },
    { date: format(firstWeekdayOfMonth(year, 5, 1), 'yyyy-MM-dd'), label: 'June Bank Holiday' },
    { date: format(firstWeekdayOfMonth(year, 7, 1), 'yyyy-MM-dd'), label: 'August Bank Holiday' },
    { date: format(lastWeekdayOfMonth(year, 9, 1), 'yyyy-MM-dd'), label: 'October Bank Holiday' },
    { date: iso(year, 12, 25), label: 'Christmas Day' },
    { date: iso(year, 12, 26), label: "St. Stephen's Day" },
  ];

  // Sort by date and assign stable ids.
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries.map((e, idx) => ({ id: `ph-${year}-${idx}`, ...e }));
}
