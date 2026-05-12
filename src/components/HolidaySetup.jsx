import { useMemo, useState } from 'react';
import { fromISO } from '../utils/dateUtils.js';
import { COUNTRIES } from '../utils/publicHolidays.js';

function HolidayList({ title, items, onAdd, onUpdate, onRemove, max, hint, headerExtra }) {
  const [date, setDate] = useState('');
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!date || !label.trim()) return;
    onAdd({ date, label: label.trim() });
    setDate('');
    setLabel('');
  };

  return (
    <div className="rounded-xl bg-bg/40 border border-white/5 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <span className="text-xs font-mono text-white/40">
          {items.length}
          {max ? `/${max}` : ''}
        </span>
      </div>

      {headerExtra}

      {hint ? <p className="text-xs text-white/50 mb-3">{hint}</p> : null}

      <ul className="space-y-2 mb-3">
        {items.length === 0 ? (
          <li className="text-sm text-white/40 italic">No entries yet.</li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[140px_1fr_auto] items-center gap-2"
            >
              <input
                type="date"
                value={item.date}
                onChange={(e) => onUpdate(item.id, { date: e.target.value })}
                className="bg-bg border border-white/10 rounded px-2 py-1 text-sm font-mono"
              />
              <input
                type="text"
                value={item.label}
                onChange={(e) => onUpdate(item.id, { label: e.target.value })}
                className="bg-bg border border-white/10 rounded px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.label}`}
                className="text-white/40 hover:text-danger px-2 text-sm"
              >
                &#x2715;
              </button>
            </li>
          ))
        )}
      </ul>

      {(!max || items.length < max) && (
        <div className="grid grid-cols-[140px_1fr_auto] gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-bg border border-white/10 rounded px-2 py-1 text-sm font-mono"
          />
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="bg-bg border border-white/10 rounded px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!date || !label.trim()}
            className="bg-accent text-bg font-medium rounded px-3 text-sm disabled:opacity-30"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export default function HolidaySetup({
  country,
  setCountry,
  publicHolidays,
  setPublicHolidays,
  companyHolidays,
  setCompanyHolidays,
}) {
  const updateList = (setter) => (id, patch) =>
    setter((items) => items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeFromList = (setter) => (id) =>
    setter((items) => items.filter((it) => it.id !== id));

  const addToList = (setter, prefix) => (entry) =>
    setter((items) => [
      ...items,
      { id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...entry },
    ].sort((a, b) => a.date.localeCompare(b.date)));

  const companyMonths = useMemo(
    () => new Set(companyHolidays.map((h) => fromISO(h.date).getMonth())),
    [companyHolidays]
  );

  const showCoverageWarning =
    companyHolidays.length > 0 && (!companyMonths.has(5) || !companyMonths.has(10));

  const countrySelector = (
    <div className="mb-3">
      <label className="block text-xs text-white/60 mb-1">Country</label>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full bg-bg border border-white/10 rounded px-2 py-1.5 text-sm font-mono"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        These dates are excluded from working-day counts everywhere else in the app.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <HolidayList
          title="Public Holidays"
          items={publicHolidays}
          onAdd={addToList(setPublicHolidays, 'ph')}
          onUpdate={updateList(setPublicHolidays)}
          onRemove={removeFromList(setPublicHolidays)}
          hint="Auto-populated from your selected country. Edit, add, or delete as needed."
          headerExtra={countrySelector}
        />
        <HolidayList
          title="Company Holidays"
          items={companyHolidays}
          onAdd={addToList(setCompanyHolidays, 'co')}
          onUpdate={updateList(setCompanyHolidays)}
          onRemove={removeFromList(setCompanyHolidays)}
          max={5}
          hint="Up to 5 company-wide closures (e.g., Christmas shutdown, summer Friday)."
        />
      </div>

      {showCoverageWarning && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          Heads up: no company holiday in June or November. Most teams have at
          least one mid-year and one autumn closure &mdash; double-check this is right.
        </div>
      )}
    </div>
  );
}
