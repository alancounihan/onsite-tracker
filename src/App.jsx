import { useEffect, useMemo, useState } from 'react';
import HolidaySetup from './components/HolidaySetup.jsx';
import ComplianceInput from './components/ComplianceInput.jsx';
import PlannedLeaveTable from './components/PlannedLeaveTable.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import { irishPublicHolidays } from './utils/irishHolidays.js';
import {
  checkBreaches,
  getNextSixMonths,
  projectMonthEnd,
} from './utils/complianceCalc.js';
import { fromISO, todayISO, toISO, startOfMonth, monthLabel } from './utils/dateUtils.js';

function defaultWindow() {
  const today = new Date();
  return { start: toISO(startOfMonth(today)), end: toISO(today) };
}

export default function App() {
  const today = useMemo(() => fromISO(todayISO()), []);
  const currentYear = today.getFullYear();

  const [publicHolidays, setPublicHolidays] = useState(() => irishPublicHolidays(currentYear));
  const [companyHolidays, setCompanyHolidays] = useState([]);

  const initialWindow = useMemo(defaultWindow, []);
  const [windowStart, setWindowStart] = useState(initialWindow.start);
  const [windowEnd, setWindowEnd] = useState(initialWindow.end);
  const [daysOnsite, setDaysOnsite] = useState(0);
  const [priorCompliancePct, setPriorCompliancePct] = useState(0.75);

  const [plannedLeave, setPlannedLeave] = useState({});

  const excludedDates = useMemo(
    () => [...publicHolidays, ...companyHolidays].map((h) => h.date),
    [publicHolidays, companyHolidays]
  );

  const months = useMemo(() => getNextSixMonths(today, excludedDates), [today, excludedDates]);

  // Drop stale planned-leave keys when months shift, and clamp to working days.
  useEffect(() => {
    setPlannedLeave((prev) => {
      const next = {};
      let changed = false;
      for (const m of months) {
        const v = Math.min(Number(prev[m.key] || 0), m.workingDays);
        next[m.key] = v;
        if (v !== prev[m.key]) changed = true;
      }
      for (const k of Object.keys(prev)) {
        if (!(k in next)) {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months.map((m) => `${m.key}:${m.workingDays}`).join('|')]);

  const monthlyResults = useMemo(() => {
    if (!windowStart || !windowEnd) return [];
    return Array.from({ length: 6 }, (_, i) =>
      projectMonthEnd({
        monthIndex: i,
        mtdWindow: { start: fromISO(windowStart), end: fromISO(windowEnd) },
        daysOnsite: Number(daysOnsite) || 0,
        priorCompliancePct: Number(priorCompliancePct) || 0,
        excludedDates,
        plannedLeaveByMonthKey: plannedLeave,
        today,
      })
    );
  }, [windowStart, windowEnd, daysOnsite, priorCompliancePct, excludedDates, plannedLeave, today]);

  const breaches = useMemo(() => checkBreaches(monthlyResults), [monthlyResults]);

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Onsite<span className="text-accent">Tracker</span>
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Personal compliance dashboard &mdash; 75% rolling six-month rule.
            </p>
          </div>
          <div className="text-xs font-mono text-white/40 hidden sm:block">v0.2</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        <Step number={1} title="Holiday Setup">
          <HolidaySetup
            publicHolidays={publicHolidays}
            setPublicHolidays={setPublicHolidays}
            companyHolidays={companyHolidays}
            setCompanyHolidays={setCompanyHolidays}
          />
        </Step>

        <Step number={2} title="Current Compliance">
          <ComplianceInput
            windowStart={windowStart}
            setWindowStart={setWindowStart}
            windowEnd={windowEnd}
            setWindowEnd={setWindowEnd}
            daysOnsite={daysOnsite}
            setDaysOnsite={setDaysOnsite}
            priorCompliancePct={priorCompliancePct}
            setPriorCompliancePct={setPriorCompliancePct}
            excludedDates={excludedDates}
          />
        </Step>

        <Step number={3} title="Planned Days Off &mdash; Next 6 Months">
          <PlannedLeaveTable
            months={months}
            plannedLeave={plannedLeave}
            setPlannedLeave={setPlannedLeave}
          />
        </Step>

        <section>
          <div className="flex items-baseline gap-3 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <h2 className="text-sm uppercase tracking-widest text-white/50">Results</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <ResultsPanel
            monthlyResults={monthlyResults}
            breaches={breaches}
            startingPoint={{
              label: monthLabel(today),
              pct: Number(priorCompliancePct) || 0,
            }}
          />
        </section>

        <footer className="pt-4 pb-8 text-xs text-white/30 text-center">
          Session-only. No data is stored.
        </footer>
      </main>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <section className="grid grid-cols-[3rem_1fr] gap-4">
      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full bg-accent text-bg font-mono font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <div>
        <h2
          className="text-lg font-semibold tracking-tight mb-3"
         