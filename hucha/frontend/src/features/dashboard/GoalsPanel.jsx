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
      <button type="button" className="link-btn" onClick={() => { setValue(current ?? ''); setEditing(true); }}>
        {current == null ? 'Set target' : 'Edit target'}
      </button>
    );
  }

  return (
    <form className="target-edit" onSubmit={save}>
      <input type="number" inputMode="decimal" min="0" step="1" value={value} onChange={(e) => setValue(e.target.value)} autoFocus aria-label="Target amount" />
      <button type="submit" className="btn small" disabled={saving}>Save</button>
      <button type="button" className="btn quiet small" onClick={() => setEditing(false)}>Cancel</button>
      {error && <span className="form-error">{error}</span>}
    </form>
  );
}

export default function GoalsPanel({ goals, year }) {
  const { bump } = useProfile();

  return (
    <div className="goals">
      <ProgressLine label="Monthly savings" actual={goals.monthly.actual} target={goals.monthly.target}>
        <TargetEditor period="monthly" year={year} current={goals.monthly.target} onSaved={bump} />
      </ProgressLine>
      <ProgressLine label={`Saved in ${year}`} actual={goals.annual.actual} target={goals.annual.target}>
        <TargetEditor period="annual" year={year} current={goals.annual.target} onSaved={bump} />
      </ProgressLine>
    </div>
  );
}
