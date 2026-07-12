import { useState } from 'react';
import ProgressLine from '../../components/ProgressLine.js';
import Button from '../../components/Button.js';
import { api } from '../../api/client.js';
import { useProfile } from '../../context/ProfileContext.js';

interface Goals {
  monthly: { actual: number; target: number | null };
  annual: { actual: number; target: number | null };
}

interface TargetEditorProps {
  period: string;
  year: number;
  current: number | null;
  onSaved: () => void;
}

function TargetEditor({ period, year, current, onSaved }: TargetEditorProps) {
  const { profileId } = useProfile();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
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
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Button variant="link"
        onClick={() => { setValue(current ?? ''); setEditing(true); }}
      >
        {current == null ? 'Set target' : 'Edit target'}
      </Button>
    );
  }

  return (
    <form className="flex gap-2 items-center" onSubmit={save}>
      <input type="number" inputMode="decimal" min="0" step="1" value={value} onChange={(e) => setValue(e.target.value)} autoFocus aria-label="Target amount" className="w-[130px]" />
      <Button variant="primary" size="sm" type="submit" disabled={saving}>
        Save
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
        Cancel
      </Button>
      {error && <span className="text-neg text-sm">{error}</span>}
    </form>
  );
}

interface Props {
  goals: Goals;
  year: number;
}

export default function GoalsPanel({ goals, year }: Props) {
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
