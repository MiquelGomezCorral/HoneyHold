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

  if (error) return <p className="text-neg text-sm">{`Couldn't load the dashboard: ${error}`}</p>;
  if (!data) return <p className="text-muted text-sm">{loading ? 'Adding things up…' : ''}</p>;

  const { accounts, totalBalance, month, fixedVsVariable, byTag, goals } = data;

  return (
    <>
      <div className="flex items-center justify-between gap-4 pt-[22px]">
        <PeriodNav year={period.year} month={period.month} onChange={setPeriod} />
      </div>

      <section className="mt-12 border-t border-hairline pt-[14px]">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 className="m-0 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">Balance</h2>
          <span className="text-xs text-muted">All accounts, all time</span>
        </div>
        <div className="grid grid-cols-[1.1fr_1fr] gap-14 items-start max-lg:grid-cols-1 max-lg:gap-7">
          <p className={`m-0 font-display font-semibold text-[64px] leading-[1.05] tracking-tight tabular-nums${totalBalance < 0 ? ' text-neg' : ''}`}>
            {money(totalBalance)}
          </p>
          <ul className="list-none mt-1 p-0">
            {accounts.map((a) => (
              <li key={a.id} className="flex justify-between items-baseline gap-4 py-[9px] border-b border-hairline last:border-b-0">
                <span>
                  {a.name}
                  <span className="ml-2 text-xs text-muted">{a.kind}</span>
                </span>
                <span className="font-semibold whitespace-nowrap tabular-nums">{money(a.balance)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 border-t border-hairline pt-[14px]">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 className="m-0 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">This month</h2>
        </div>
        <div className="flex gap-16 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Income</span>
            <span className="text-[26px] font-semibold tabular-nums text-accent">{money(month.income)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Expenses</span>
            <span className="text-[26px] font-semibold tabular-nums">{money(month.expense)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Net</span>
            <span className={`text-[26px] font-semibold tabular-nums${month.net >= 0 ? ' text-accent' : ' text-neg'}`}>{money(month.net)}</span>
          </div>
        </div>
      </section>

      <section className="mt-12 border-t border-hairline pt-[14px]">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 className="m-0 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">Where it goes</h2>
        </div>
        <div className="grid grid-cols-2 gap-14 max-lg:grid-cols-1 max-lg:gap-7">
          <div>
            <h3 className="m-0 mb-2 text-sm font-semibold">Fixed vs. variable</h3>
            <Donut data={fixedVsVariable} emptyNote="No expenses this month yet." />
          </div>
          <div>
            <h3 className="m-0 mb-2 text-sm font-semibold">Spending by tag</h3>
            <Donut data={byTag} emptyNote="Add an expense to see the breakdown." />
          </div>
        </div>
      </section>

      <section className="mt-12 border-t border-hairline pt-[14px]">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 className="m-0 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">Goals</h2>
          <span className="text-xs text-muted">{period.year}</span>
        </div>
        <GoalsPanel goals={goals} year={period.year} />
      </section>
    </>
  );
}
