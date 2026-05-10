export default function BreachAlerts({ sixMonthBreach, fourMonthBreach }) {
  if (!sixMonthBreach && !fourMonthBreach) return null;

  return (
    <div className="space-y-2">
      {sixMonthBreach && (
        <Banner>
          <strong>6-Month Rule Breach:</strong> Your compliance is projected to fall below 75% in {sixMonthBreach}.
        </Banner>
      )}
      {fourMonthBreach && (
        <Banner>
          <strong>4-Month Rule Breach:</strong> You are projected to be below 75% for 4 consecutive months from {fourMonthBreach}.
        </Banner>
      )}
    </div>
  );
}

function Banner({ children }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-danger/60 bg-danger/15 px-4 py-3 text-white"
    >
      <span aria-hidden className="text-xl leading-none mt-0.5">&#9888;</span>
      <p className="text-sm leading-snug">{children}</p>
    </div>
  );
}
