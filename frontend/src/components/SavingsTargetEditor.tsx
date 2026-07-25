import { useState, type FormEvent } from 'react';
import Button from './Button.js';
import NumberInput from './NumberInput.js';
import { percent } from '../lib/format.js';
import { useI18n } from '../i18n.js';

interface Props {
  target: number;
  onSave: (target: number) => void;
}

export default function SavingsTargetEditor({ target, onSave }: Props) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(Math.round(target * 100)));

  function submit(event: FormEvent) {
    event.preventDefault();
    const percentage = Math.max(0, Math.min(100, Number(value) || 0));
    onSave(percentage / 100);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted">{t('annual.targetLabel')}</span>
        <span className="font-semibold tabular-nums">{percent(target)}</span>
        <Button variant="link" onClick={() => { setValue(String(Math.round(target * 100))); setEditing(true); }}>
          {t('goals.editTarget')}
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-wrap items-center justify-end gap-2" onSubmit={submit}>
      <span className="text-xs text-muted">{t('annual.targetLabel')}</span>
      <NumberInput
        inputMode="numeric"
        min="0"
        max="100"
        increment={5}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoFocus
        aria-label={t('annual.targetLabel')}
        className="w-24"
        decreaseLabel={t('common.decrease')}
        increaseLabel={t('common.increase')}
      />
      <span className="text-muted">%</span>
      <Button variant="primary" size="md" type="submit">{t('common.save')}</Button>
      <Button variant="ghost" size="md" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
    </form>
  );
}
