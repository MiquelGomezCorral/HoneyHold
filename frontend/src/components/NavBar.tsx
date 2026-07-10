import { NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.js';
import { useFetch } from '../hooks/useFetch.js';
import ProfileSwitcher from './ProfileSwitcher.js';

interface Props {
  onAdd: () => void;
}

export default function NavBar({ onAdd }: Props) {
  const { profileId, version } = useProfile();
  const { data: inbox } = useFetch<{ count: number }>(
    profileId ? `/profiles/${profileId}/inbox/count` : null,
    [profileId, version]
  );

  const tab = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-[7px] rounded-lg text-muted font-medium no-underline transition-colors hover:text-ink${isActive ? ' text-ink bg-accent-soft' : ''}`;

  return (
    <header className="sticky top-0 z-10 flex items-center gap-7 h-16 px-8 bg-paper border-b border-hairline">
      <div className="flex items-center gap-2">
        <img src="/assets/icons/bee-blue.svg" alt="HoneyHold" className="h-[1.7em] w-auto inline-block align-middle" />
        <span className="font-display font-semibold text-[22px] tracking-[-0.02em]">
          HoneyHold
          <span className="text-accent">.</span>
        </span>
      </div>
      <nav className="flex gap-1" aria-label="Main">
        <NavLink to="/" end className={tab}>
          Overview
        </NavLink>
        <NavLink to="/transactions" className={tab}>
          Transactions
        </NavLink>
        <NavLink to="/inbox" className={tab}>
          Inbox
          {inbox != null && inbox.count > 0 && (
            <span className="inline-block min-w-[18px] ml-[7px] px-[6px] py-[1px] rounded-full bg-accent text-white text-[11px] font-semibold text-center">
              {inbox.count}
            </span>
          )}
        </NavLink>
      </nav>
      <span className="flex-1" />
      <ProfileSwitcher />
      <button type="button" className="border-0 bg-accent text-white px-4 py-[9px] rounded-[9px] font-semibold text-sm cursor-pointer transition-colors hover:bg-accent-deep disabled:opacity-45 disabled:cursor-default" onClick={onAdd}>
        Add entry
      </button>
    </header>
  );
}
