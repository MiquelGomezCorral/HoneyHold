import cn from 'classnames';
import { useState } from 'react';
import PeriodNav from '../../components/PeriodNav.js';
import PieChartDisplay from '../../components/PieChartDisplay.js';
import Section from '../../components/Section.js';
import GoalsPanel from '../dashboard/GoalsPanel.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useI18n } from '../../i18n.js';
import { currentPeriod, money } from '../../lib/format.js';
import type { DashboardData } from '../../types.js';
import { Separator } from '../../components/Sepatator.js';

export default function MonthlyView() {
  const { profileId, version } = useProfile();
  const { t } = useI18n();
  const [period, setPeriod] = useState(currentPeriod);

  const { data, loading, error } = useFetch<DashboardData>(
    `/profiles/${profileId}/dashboard?year=${period.year}&month=${period.month}`,
    [profileId, period.year, period.month, version]
  );

  if (error) return <p className="text-neg text-sm">{t('dashboard.loadError', { error })}</p>;
  if (!data) return <p className="text-muted text-sm">{loading ? t('common.loading') : ''}</p>;

  const { month, fixedVsVariable, byTag, goals } = data;

  return (
    <>
      <div className="flex items-center justify-between gap-4 pt-[22px]">
        <PeriodNav year={period.year} month={period.month} onChange={setPeriod} />
      </div>

      <Section title={t('monthly.thisMonth')} hideBorder>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{t('monthly.net')}</span>
          <p className={cn('m-0 text-left font-display font-semibold text-6xl leading-[1.05] tracking-[-0.02em] tabular-nums', {
            'text-accent': month.net >= 0,
            'text-neg': month.net < 0,
          })}>
            {money(month.net)}
          </p>
        </div>
        <div className="flex gap-16 flex-wrap mt-7">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t('common.income')}</span>
            <span className="text-2xl font-semibold tabular-nums text-accent">{money(month.income)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t('common.expenses')}</span>
            <span className="text-2xl font-semibold tabular-nums">{money(month.expense)}</span>
          </div>
        </div>
      </Section>

      <Section title={t('monthly.whereItGoes')}>
        <div className="flex w-full gap-14 max-lg:flex-col max-lg:gap-7">
          <div className="w-full">
            <h3 className="m-0 mb-2 text-sm font-semibold">{t('monthly.fixedVsVariable')}</h3>
            <PieChartDisplay data={fixedVsVariable} emptyNote={t('monthly.noExpenses')} />
          </div>
          
          <Separator direction="vertical"/>

          <div className="w-full">
            <h3 className="m-0 mb-2 text-sm font-semibold">{t('monthly.spendingByTag')}</h3>
            <PieChartDisplay data={byTag} emptyNote={t('monthly.addExpenseBreakdown')} />
          </div>
        </div>
      </Section>

      <Section title={t('dashboard.goals')} summary={period.year}>
        <GoalsPanel goals={goals} year={period.year} show={['monthly']} />
      </Section>
    </>
  );
}
