import { useState } from 'react';
import cn from 'classnames';
import { NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.js';
import { useFetch } from '../hooks/useFetch.js';
import { VERSION } from '../lib/config.js';
import { useI18n } from '../i18n.js';
import Modal from './Modal.js';
import ProfileSwitcher from './ProfileSwitcher.js';
import Button from './Button.js';
import Icon from './Icon.js';
import LanguageChanger from './LanguageChanger.js';
import type { Locale } from '../i18n.js';

interface Props {
  locale: Locale;
  onAdd: () => void;
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
        <button className="flex items-center gap-2 cursor-pointer transition-[transform] duration-300 active:duration-75 active:scale-95" onClick={() => setAboutOpen(true)}>
          <Icon type="color" src="bee-blue" title="HoneyHold" className="h-7 w-auto" />
          <span className="font-display font-semibold text-xl tracking-[-0.02em]">
            HoneyHold
            <span className="text-accent">.</span>
          </span>
        </button>
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
        </Modal>
      )}
    </>
  );
}
