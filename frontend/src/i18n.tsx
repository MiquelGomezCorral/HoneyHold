import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import en from './locales/en.json';
import es from './locales/es.json';

export const locales = ['en', 'es'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

const STORAGE_KEY = 'HoneyHold.locale';
const messages: Record<Locale, Record<string, unknown>> = { en, es };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  tl: (key: string) => string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'es';
}

export function localeFromPathname(pathname: string): Locale | null {
  const locale = pathname.split('/')[1];
  return isLocale(locale) ? locale : null;
}

export function stripLocalePath(pathname: string) {
  const parts = pathname.split('/');
  if (!isLocale(parts[1])) return pathname || '/';
  const rest = parts.slice(2).join('/');
  return rest ? `/${rest}` : '/';
}

export function withLocalePath(locale: Locale, pathname: string) {
  const path = stripLocalePath(pathname);
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

export function getPreferredLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isLocale(saved)) return saved;

  const browserLocale = navigator.language.slice(0, 2);
  return isLocale(browserLocale) ? browserLocale : defaultLocale;
}

function message(locale: Locale, key: string) {
  let value: unknown = messages[locale];
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : null;
}

function messageList(locale: Locale, key: string) {
  let value: unknown = messages[locale];
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    value = (value as Record<string, unknown>)[part];
  }
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : null;
}

interface I18nProviderProps {
  children: ReactNode;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export function I18nProvider({ children, locale, onLocaleChange }: I18nProviderProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  function t(key: string, values?: Record<string, string | number>) {
    const text = message(locale, key) ?? message(defaultLocale, key) ?? key;
    if (!values) return text;
    return Object.entries(values).reduce((result, [name, value]) => result.split(`{${name}}`).join(String(value)), text);
  }

  function tl(key: string) {
    return messageList(locale, key) ?? messageList(defaultLocale, key) ?? [];
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale: onLocaleChange, t, tl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
