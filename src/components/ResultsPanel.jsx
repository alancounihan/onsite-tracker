import { useEffect, useState } from 'react';
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

function readCssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  return `rgb(${raw})`;
}

export default function ResultsPanel({ monthlyResults, breaches, startingPoint }) {
  const [themeColors, setThemeColors] = useState(() => ({
    accent: '#3253DC',
    bg: '#0c1733',
    surface: '#182649',
    fg: '#f5f7fc',
    danger: '#ef4444',
  }));

  useEffect(() => {
    const update = () => {
      setThemeColors({
        accent: readCssVar('--color-accent', '#3253DC'),
        bg: readCssVar('--color-bg', '#0c1733'),
        surface: readCssVar('--color-surface', '#182649'),
        fg: readCssVar('--color-fg', '#f5f7fc'),
        danger: readCssVar('--color-danger', '#ef4444'),
      });
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const projectionData = monthlyResults.map((r) => ({
    name: r.monthLabel.split(' ')[0].slice(0, 3),
    pct: Number((r.compliancePct * 100).toFixed(1)),
    isStart: false,
  }));

  const chartData = startingPoint
    ? [
        {
          name: startingPoint.label.split(' ')[0].slice(0, 3),
          pct: Number((startingPoint.pct * 100).toFixed(1)),
          isStart: true,
        },
        ...projectionData,
      ]
    : projectionData;

  const gridStroke = themeColors.fg + '20';
  const axisStroke = themeColors.fg + '90';

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
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={axisStroke}
                tickLine={false}
                axisLine={false}
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke={axisStroke}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}
              />
              <ReferenceLine
                y={COMPLIANCE_THRESHOLD * 100}
                stroke={themeColors.danger}
                strokeDasharray="4 4"
                label={{ value: 'Minimum', fill: themeColors.danger, fontSize: 11, position: 'insideTopRight' }}
              />
              <Tooltip
                contentStyle={{
                  background: themeColors.surface,
                  border: `1px solid ${themeColors.fg}30`,
                  borderRadius: 8,
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 12,
                  color: themeColors.fg,
                }}
                labelStyle={{ color: themeColors.fg }}
                formatter={(v, _n, ctx) => [
                  `${v}%`,
                  ctx?.payload?.isStart ? 'Starting' : 'Projected',
                ]}
              />
              <Line
                type="monotone"
                dataKey="pct"
                stroke={themeColors.accent}
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload, index } = props;
                  if (payload?.isStart) {
                    return (
                      <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill={themeColors.bg} stroke={themeColors.accent} strokeWidth={2.5} />
                    );
                  }
                  return (
                    <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill={themeColors.accent} stroke={themeColors.bg} strokeWidth={2} />
                  );
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {startingPoint && (
          <p className="text-xs text-white/40 mt-2">
            Starting point uses your stated prior 6-month compliance.
          </p>
        )}
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
