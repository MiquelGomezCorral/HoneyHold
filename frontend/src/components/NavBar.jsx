import { NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import ProfileSwitcher from './ProfileSwitcher.jsx';

export default function NavBar({ onAdd }) {
  const { profileId, version } = useProfile();
  const { data: inbox } = useFetch(
    profileId ? `/profiles/${profileId}/inbox/count` : null,
    [profileId, version]
  );

  const tab = ({ isActive }) => `tab${isActive ? ' active' : ''}`;

  return (
    <header className="topbar">
      <span className="wordmark">
        hucha<span className="dot">.</span>
      </span>
      <nav className="tabs" aria-label="Main">
        <NavLink to="/" end className={tab}>
          Overview
        </NavLink>
        <NavLink to="/transactions" className={tab}>
          Transactions
        </NavLink>
        <NavLink to="/inbox" className={tab}>
          Inbox
          {inbox?.count > 0 && <span className="badge">{inbox.count}</span>}
        </NavLink>
      </nav>
      <span className="spacer" />
      <ProfileSwitcher />
      <button type="button" className="btn" onClick={onAdd}>
        Add entry
      </button>
    </header>
  );
}
