import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n.js';
import Icon from './Icon.js';

const LANGUAGES = [
  { locale: 'en', icon: 'uk', labelKey: 'languages.en' },
  { locale: 'es', icon: 'spain', labelKey: 'languages.es' },
] as const;

interface Props {
  mobile?: boolean;
}

export default function LanguageChanger({ mobile }: Props) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((language) => language.locale === locale) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white/45 px-2.5 py-1.5 text-sm font-semibold text-ink transition-[color,background-color,transform] duration-300 active:duration-75 active:scale-95 hover:bg-accent-soft"
        aria-label={t('languages.label')}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon src={current.icon} type="country" title={t(current.labelKey)} className="h-5 w-5" />
        <span className={mobile ? 'sr-only' : 'hidden xl:inline'}>{t(current.labelKey)}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-36 rounded-xl bg-white/95 p-1 shadow-[0_18px_45px_rgba(31,54,74,0.18),0_0_0_1px_rgba(89,113,134,0.15)] backdrop-blur"
        >
          {LANGUAGES.map((language) => (
            <button
              key={language.locale}
              type="button"
              aria-pressed={language.locale === locale}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors duration-300 hover:bg-accent-soft${language.locale === locale ? ' bg-accent-soft text-ink' : ' text-muted'}`}
              onClick={() => {
                setOpen(false);
                if (language.locale !== locale) setLocale(language.locale);
              }}
            >
              <Icon src={language.icon} type="country" title={t(language.labelKey)} className="h-4 w-4" />
              <span>{t(language.labelKey)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
