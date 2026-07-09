import { useState } from 'react';
import ProgressLine from '../../components/ProgressLine.jsx';
import { api } from '../../api/client.js';
import { useProfile } from '../../context/ProfileContext.jsx';

function TargetEditor({ period, year, current, onSaved }) {
  const { profileId } = useProfile();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put(`/profiles/${profileId}/goals`, {
        period,
        year,
        target_amount: Number(value),
      });
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        className="border-0 bg-none p-0 text-accent font-medium text-[13px] cursor-pointer underline underline-offset-[3px] decoration-hairline hover:decoration-accent"
        onClick={() => { setValue(current ?? ''); setEditing(true); }}
      >
        {current == null ? 'Set target' : 'Edit target'}
      </button>
    );
  }

  return (
    <form className="flex gap-2 items-center" onSubmit={save}>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        aria-label="Target amount"
        className="w-[130px]"
      />
      <button
        type="submit"
        className="border-0 bg-accent text-white px-3 py-[6px] rounded-[9px] font-semibold text-xs cursor-pointer transition-colors hover:bg-accent-deep disabled:opacity-45 disabled:cursor-default"
        disabled={saving}
      >
        Save
      </button>
      <button
        type="button"
        className="bg-transparent text-accent px-3 py-[6px] rounded-[9px] font-semibold text-xs cursor-pointer transition-colors border border-hairline hover:bg-accent-soft"
        onClick={() => setEditing(false)}
      >
        Cancel
      </button>
      {error && <span className="text-neg text-sm">{error}</span>}
    </form>
  );
}

export default function GoalsPanel({ goals, year }) {
  const { bump } = useProfile();

  return (
    <div>
      <ProgressLine label="Monthly savings" actual={goals.monthly.actual} target={goals.monthly.target}>
        <TargetEditor period="monthly" year={year} current={goals.monthly.target} onSaved={bump} />
      </ProgressLine>
      <ProgressLine label={`Saved in ${year}`} actual={goals.annual.actual} target={goals.annual.target}>
        <TargetEditor period="annual" year={year} current={goals.annual.target} onSaved={bump} />
      </ProgressLine>
    </div>
  );
}
