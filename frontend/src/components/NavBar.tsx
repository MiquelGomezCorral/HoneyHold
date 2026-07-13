import { NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.js';
import { useFetch } from '../hooks/useFetch.js';
import { useState } from 'react';
import { VERSION } from '../lib/config.js';
import Modal from './Modal.js';
import ProfileSwitcher from './ProfileSwitcher.js';
import Button from './Button.js';
import Icon from './Icon.js';

interface Props {
  onAdd: () => void;
}

export default function NavBar({ onAdd }: Props) {
  const { profileId, version } = useProfile();
  const { data: inbox } = useFetch<{ count: number }>(
    profileId ? `/profiles/${profileId}/inbox/count` : null,
    [profileId, version]
  );
  const [aboutOpen, setAboutOpen] = useState(false);

  function tab({ isActive }: { isActive: boolean }) {
    return `px-3 py-[7px] rounded-lg text-muted font-medium no-underline transition-[color,background-color,transform] duration-150 active:duration-75 active:scale-95 hover:text-ink${isActive ? ' text-ink bg-accent-soft' : ''}`;
  }

  return (
    <>
    <header className="sticky top-0 z-10 flex items-center gap-7 h-16 px-8 border-hairline backdrop-blur-md border-b-2">
      <button className="flex items-center gap-2 cursor-pointer transition-[transform] duration-150 active:duration-75 active:scale-95" onClick={() => setAboutOpen(true)}>
        <Icon type="color" src="bee-blue" title="HoneyHold" className="h-[1.7em] w-auto" />
        <span className="font-display font-semibold text-xl tracking-[-0.02em]">
          HoneyHold
          <span className="text-accent">.</span>
        </span>
      </button>
      <nav className="flex gap-1" aria-label="Main">
        <NavLink to="/" end className={tab}>
          Overview
        </NavLink>
        <NavLink to="/monthly" className={tab}>
          Monthly
        </NavLink>
        <NavLink to="/transactions" className={tab}>
          Transactions
        </NavLink>
        <NavLink to="/inbox" className={tab}>
          Inbox
          {inbox != null && inbox.count > 0 && (
            <span className="inline-block min-w-[18px] ml-[7px] px-[6px] py-[1px] rounded-full bg-accent text-white text-xs font-semibold text-center">
              {inbox.count}
            </span>
          )}
        </NavLink>
      </nav>
      <span className="flex-1" />
      <ProfileSwitcher />
      <Button onClick={onAdd}>
        Add entry
      </Button>

    </header>
      {aboutOpen && (
      <Modal title={"About HoneyHold" + ` (${VERSION})`} onClose={() => setAboutOpen(false)}>
        <p className="text-sm text-muted mb-4">
          Personal finance ledger — track income, expenses, and transfers across multiple profiles. <br />
        </p>
        <dl className="text-sm space-y-2">
          <dt className="font-semibold">Stack</dt>
          <dd className="text-muted ml-0">React 18 + TypeScript + Tailwind + MySQL 8.4</dd>
          <dt className="font-semibold">Design</dt>
          <dd className="text-muted ml-0">Local-first, no auth, multi-profile</dd>
        </dl>
      </Modal>
    )}
    </>
  );
}
