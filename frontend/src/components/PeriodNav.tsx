import cn from 'classnames';
import { monthLabel } from '../lib/format.js';
import { useI18n } from '../i18n.js';
import Button from './Button.js';
import Icon from './Icon.js';

interface Props {
  year: number;
  month: number;
  disabled?: boolean;
  onChange: (p: { year: number; month: number }) => void;
}

export default function PeriodNav({ year, month, disabled, onChange }: Props) {
  const { locale, t } = useI18n();
  const dateLocale = locale === 'es' ? 'es-ES' : 'en-GB';

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    onChange({ year: y, month: m });
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5', { 'opacity-45': disabled })} aria-disabled={disabled || undefined}>
      <Button variant="nav" onClick={() => shift(-1)} aria-label={t('date.previousMonth')} disabled={disabled}>
        <Icon src="caret-left" type="black" title={t('date.previousMonth')} className="h-4 w-4" />
      </Button>
      <span className="min-w-36 text-center font-semibold">{monthLabel(year, month, dateLocale)}</span>
      <Button variant="nav" onClick={() => shift(1)} aria-label={t('date.nextMonth')} disabled={disabled}>
        <Icon src="caret-right" type="black" title={t('date.nextMonth')} className="h-4 w-4" />
      </Button>
    </div>
  );
}
