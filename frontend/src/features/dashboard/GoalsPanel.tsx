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

  async function save(e: React.FormEvent) {
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

type GoalPeriod = 'monthly' | 'annual';

interface Props {
  goals: Goals;
  year: number;
  show?: GoalPeriod[];
}

export default function GoalsPanel({ goals, year, show = ['monthly', 'annual'] }: Props) {
  const { bump } = useProfile();

  const lines: Record<GoalPeriod, { label: string; goal: Goals[GoalPeriod] }> = {
    monthly: { label: 'Monthly savings', goal: goals.monthly },
    annual: { label: `Saved in ${year}`, goal: goals.annual },
  };

  return (
    <div>
      {show.map((period) => {
        const { label, goal } = lines[period];
        return (
          <ProgressLine key={period} label={label} actual={goal.actual} target={goal.target}>
            <TargetEditor period={period} year={year} current={goal.target} onSaved={bump} />
          </ProgressLine>
        );
      })}
    </div>
  );
}
