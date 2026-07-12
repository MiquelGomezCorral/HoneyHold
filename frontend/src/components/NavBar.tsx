import { NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.js';
import { useFetch } from '../hooks/useFetch.js';
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

  const tab = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-[7px] rounded-lg text-muted font-medium no-underline transition-colors hover:text-ink${isActive ? ' text-ink bg-accent-soft' : ''}`;

  return (
    <header className="sticky top-0 z-10 flex items-center gap-7 h-16 px-8 bg-paper-blue border-b border-hairline">
      <div className="flex items-center gap-2">
        <Icon type="color" src="bee-blue" title="HoneyHold" className="h-[1.7em] w-auto" />
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
      <Button onClick={onAdd}>
        Add entry
      </Button>
    </header>
  );
}
