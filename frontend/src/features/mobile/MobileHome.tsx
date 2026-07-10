import ProfileSwitcher from '../../components/ProfileSwitcher.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { currentPeriod, money } from '../../lib/format.js';
import type { DashboardData } from '../../types.js';

interface Props {
  onAdd: (type: 'income' | 'expense') => void;
}

export default function MobileHome({ onAdd }: Props) {
  const { profileId, version } = useProfile();
  const { year, month } = currentPeriod();
  const { data } = useFetch<DashboardData>(
    `/profiles/${profileId}/dashboard?year=${year}&month=${month}`,
    [profileId, version]
  );

  return (
    <div className="min-h-dvh flex flex-col p-[18px_20px_calc(20px+env(safe-area-inset-bottom))]">
      <div className="flex justify-between items-center gap-2.5">
        <span className="font-display font-semibold text-[22px] tracking-[-0.02em]">
          hucha<span className="text-accent">.</span>
        </span>
        <ProfileSwitcher />
      </div>

      <div className="mt-[13vh]">
        <span className="m-0 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">Total balance</span>
        <p className={`m-0 font-display font-semibold leading-[1.05] tracking-[-0.02em] tabular-nums mt-2${data && data.totalBalance < 0 ? ' text-neg' : ''}`}
          style={{ fontSize: 'clamp(44px, 13vw, 58px)' }}
        >
          {data ? money(data.totalBalance) : '—'}
        </p>
        {data && (
          <p className="mt-3 text-muted text-[14.5px] tabular-nums">
            <span className="text-accent">{money(data.month.income)}</span> in ·{' '}
            <span className="text-ink font-semibold">{money(data.month.expense)}</span> out this month
          </p>
        )}
      </div>

      <div className="mt-auto grid gap-3 pt-8">
        <button type="button" className="bg-transparent text-accent px-4 py-[15px] rounded-xl font-semibold text-base cursor-pointer transition-colors border border-hairline hover:bg-accent-soft" onClick={() => onAdd('income')}>
          Add income
        </button>
        <button type="button" className="border-0 bg-accent text-white px-4 py-[15px] rounded-xl font-semibold text-base cursor-pointer transition-colors hover:bg-accent-deep" onClick={() => onAdd('expense')}>
          Add expense
        </button>
      </div>
    </div>
  );
}
