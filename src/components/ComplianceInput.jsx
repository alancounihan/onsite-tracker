import { useMemo } from 'react';
import {
  getWorkingDays,
  projectMonthEnd,
  statusFor,
  COMPLIANCE_THRESHOLD,
} from '../utils/complianceCalc.js';
import {
  fromISO,
  todayISO,
  toISO,
  startOfMonth,
  endOfMonth,
  addDays,
} from '../utils/dateUtils.js';

const STATUS_COLORS = {
  green: 'text-success',
  amber: 'text-warning',
  red: 'text-danger',
};

export default function ComplianceInput({
  priorCompliancePct,
  setPriorCompliancePct,
  offSoFar,
  setOffSoFar,
  offPlannedRest,
  setOffPlannedRest,
  excludedDates,
}) {
  const today = useMemo(() => fromISO(todayISO()), []);

  const { workingSoFar, workingRest } = useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const restStart = addDays(today, 1);
    return {
      workingSoFar: getWorkingDays(monthStart, today, excludedDates),
      workingRest: restStart <= monthEnd ? getWorkingDays(restStart, monthEnd, excludedDates) : 0,
    };
  }, [today, excludedDates]);

  const onsiteSoFar = Math.max(workingSoFar - Number(offSoFar || 0), 0);
  const mtdPct = workingSoFar > 0 ? Math.min(onsiteSoFar / workingSoFar, 1.5) : 0;
  const mtdStatus = statusFor(mtdPct);

  // Rolling 6-month compliance projected to end of current month.
  const rollingProjection = useMemo(
    () =>
      projectMonthEnd({
        monthIndex: -1,
        offSoFar: Number(offSoFar) || 0,
        offPlannedRest: Number(offPlannedRest) || 0,
        priorCompliancePct: Number(priorCompliancePct) || 0,
        excludedDates,
        plannedLeaveByMonthKey: {},
        today,
      }),
    [offSoFar, offPlannedRest, priorCompliancePct, excludedDates, today]
  );

  const rollingStatus = statusFor(rollingProjection.compliancePct);

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
      </div>

      <div className="border-t border-white/5 pt-4">
        <h4 className="text-xs uppercase tracking-wider text-white/50 mb-2">
          This month: {toISO(today)}
        </h4>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-white/60 mb-1 block">Days offsite so far</span>
            <input
              type="number"
              min="0"
              max={workingSoFar}
              value={Number.isFinite(offSoFar) ? offSoFar : 0}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                if (Number.isNaN(v)) return;
                setOffSoFar(Math.max(0, Math.min(v, workingSoFar)));
              }}
              className="w-full bg-bg border border-white/10 rounded px-3 py-2 font-mono text-lg"
            />
            <span className="text-xs text-white/40 mt-1 block">
              of {workingSoFar} working days so far
            </span>
          </label>

          <label className="block text-sm">
            <span className="text-white/60 mb-1 block">Days off planned (rest of month)</span>
            <input
              type="number"
              min="0"
              max={workingRest}
              value={Number.isFinite(offPlannedRest) ? offPlannedRest : 0}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                if (Number.isNaN(v)) return;
                setOffPlannedRest(Math.max(0, Math.min(v, workingRest)));
              }}
              className="w-full bg-bg border border-white/10 rounded px-3 py-2 font-mono text-lg"
            />
            <span className="text-xs text-white/40 mt-1 block">
              of {workingRest} working days remaining
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3">
          <Stat
            label="MTD compliance"
            value={`${(mtdPct * 100).toFixed(1)}%`}
            valueClass={STATUS_COLORS[mtdStatus]}
          />
          <Stat
            label="Projected end-of-month (rolling 6m)"
            value={`${(rollingProjection.compliancePct * 100).toFixed(1)}%`}
            valueClass={STATUS_COLORS[rollingStatus]}
          />
        </div>
      </div>

      <p className="text-xs text-white/40">
        Threshold: {(COMPLIANCE_THRESHOLD * 100).toFixed(0)}% over any rolling 6-month window.
      </p>
    </div>
  );
}

fun