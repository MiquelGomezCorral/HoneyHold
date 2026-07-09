import ProfileSwitcher from '../../components/ProfileSwitcher.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import { currentPeriod, money } from '../../lib/format.js';

// The whole phone experience: the balance, this month's flow, two buttons.
// Analysis and triage stay on the desktop by design.
export default function MobileHome({ onAdd }) {
  const { profileId, version } = useProfile();
  const { year, month } = currentPeriod();
  const { data } = useFetch(
    `/profiles/${profileId}/dashboard?year=${year}&month=${month}`,
    [profileId, version]
  );

  return (
    <div className="mobile">
      <div className="m-top">
        <span className="wordmark">
          hucha<span className="dot">.</span>
        </span>
        <ProfileSwitcher />
      </div>

      <div className="m-balance">
        <span className="eyebrow">Total balance</span>
        <p className={`balance-figure num${data && data.totalBalance < 0 ? ' neg' : ''}`}>
          {data ? money(data.totalBalance) : '—'}
        </p>
        {data && (
          <p className="m-flow num">
            <span className="income">{money(data.month.income)}</span> in ·{' '}
            <span>{money(data.month.expense)}</span> out this month
          </p>
        )}
      </div>

      <div className="m-actions">
        <button type="button" className="btn quiet big" onClick={() => onAdd('income')}>
          Add income
        </button>
        <button type="button" className="btn big" onClick={() => onAdd('expense')}>
          Add expense
        </button>
      </div>
    </div>
  );
}
