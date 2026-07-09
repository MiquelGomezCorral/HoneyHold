import { money } from '../lib/format.js';

// A 4px line, not a gauge: actual vs target, clamped to [0, 100]%.
export default function ProgressLine({ label, actual, target, children }) {
  const pct = target > 0 ? Math.max(0, Math.min(100, (actual / target) * 100)) : 0;

  return (
    <div className="goal-row">
      <div className="goal-top">
        <span className="goal-label">{label}</span>
        <span className="goal-figures num">
          <b className={actual < 0 ? 'neg' : ''}>{money(actual)}</b>
          {target != null && <span className="goal-target"> / {money(target)}</span>}
        </span>
      </div>
      {target != null ? (
        <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <p className="empty">No target set yet.</p>
      )}
      {children}
    </div>
  );
}
