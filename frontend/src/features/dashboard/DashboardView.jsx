import { useState } from 'react';
import PeriodNav from '../../components/PeriodNav.jsx';
import Donut from '../../components/Donut.jsx';
import GoalsPanel from './GoalsPanel.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import { currentPeriod, money } from '../../lib/format.js';

export default function DashboardView() {
  const { profileId, version } = useProfile();
  const [period, setPeriod] = useState(currentPeriod);

  const { data, loading, error } = useFetch(
    `/profiles/${profileId}/dashboard?year=${period.year}&month=${period.month}`,
    [profileId, period.year, period.month, version]
  );

  if (error) return <p className="form-error">Couldn't load the dashboard: {error}</p>;
  if (!data) return <p className="empty">{loading ? 'Adding things up…' : ''}</p>;

  const { accounts, totalBalance, month, fixedVsVariable, byTag, goals } = data;

  return (
    <>
      <div className="page-controls">
        <PeriodNav year={period.year} month={period.month} onChange={setPeriod} />
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="eyebrow">Balance</h2>
          <span className="eyebrow-aside">All accounts, all time</span>
        </div>
        <div className="hero">
          <p className={`balance-figure num${totalBalance < 0 ? ' neg' : ''}`}>{money(totalBalance)}</p>
          <ul className="accounts-list">
            {accounts.map((a) => (
              <li key={a.id} className="acc-row">
                <span>
                  {a.name}
                  <span className="acc-kind">{a.kind}</span>
                </span>
                <span className="acc-balance num">{money(a.balance)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="eyebrow">This month</h2>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="stat-label">Income</span>
            <span className="stat-value num income">{money(month.income)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Expenses</span>
            <span className="stat-value num">{money(month.expense)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Net</span>
            <span className={`stat-value num${month.net >= 0 ? ' income' : ' neg'}`}>{money(month.net)}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="eyebrow">Where it goes</h2>
        </div>
        <div className="charts">
          <div>
            <h3 className="chart-title">Fixed vs. variable</h3>
            <Donut data={fixedVsVariable} emptyNote="No expenses this month yet." />
          </div>
          <div>
            <h3 className="chart-title">Spending by tag</h3>
            <Donut data={byTag} emptyNote="Add an expense to see the breakdown." />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="eyebrow">Goals</h2>
          <span className="eyebrow-aside">{period.year}</span>
        </div>
        <GoalsPanel goals={goals} year={period.year} />
      </section>
    </>
  );
}
