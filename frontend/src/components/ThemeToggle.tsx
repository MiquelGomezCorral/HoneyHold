import { useEffect, useState } from 'react';
import { useI18n } from '../i18n.js';
import Icon from './Icon.js';

const THEME_STORAGE_KEY = document.documentElement.dataset.themeStorageKey;

type ThemeDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

function applyTheme(dark: boolean, explicit = true) {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', explicit && !dark);
  document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')?.setAttribute('content', dark ? 'dark' : 'light');
}

function storedTheme() {
  try {
    const theme = THEME_STORAGE_KEY ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    return theme === 'dark' || theme === 'light' ? theme : null;
  } catch {
    return null;
  }
}

function saveTheme(theme: 'dark' | 'light') {
  try {
    if (THEME_STORAGE_KEY) localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
}

export default function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange(event: MediaQueryListEvent) {
      if (storedTheme()) return;
      applyTheme(event.matches, false);
      setDark(event.matches);
    }
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    saveTheme(nextDark ? 'dark' : 'light');
    const update = () => applyTheme(nextDark);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const themeDocument = document as ThemeDocument;

    if (reducedMotion || !themeDocument.startViewTransition) update();
    else themeDocument.startViewTransition(update);

    setDark(nextDark);
  }

  const label = dark ? t('theme.toggleToLight') : t('theme.toggleToDark');

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-paper-blue-raise/45 transition-[color,background-color,border-color,transform] duration-300 hover:bg-accent-soft active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      <Icon type={dark ? 'white' : 'black'} src={dark ? 'sun-dim-fill' : 'moon-stars-fill'} title="" className="h-4 w-4 transition-transform duration-300" />
    </button>
  );
}
