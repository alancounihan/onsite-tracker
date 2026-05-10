import { useMemo } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import {
  getWorkingDays,
  statusFor,
  COMPLIANCE_THRESHOLD,
} from '../utils/complianceCalc.js';
import { fromISO, todayISO } from '../utils/dateUtils.js';

const STATUS_COLORS = {
  green: 'text-success',
  amber: 'text-warning',
  red: 'text-danger',
};

export default function ComplianceInput({
  windowStart,
  setWindowStart,
  windowEnd,
  setWindowEnd,
  daysOnsite,
  setDaysOnsite,
  priorCompliancePct,
  setPriorCompliancePct,
  excludedDates,
}) {
  const today = todayISO();

  const workingDays = useMemo(
    () => (windowStart && windowEnd ? getWorkingDays(fromISO(windowStart), fromISO(windowEnd), excludedDates) : 0),
    [windowStart, windowEnd, excludedDates]
  );

  const pct = workingDays > 0 ? Math.min(daysOnsite / workingDays, 1.5) : 0;
  const status = statusFor(pct);

  const daysRemaining = useMemo(() => {
    if (!windowEnd) return 0;
    const diff = differenceInCalendarDays(fromISO(windowEnd), fromISO(today));
    return Math.max(diff, 0);
  }, [windowEnd, today]);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs uppercase tracking-wider text-white/50 mb-2">
          Prior 6 months
        </h4>
        <label className="block text-sm">
          <span className="text-white/60 mb-1 block">
            Average compliance % for the months before this one
          </span>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={Number.isFinite(priorCompliancePct * 100) ? Number((priorCompliancePct * 100).toFixed(1)) : 0}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                if (Number.isNaN(v)) return;
                setPriorCompliancePct(Math.max(0, Math.min(v, 150)) / 100);
              }}
              className="w-full bg-bg border border-white/10 rounded px-3 py-2 font-mono text-lg pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 font-mono">%</span>
          </div>
        </label>
        <p className="text-xs text-white/40 mt-1">
          What was your overall compliance for the rolling period before today's month?
        </p>
      </div>

      <div className="border-t border-white/5 pt-4">
        <h4 className="text-xs uppercase tracking-wider text-white/50 mb-2">
          This month so far
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-white/60 mb-1 block">Window start</span>
            <input
              type="date"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              className="w-full bg-bg border border-white/10 rounded px-3 py-2 font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/60 mb-1 block">Window end</span>
            <input
              type="date"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              className="w-full bg-bg border border-white/10 rounded px-3 py-2 font-mono"
            />
          </label>
        </div>

        <label className="block text-sm mt-3">
          <span className="text-white/60 mb-1 block">Days onsite so far in this window</span>
          <input
            type="number"
            min="0"
            value={Number.isFinite(daysOnsite) ? daysOnsite : 0}
            onChange={(e) => {
              const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
              setDaysOnsite(Number.isNaN(v) ? 0 : Math.max(v, 0));
            }}
            className="w-full bg-bg border border-white/10 rounded px-3 py-2 font-mono text-lg"
          />
        </label>

        <div className="grid grid-cols-3 gap-3 pt-3">
          <Stat label="Working days" value={workingDays} />
          <Stat label="Days remaining" value={daysRemaining} />
          <Stat
            label="MTD compliance"
            value={`${(pct * 100).toFixed(1)}%`}
            valueClass={STATUS_COLORS[status]}
          />
        </div>
      </div>

      {workingDays > 0 && daysOnsite > workingDays && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          Days onsite ({daysOnsite}) exceeds the working days in this window ({workingDays}).
          That's likely a typo &mdash; capped at 100% in projections.
        </div>
      )}

      <p className="text-xs text-white/40">
        Threshold: {(COMPLIANCE_THRESHOLD * 100).toFixed(0)}% over any rolling 6-month window.
      </p>
    </div>
  );
}

function Stat({ label, value, valueClass = '' }) {
  return (
    <div className="rounded-lg bg-bg/40 border border-white/5 px-3 py-2">
      <div className="text-xs text-white/50">{label}</div>
      <div className={`font-mono text-xl mt-1 ${valueClass}`}>{value}</div>
    </div>
  );
}
