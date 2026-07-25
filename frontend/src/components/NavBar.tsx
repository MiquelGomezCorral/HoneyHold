import { useState } from 'react';
import cn from 'classnames';
import { NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.js';
import { useFetch } from '../hooks/useFetch.js';
import { VERSION, LATEST_RELEASE } from '../lib/config.js';
import type { ReleaseNote } from '../lib/config.js';
import { useI18n } from '../i18n.js';
import Modal from './Modal.js';
import ProfileSwitcher from './ProfileSwitcher.js';
import Button from './Button.js';
import LanguageChanger from './LanguageChanger.js';
import ThemeToggle from './ThemeToggle.js';
import type { Locale } from '../i18n.js';
import HoneyHoldLogo from './HoneyHoldLogo.js';

interface Props {
  locale: Locale;
  onAdd: () => void;
}

// Group the latest release's notes by their changelog section, preserving order.
const RELEASE_SECTIONS = LATEST_RELEASE.notes.reduce<{ section: string; notes: ReleaseNote[] }[]>(
  (groups, note) => {
    const group = groups.find((g) => g.section === note.section);
    if (group) group.notes.push(note);
    else groups.push({ section: note.section, notes: [note] });
    return groups;
  },
  []
);

// Format an ISO calendar date (YYYY-MM-DD) in the active locale, avoiding the
// UTC-parsing off-by-one by building a local Date from the parts.
function formatReleaseDate(iso: string, locale: Locale) {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function NavBar({ locale, onAdd }: Props) {
  const { profileId, version } = useProfile();
  const { t } = useI18n();
  const { data: inbox } = useFetch<{ count: number }>(
    profileId ? `/profiles/${profileId}/inbox/count` : null,
    [profileId, version]
  );
  const [aboutOpen, setAboutOpen] = useState(false);

  function tab({ isActive }: { isActive: boolean }) {
    return cn(
      'px-3 py-2 rounded-lg text-muted font-medium no-underline transition-[color,background-color,transform] duration-300 active:duration-75 active:scale-95 hover:text-ink',
      { 'text-ink bg-accent-soft': isActive }
    );
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-7 h-16 px-8 border-hairline backdrop-blur-md border-b-2">
        <HoneyHoldLogo setAboutOpen={setAboutOpen} />
        <nav className="flex gap-1" aria-label={t('nav.main')}>
          <NavLink to={`/${locale}`} end className={tab}>
          {t('nav.overview')}
        </NavLink>
        <NavLink to={`/${locale}/monthly`} className={tab}>
          {t('nav.monthly')}
        </NavLink>
        <NavLink to={`/${locale}/transactions`} className={tab}>
          {t('nav.transactions')}
        </NavLink>
        <NavLink to={`/${locale}/inbox`} className={tab}>
            {t('nav.inbox')}
            {inbox != null && inbox.count > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-center text-xs font-semibold text-white">
                {inbox.count}
              </span>
            )}
          </NavLink>
        </nav>
        <span className="flex-1" />
        <LanguageChanger />
        <ThemeToggle />
        <ProfileSwitcher />
        <Button onClick={onAdd}>
          {t('common.addEntry')}
        </Button>
      </header>
      {aboutOpen && (
        <Modal title={t('about.title', { version: VERSION })} onClose={() => setAboutOpen(false)}>
          <p className="text-sm text-muted mb-4">
            {t('about.body')} <br />
          </p>
          <dl className="text-sm space-y-2">
            <dt className="font-semibold">{t('about.stack')}</dt>
            <dd className="text-muted ml-0">{t('about.stackValue')}</dd>
            <dt className="font-semibold">{t('about.design')}</dt>
            <dd className="text-muted ml-0">{t('about.designValue')}</dd>
          </dl>
          <section className="mt-5 pt-4 border-t border-hairline">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="m-0 text-sm font-semibold">
                {t('about.whatsNew', { version: LATEST_RELEASE.version })}
              </h3>
              <span className="text-xs text-muted whitespace-nowrap">
                {formatReleaseDate(LATEST_RELEASE.date, locale)}
              </span>
            </div>
            {RELEASE_SECTIONS.length > 0 ? (
              <div className="mt-2 max-h-44 overflow-y-auto pr-1 space-y-3">
                {RELEASE_SECTIONS.map((group) => {
                  const key = `about.sections.${group.section}`;
                  const label = t(key);
                  return (
                    <div key={group.section}>
                      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
                        {label === key ? group.section : label}
                      </p>
                      <ul className="mt-1 space-y-1 list-none p-0">
                        {group.notes.map((note, i) => (
                          <li key={i} className="flex gap-2 text-sm text-ink">
                            <span aria-hidden className="text-accent leading-5">•</span>
                            <span>{note.summary}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">{t('about.noNotes')}</p>
            )}
            {LATEST_RELEASE.url && (
              <a
                href={LATEST_RELEASE.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-accent no-underline hover:text-accent-deep"
              >
                {t('about.fullChangelog')} →
              </a>
            )}
          </section>
        </Modal>
      )}
    </>
  );
}
