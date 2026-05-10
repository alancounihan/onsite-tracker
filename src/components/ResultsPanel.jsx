import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { statusFor, COMPLIANCE_THRESHOLD } from '../utils/complianceCalc.js';
import BreachAlerts from './BreachAlerts.jsx';

const STATUS_STYLES = {
  green: { border: 'border-l-success', text: 'text-success', label: 'On track' },
  amber: { border: 'border-l-warning', text: 'text-warning', label: 'Watch' },
  red: { border: 'border-l-danger', text: 'text-danger', label: 'Breach' },
};

export default function ResultsPanel({ monthlyResults, breaches }) {
  const chartData = monthlyResults.map((r) => ({
    name: r.monthLabel.split(' ')[0].slice(0, 3),
    pct: Number((r.compliancePct * 100).toFixed(1)),
  }));

  return (
    <section className="space-y-4">
      <BreachAlerts {...breaches} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {monthlyResults.map((r) => (
          <ResultCard key={r.monthKey} result={r} />
        ))}
      </div>

      <div className="rounded-xl bg-bg/40 border border-white/5 p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-base font-semibold tracking-tight">Projected compliance %</h3>
          <span className="text-xs text-white/40">end-of-month, rolling 6m window</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#ffffff60"
                tickLine={false}
                axisLine={false}
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#ffffff60"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}
              />
              <ReferenceLine
                y={COMPLIANCE_THRESHOLD * 100}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: 'Minimum', fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a2540',
                  border: '1px solid #ffffff20',
                  borderRadius: 8,
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#ffffff80' }}
                formatter={(v) => [`${v}%`, 'Compliance']}
              />
              <Line
                type="monotone"
                dataKey="pct"
                stroke="#00d4b8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#00d4b8', stroke: '#0f1b35', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function ResultCard({ result }) {
  const status = statusFor(result.compliancePct);
  const styles = STATUS_STYLES[status];
  const pct = (result.compliancePct * 100).toFixed(1);
  return (
    <div className={`rounded-xl bg-surface border border-white/5 ${styles.border} border-l-4 p-4`}>
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-white/70">{result.monthLabel}</h4>
        <span className={`text-xs uppercase tracking-wider ${styles.text}`}>{styles.label}</span>
      </div>
      <div className={`font-mono text-3xl mt-2 ${styles.text}`}>{pct}%</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/50">
        <div>
          <div className="text-white/40">Working days</div>
          <div className="font-mono text-white/70 text-sm">{result.workingDays}</div>
        </div>
        <div>
          <div className="text-white/40">Onsite (proj.)</div>
          <div className="font-mono text-white/70 text-sm">{result.onsiteDays.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}
