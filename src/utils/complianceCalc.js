// Compliance math for OnsiteTracker.
//
// Policy constants:
//   - Standard working week = 5 days (Mon-Fri)
//   - Maintain >= 75% over any rolling 6-month window
//   - Must not fall below 75% for 4 consecutive rolling months

import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isWeekend,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';

export const COMPLIANCE_THRESHOLD = 0.75;
export const ROLLING_WINDOW_MONTHS = 6;
export const CONSECUTIVE_BREACH_MONTHS = 4;

function toKey(date) {
  return format(date, 'yyyy-MM-dd');
}

export function getWorkingDays(start, end, excludedDates = []) {
  if (!start || !end) return 0;
  const s = startOfDay(start);
  const e = startOfDay(end);
  if (e < s) return 0;
  const excluded = new Set(excludedDates);
  let count = 0;
  let cursor = s;
  while (cursor <= e) {
    if (!isWeekend(cursor) && !excluded.has(toKey(cursor))) {
      count += 1;
    }
    cursor = addDays(cursor, 1);
  }
  return count;
}

export function getDailyOnsiteRate(daysOnsite, workingDaysInWindow) {
  if (!workingDaysInWindow || workingDaysInWindow <= 0) return 0;
  return daysOnsite / workingDaysInWindow;
}

export function getNextSixMonths(today, excludedDates = []) {
  const start = startOfMonth(addMonths(today, 1));
  const months = [];
  for (let i = 0; i < 6; i += 1) {
    const monthStart = addMonths(start, i);
    const monthEnd = endOfMonth(monthStart);
    months.push({
      key: format(monthStart, 'yyyy-MM'),
      label: format(monthStart, 'MMMM yyyy'),
      start: monthStart,
      end: monthEnd,
      workingDays: getWorkingDays(monthStart, monthEnd, excludedDates),
    });
  }
  return months;
}

/**
 * Project compliance at the end of one of the next 6 months.
 *
 * Inputs:
 *   - monthIndex: 0..5 (0 = next month from today)
 *   - mtdWindow: { start, end } - the user's "current month-to-date" window from Step 2
 *   - daysOnsite: integer - days onsite in mtdWindow
 *   - priorCompliancePct: number 0..1 - average compliance for months PRIOR to today's month
 *   - excludedDates: yyyy-MM-dd[] - public + company holidays
 *   - plannedLeaveByMonthKey: { 'yyyy-MM': daysOff } - for next 6 months
 *   - today: Date
 */
export function projectMonthEnd({
  monthIndex,
  mtdWindow,
  daysOnsite,
  priorCompliancePct = 0,
  excludedDates = [],
  plannedLeaveByMonthKey = {},
  today,
}) {
  const todayStart = startOfDay(today);
  const todaysMonthStart = startOfMonth(todayStart);
  const todaysMonthEnd = endOfMonth(todayStart);

  const targetMonthStart = startOfMonth(addMonths(todayStart, monthIndex + 1));
  const targetMonthEnd = endOfMonth(targetMonthStart);

  // Rolling 6-month window = 6 full calendar months ending on the target month.
  const windowStart = startOfMonth(subMonths(targetMonthStart, ROLLING_WINDOW_MONTHS - 1));
  const windowEnd = targetMonthEnd;

  const totalWorkingDays = getWorkingDays(windowStart, windowEnd, excludedDates);

  // ---- Segment A: prior months (any complete months before today's month) ----
  const priorMonthsEnd = addDays(todaysMonthStart, -1); // last day of last month
  let priorOnsite = 0;
  if (priorMonthsEnd >= windowStart) {
    const segStart = windowStart;
    const segEnd = priorMonthsEnd <= windowEnd ? priorMonthsEnd : windowEnd;
    const segWorking = getWorkingDays(segStart, segEnd, excludedDates);
    priorOnsite = segWorking * priorCompliancePct;
  }

  // MTD daily rate (from user's reported window in Step 2)
  const mtdReportedWorking = getWorkingDays(mtdWindow.start, mtdWindow.end, excludedDates);
  const mtdRate = getDailyOnsiteRate(daysOnsite, mtdReportedWorking);

  // ---- Segment B: current month, in window, applied at MTD rate ----
  // Covers both historical MTD and the rest of the current month.
  let currentMonthOnsite = 0;
  if (todaysMonthStart <= windowEnd && todaysMonthEnd >= windowStart) {
    const segStart = todaysMonthStart > windowStart ? todaysMonthStart : windowStart;
    const segEnd = todaysMonthEnd < windowEnd ? todaysMonthEnd : windowEnd;
    const segWorking = getWorkingDays(segStart, segEnd, excludedDates);
    currentMonthOnsite = segWorking * mtdRate;
  }

  // ---- Segment C: future months in window (next month onward) ----
  let futureOnsite = 0;
  let cursor = startOfMonth(addMonths(todaysMonthStart, 1));
  while (cursor <= windowEnd) {
    const cursorKey = format(cursor, 'yyyy-MM');
    const cursorMonthEnd = endOfMonth(cursor);
    const segStart = cursor > windowStart ? cursor : windowStart;
    const segEnd = cursorMonthEnd < windowEnd ? cursorMonthEnd : windowEnd;
    if (segEnd >= segStart) {
      const segWorking = getWorkingDays(segStart, segEnd, excludedDates);
      const fullMonthWorking = getWorkingDays(cursor, cursorMonthEnd, excludedDates);
      const plannedOff = Number(plannedLeaveByMonthKey[cursorKey] || 0);
      const monthOnsite = Math.max(fullMonthWorking - plannedOff, 0);
      if (fullMonthWorking > 0) {
        futureOnsite += monthOnsite * (segWorking / fullMonthWorking);
      }
    }
    cursor = addMonths(cursor, 1);
  }

  const totalOnsite = priorOnsite + currentMonthOnsite + futureOnsite;
  const compliancePct = totalWorkingDays > 0 ? totalOnsite / totalWorkingDays : 0;

  return {
    monthKey: format(targetMonthStart, 'yyyy-MM'),
    monthLabel: format(targetMonthStart, 'MMMM yyyy'),
    windowStart,
    windowEnd,
    workingDays: totalWorkingDays,
    onsiteDays: totalOnsite,
    compliancePct,
  };
}

export function checkBreaches(monthlyResults) {
  let sixMonthBreach = null;
  let fourMonthBreach = null;

  for (const r of monthlyResults) {
    if (r.compliancePct < COMPLIANCE_THRESHOLD && !sixMonthBreach) {
      sixMonthBreach = r.monthLabel;
      break;
    }
  }

  let runStart = null;
  let runLen = 0;
  for (const r of monthlyResults) {
    if (r.compliancePct < COMPLIANCE_THRESHOLD) {
      if (runLen === 0) runStart = r.monthLabel;
      runLen += 1;
      if (runLen >= CONSECUTIVE_BREACH_MONTHS) {
        fourMonthBreach = runStart;
        break;
      }
    } else {
      runLen = 0;
      runStart = null;
    }
  }

  return { sixMonthBreach, fourMonthBreach };
}

export function statusFor(pct) {
  if (pct >= COMPLIANCE_THRESHOLD) return 'green';
  if (pct >= 0.5) return 'amber';
  return 'red';
}
