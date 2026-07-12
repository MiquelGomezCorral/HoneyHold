import Section from '../../components/Section.js';
import BalanceChart from '../../components/BalanceChart.js';
import GoalsPanel from './GoalsPanel.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { currentPeriod, money } from '../../lib/format.js';
import type { DashboardData } from '../../types.js';

export default function DashboardView() {
  const { profileId, version } = useProfile();
  const period = currentPeriod();

  const { data, loading, error } = useFetch<DashboardData>(
    `/profiles/${profileId}/dashboard?year=${period.year}&month=${period.month}`,
    [profileId, period.year, period.month, version]
  );

  if (error) return <p className="text-neg text-sm">{`Couldn't load the dashboard: ${error}`}</p>;
  if (!data) return <p className="text-muted text-sm">{loading ? 'Adding things up…' : ''}</p>;

  const { accounts, totalBalance, goals } = data;

  return (
    <>
      <Section title="Balance" summary="All accounts, all time" hideBorder>
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

      <Section title={`Balance over ${period.year}`} summary="Cumulative, end of month">
        <BalanceChart year={period.year} />
      </Section>

      <Section title="Goals" summary={period.year}>
        <GoalsPanel goals={goals} year={period.year} show={['annual']} />
      </Section>
    </>
  );
}
