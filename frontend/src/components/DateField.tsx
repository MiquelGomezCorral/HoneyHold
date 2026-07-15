import cn from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n.js';
import Field from './Field.js';
import Icon from './Icon.js';

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  darkPopupClassName?: string;
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function toISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthDays(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function firstWeekday(date: Date) {
  return (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7;
}

export default function DateField({ id, label, value, onChange, className, darkPopupClassName }: DateFieldProps) {
  const { locale, t, tl } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => parseDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [pickingMonth, setPickingMonth] = useState(false);
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const days = monthDays(month);
  const leading = firstWeekday(month);
  const months = Array.from({ length: 12 }, (_, index) => new Date(month.getFullYear(), index, 1));
  const dateLocale = locale === 'es' ? 'es-ES' : 'en-GB';
  const monthFormat = new Intl.DateTimeFormat(dateLocale, { month: 'long', year: 'numeric' });
  const monthNameFormat = new Intl.DateTimeFormat(dateLocale, { month: 'short' });
  const dayFormat = new Intl.DateTimeFormat(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' });
  const weekdays = tl('date.weekdays');

  useEffect(() => {
    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setPickingMonth(false);
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function move(delta: number) {
    setMonth((current) => new Date(current.getFullYear() + (pickingMonth ? delta : 0), current.getMonth() + (pickingMonth ? 0 : delta), 1));
  }

  function choose(day: number) {
    onChange(toISO(new Date(month.getFullYear(), month.getMonth(), day)));
    setOpen(false);
  }

  function chooseMonth(index: number) {
    setMonth((current) => new Date(current.getFullYear(), index, 1));
    setPickingMonth(false);
  }

  return (
    <Field label={label} htmlFor={id} className={className}>
      <div ref={rootRef} className="relative">
        <button
          id={id}
          type="button"
          data-input-surface
          className="flex min-h-10 w-full items-center justify-between rounded-lg border border-hairline bg-paper-blue-raise px-3 py-2 text-left text-sm text-ink transition-[border-color,background-color] duration-300 hover:bg-accent-soft focus:border-accent focus:outline-none"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{dayFormat.format(selected)}</span>
          <Icon src="caret-down" type="black" className="h-4 w-4 opacity-70" title={t('date.openCalendar')} />
        </button>

        {open && (
          <div className={cn('absolute left-0 top-full z-30 mt-1.5 w-[282px] rounded-xl border border-hairline bg-paper-blue-raise p-3 shadow-xl', darkPopupClassName)} role="dialog" aria-label={t('date.calendar', { label })}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <button type="button" className="rounded-lg p-1.5 transition-colors duration-300 hover:bg-accent-soft" onClick={() => move(-1)} aria-label={pickingMonth ? t('date.previousYear') : t('date.previousMonth')}>
                <Icon src="caret-left" type="black" className="h-4 w-4" title={pickingMonth ? t('date.previousYear') : t('date.previousMonth')} />
              </button>
              <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-accent-soft" onClick={() => setPickingMonth((current) => !current)}>
                {pickingMonth ? month.getFullYear() : monthFormat.format(month)}
              </button>
              <button type="button" className="rounded-lg p-1.5 transition-colors duration-300 hover:bg-accent-soft" onClick={() => move(1)} aria-label={pickingMonth ? t('date.nextYear') : t('date.nextMonth')}>
                <Icon src="caret-right" type="black" className="h-4 w-4" title={pickingMonth ? t('date.nextYear') : t('date.nextMonth')} />
              </button>
            </div>

            {pickingMonth ? (
              <div className="grid grid-cols-3 gap-1">
                {months.map((candidate, index) => {
                  const active = selected.getFullYear() === candidate.getFullYear() && selected.getMonth() === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      className={cn(
                        'h-9 rounded-lg text-sm transition-[background-color,color,transform] duration-300 active:duration-75 active:scale-95',
                        {
                          'bg-accent text-white font-semibold': active,
                          'text-ink hover:bg-accent-soft': !active,
                        }
                      )}
                      onClick={() => chooseMonth(index)}
                    >
                      {monthNameFormat.format(candidate)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {weekdays.map((day) => <span key={day}>{day}</span>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: leading }).map((_, index) => <span key={`empty-${index}`} />)}
                  {Array.from({ length: days }).map((_, index) => {
                    const day = index + 1;
                    const iso = toISO(new Date(month.getFullYear(), month.getMonth(), day));
                    const active = iso === value;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={cn(
                          'h-8 rounded-lg text-sm transition-[background-color,color,transform] duration-300 active:duration-75 active:scale-95',
                          {
                            'bg-accent text-white font-semibold': active,
                            'text-ink hover:bg-accent-soft': !active,
                          }
                        )}
                        onClick={() => choose(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
