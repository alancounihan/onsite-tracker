export default function PlannedLeaveTable({ months, plannedLeave, setPlannedLeave }) {
  const handleChange = (key, raw, max) => {
    const v = raw === '' ? 0 : parseInt(raw, 10);
    if (Number.isNaN(v) || v < 0) return;
    const clamped = Math.min(v, max);
    setPlannedLeave((prev) => ({ ...prev, [key]: clamped }));
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-bg/40">
      <table className="w-full text-sm">
        <thead className="text-white/50 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Month</th>
            <th className="text-right px-4 py-3 font-medium">Working days</th>
            <th className="text-right px-4 py-3 font-medium">Days off planned</th>
            <th className="text-right px-4 py-3 font-medium">Days onsite</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => {
            const planned = Number(plannedLeave[m.key] || 0);
            const onsite = Math.max(m.workingDays - planned, 0);
            return (
              <tr key={m.key} className="border-t border-white/5">
                <td className="px-4 py-3">{m.label}</td>
                <td className="px-4 py-3 text-right font-mono text-white/70">{m.workingDays}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    min="0"
                    max={m.workingDays}
                    value={planned}
                    onChange={(e) => handleChange(m.key, e.target.value, m.workingDays)}
                    className="w-20 bg-bg border border-white/10 rounded px-2 py-1 text-right font-mono"
                  />
                </td>
                <td className="px-4 py-3 text-right font-mono text-accent">{onsite}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
