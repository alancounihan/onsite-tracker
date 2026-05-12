// Public holidays for multiple countries.
// Returns array of { id, date: 'yyyy-MM-dd', label } sorted by date.

import { format } from 'date-fns';

export const COUNTRIES = [
  { code: 'IE', name: 'Ireland' },
  { code: 'GB', name: 'United Kingdom (England & Wales)' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
];

function pad(n) { return String(n).padStart(2, '0'); }
function iso(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }
function fmt(d) { return format(d, 'yyyy-MM-dd'); }

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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function nthWeekdayOfMonth(year, monthIndex, weekday, n) {
  const d = new Date(year, monthIndex, 1);
  const offset = (weekday - d.getDay() + 7) % 7;
  return new Date(year, monthIndex, 1 + offset + (n - 1) * 7);
}

function lastWeekdayOfMonth(year, monthIndex, weekday) {
  const lastDay = new Date(year, monthIndex + 1, 0);
  const offset = (lastDay.getDay() - weekday + 7) % 7;
  return new Date(year, monthIndex, lastDay.getDate() - offset);
}

function brigidsDay(year) {
  const feb1 = new Date(year, 1, 1);
  if (feb1.getDay() === 5) return feb1;
  return nthWeekdayOfMonth(year, 1, 1, 1);
}

const GENERATORS = {
  IE: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [fmt(brigidsDay(y)), "St. Brigid's Day"],
      [iso(y, 3, 17), "St. Patrick's Day"],
      [fmt(addDays(easter, 1)), 'Easter Monday'],
      [fmt(nthWeekdayOfMonth(y, 4, 1, 1)), 'May Day'],
      [fmt(nthWeekdayOfMonth(y, 5, 1, 1)), 'June Bank Holiday'],
      [fmt(nthWeekdayOfMonth(y, 7, 1, 1)), 'August Bank Holiday'],
      [fmt(lastWeekdayOfMonth(y, 9, 1)), 'October Bank Holiday'],
      [iso(y, 12, 25), 'Christmas Day'],
      [iso(y, 12, 26), "St. Stephen's Day"],
    ];
  },
  GB: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [fmt(addDays(easter, -2)), 'Good Friday'],
      [fmt(addDays(easter, 1)), 'Easter Monday'],
      [fmt(nthWeekdayOfMonth(y, 4, 1, 1)), 'Early May Bank Holiday'],
      [fmt(lastWeekdayOfMonth(y, 4, 1)), 'Spring Bank Holiday'],
      [fmt(lastWeekdayOfMonth(y, 7, 1)), 'Summer Bank Holiday'],
      [iso(y, 12, 25), 'Christmas Day'],
      [iso(y, 12, 26), 'Boxing Day'],
    ];
  },
  US: (y) => {
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [fmt(nthWeekdayOfMonth(y, 0, 1, 3)), 'Martin Luther King Jr. Day'],
      [fmt(nthWeekdayOfMonth(y, 1, 1, 3)), 'Presidents Day'],
      [fmt(lastWeekdayOfMonth(y, 4, 1)), 'Memorial Day'],
      [iso(y, 6, 19), 'Juneteenth'],
      [iso(y, 7, 4), 'Independence Day'],
      [fmt(nthWeekdayOfMonth(y, 8, 1, 1)), 'Labor Day'],
      [fmt(nthWeekdayOfMonth(y, 9, 1, 2)), 'Columbus Day'],
      [iso(y, 11, 11), 'Veterans Day'],
      [fmt(nthWeekdayOfMonth(y, 10, 4, 4)), 'Thanksgiving'],
      [iso(y, 12, 25), 'Christmas Day'],
    ];
  },
  DE: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [fmt(addDays(easter, -2)), 'Good Friday'],
      [fmt(addDays(easter, 1)), 'Easter Monday'],
      [iso(y, 5, 1), 'Labour Day'],
      [fmt(addDays(easter, 39)), 'Ascension Day'],
      [fmt(addDays(easter, 50)), 'Whit Monday'],
      [iso(y, 10, 3), 'German Unity Day'],
      [iso(y, 12, 25), 'Christmas Day'],
      [iso(y, 12, 26), 'St. Stephen\'s Day'],
    ];
  },
  FR: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [fmt(addDays(easter, 1)), 'Easter Monday'],
      [iso(y, 5, 1), 'Labour Day'],
      [iso(y, 5, 8), 'Victory Day'],
      [fmt(addDays(easter, 39)), 'Ascension Day'],
      [fmt(addDays(easter, 50)), 'Whit Monday'],
      [iso(y, 7, 14), 'Bastille Day'],
      [iso(y, 8, 15), 'Assumption of Mary'],
      [iso(y, 11, 1), 'All Saints\' Day'],
      [iso(y, 11, 11), 'Armistice Day'],
      [iso(y, 12, 25), 'Christmas Day'],
    ];
  },
  ES: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [iso(y, 1, 6), 'Epiphany'],
      [fmt(addDays(easter, -2)), 'Good Friday'],
      [iso(y, 5, 1), 'Labour Day'],
      [iso(y, 8, 15), 'Assumption of Mary'],
      [iso(y, 10, 12), 'National Day'],
      [iso(y, 11, 1), "All Saints' Day"],
      [iso(y, 12, 6), 'Constitution Day'],
      [iso(y, 12, 8), 'Immaculate Conception'],
      [iso(y, 12, 25), 'Christmas Day'],
    ];
  },
  NL: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [fmt(addDays(easter, -2)), 'Good Friday'],
      [fmt(addDays(easter, 1)), 'Easter Monday'],
      [iso(y, 4, 27), "King's Day"],
      [iso(y, 5, 5), 'Liberation Day'],
      [fmt(addDays(easter, 39)), 'Ascension Day'],
      [fmt(addDays(easter, 50)), 'Whit Monday'],
      [iso(y, 12, 25), 'Christmas Day'],
      [iso(y, 12, 26), 'Boxing Day'],
    ];
  },
  IT: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [iso(y, 1, 6), 'Epiphany'],
      [fmt(addDays(easter, 1)), 'Easter Monday'],
      [iso(y, 4, 25), 'Liberation Day'],
      [iso(y, 5, 1), 'Labour Day'],
      [iso(y, 6, 2), 'Republic Day'],
      [iso(y, 8, 15), 'Assumption of Mary'],
      [iso(y, 11, 1), "All Saints' Day"],
      [iso(y, 12, 8), 'Immaculate Conception'],
      [iso(y, 12, 25), 'Christmas Day'],
      [iso(y, 12, 26), "St. Stephen's Day"],
    ];
  },
  CA: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [fmt(addDays(easter, -2)), 'Good Friday'],
      [fmt(lastWeekdayOfMonth(y, 4, 1)), 'Victoria Day'],
      [iso(y, 7, 1), 'Canada Day'],
      [fmt(nthWeekdayOfMonth(y, 8, 1, 1)), 'Labour Day'],
      [iso(y, 9, 30), 'Truth & Reconciliation'],
      [fmt(nthWeekdayOfMonth(y, 9, 1, 2)), 'Thanksgiving'],
      [iso(y, 11, 11), 'Remembrance Day'],
      [iso(y, 12, 25), 'Christmas Day'],
      [iso(y, 12, 26), 'Boxing Day'],
    ];
  },
  AU: (y) => {
    const easter = easterSunday(y);
    return [
      [iso(y, 1, 1), "New Year's Day"],
      [iso(y, 1, 26), 'Australia Day'],
      [fmt(addDays(easter, -2)), 'Good Friday'],
      [fmt(addDays(easter, 1)), 'Easter Monday'],
      [iso(y, 4, 25), 'Anzac Day'],
      [fmt(nthWeekdayOfMonth(y, 5, 1, 2)), "King's Birthday"],
      [iso(y, 12, 25), 'Christmas Day'],
      [iso(y, 12, 26), 'Boxing Day'],
    ];
  },
};

export function publicHolidays(countryCode, year) {
  const gen = GENERATORS[countryCode] || GENERATORS.IE;
  const entries = gen(year);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([date, label], idx) => ({
    id: `ph-${countryCode}-${year}-${idx}`,
    date,
    label,
  }));
}
