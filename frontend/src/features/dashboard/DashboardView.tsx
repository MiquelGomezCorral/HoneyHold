import { useState } from 'react';
import PeriodNav from '../../components/PeriodNav.js';
import Donut from '../../components/Donut.js';
import Section from '../../components/Section.js';
import GoalsPanel from './GoalsPanel.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { currentPeriod, money } from '../../lib/format.js';
import type { DashboardData } from '../../types.js';

export default function DashboardView() {
  const { profileId, version } = useProfile();
  const [period, setPeriod] = useState(currentPeriod);

  const { data, loading, error } = useFetch<DashboardData>(
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

      <Section title="Balance" summary="All accounts, all time">
        <div className="grid grid-cols-[1.1fr_1fr] gap-14 items-start max-lg:grid-cols-1 max-lg:gap-7">
          <p className={`m-0 font-display font-semibold text-6xl leading-[1.05] tracking-[-0.02em] tabular-nums${totalBalance < 0 ? ' text-neg' : ''}`}>
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
      </Section>

      <Section title="This month">
        <div className="flex gap-16 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Income</span>
            <span className="text-2xl font-semibold tabular-nums text-accent">{money(month.income)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Expenses</span>
            <span className="text-2xl font-semibold tabular-nums">{money(month.expense)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Net</span>
            <span className={`text-2xl font-semibold tabular-nums${month.net >= 0 ? ' text-accent' : ' text-neg'}`}>{money(month.net)}</span>
          </div>
        </div>
      </Section>

      <Section title="Where it goes">
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
      </Section>

      <Section title="Goals" summary={period.year}>
        <GoalsPanel goals={goals} year={period.year} />
      </Section>
    </>
  );
}
