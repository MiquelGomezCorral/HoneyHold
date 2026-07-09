import { money } from '../lib/format.js';

export default function ProgressLine({ label, actual, target, children }) {
  const pct = target > 0 ? Math.max(0, Math.min(100, (actual / target) * 100)) : 0;

  return (
    <div className="py-4 border-b border-hairline last:border-b-0">
      <div className="flex justify-between items-baseline gap-4 mb-2.5">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums">
          <b className={actual < 0 ? 'text-neg' : ''}>{money(actual)}</b>
          {target != null && <span className="text-muted"> / {money(target)}</span>}
        </span>
      </div>
      {target != null ? (
        <div
          className="h-1 rounded-full bg-accent-soft overflow-hidden mb-2.5"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i className="block h-full bg-accent transition-[width_0.3s_ease]" style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <p className="text-muted text-sm">No target set yet.</p>
      )}
      {children}
    </div>
  );
}
