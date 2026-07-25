import { useState, type FormEvent } from 'react';
import ProgressLine from '../../components/ProgressLine.js';
import Button from '../../components/Button.js';
import NumberInput from '../../components/NumberInput.js';
import { api } from '../../api/client.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useToast } from '../../context/ToastContext.js';
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
  const { showError, showToast } = useToast();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? '');
  const [saving, setSaving] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = goalFormSchema.safeParse({ target_amount: value });
    if (!parsed.success) return showError(validationMessage(parsed.error, t));

    setSaving(true);
    try {
      await api.put(`/profiles/${profileId}/goals`, {
        period,
        year,
        target_amount: parsed.data.target_amount,
      });
      setEditing(false);
      onSaved();
      showToast(t('toast.goalSaved'), 'success');
    } catch (err) {
      showError(err);
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
      <NumberInput inputMode="decimal" min="0" increment={100} value={value} onChange={(e) => setValue(e.target.value)} autoFocus aria-label={t('goals.targetAmount')} className="w-32" decreaseLabel={t('common.decrease')} increaseLabel={t('common.increase')} />
      <Button variant="primary" size="md" type="submit" disabled={saving}>
        {t('common.save')}
      </Button>
      <Button variant="ghost" size="md" onClick={() => setEditing(false)}>
        {t('common.cancel')}
      </Button>
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
