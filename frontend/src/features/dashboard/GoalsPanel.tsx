import { useState, type FormEvent } from 'react';
import ProgressLine from '../../components/ProgressLine.js';
import Button from '../../components/Button.js';
import { api } from '../../api/client.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useI18n } from '../../i18n.js';
import { goalFormSchema, validationMessage } from '../../lib/validation.js';

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
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = goalFormSchema.safeParse({ target_amount: value });
    if (!parsed.success) return setError(validationMessage(parsed.error, t));

    setSaving(true);
    try {
      await api.put(`/profiles/${profileId}/goals`, {
        period,
        year,
        target_amount: parsed.data.target_amount,
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
        {current == null ? t('goals.setTarget') : t('goals.editTarget')}
      </Button>
    );
  }

  return (
    <form className="flex gap-2 items-center" onSubmit={save}>
      <input type="number" inputMode="decimal" min="0" step="1" value={value} onChange={(e) => setValue(e.target.value)} autoFocus aria-label={t('goals.targetAmount')} className="w-32" />
      <Button variant="primary" size="sm" type="submit" disabled={saving}>
        {t('common.save')}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
        {t('common.cancel')}
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
  const { t } = useI18n();

  const lines: Record<GoalPeriod, { label: string; goal: Goals[GoalPeriod] }> = {
    monthly: { label: t('goals.monthlySavings'), goal: goals.monthly },
    annual: { label: t('goals.savedInYear', { year }), goal: goals.annual },
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
