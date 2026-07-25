import cn from 'classnames';
import { useEffect, useState } from 'react';
import AnnualSummaryTable from '../../components/AnnualSummaryTable.js';
import EmptyState from '../../components/EmptyState.js';
import PieChartDisplay from '../../components/PieChartDisplay.js';
import { Separator } from '../../components/Separator.js';
import SavingsTargetEditor from '../../components/SavingsTargetEditor.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ANNUAL_OVERVIEW } from '../../lib/config.js';
import { categorySlices, money, percent } from '../../lib/format.js';
import { useI18n } from '../../i18n.js';
import type { AnnualSummary } from '../../types.js';

interface Props {
  year: number;
}

function clampTarget(value: number) {
  return Math.max(0, Math.min(1, value));
}

function targetStorageKey(profileId: number | null) {
  return `${ANNUAL_OVERVIEW.savingsRateTargetStoragePrefix}.${profileId}`;
}

export default function AnnualOverview({ year }: Props) {
  const { profileId, version } = useProfile();
  const { showToast } = useToast();
  const { t, tl } = useI18n();
  const [target, setTarget] = useState<number>(ANNUAL_OVERVIEW.defaultSavingsRateTarget);
  const { data, loading, error } = useFetch<AnnualSummary>(
    profileId ? `/profiles/${profileId}/annual-summary?year=${year}` : null,
    [profileId, year, version]
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(targetStorageKey(profileId));
      const saved = stored == null ? Number.NaN : Number(stored);
      setTarget(Number.isFinite(saved) ? clampTarget(saved) : ANNUAL_OVERVIEW.defaultSavingsRateTarget);
    } catch {
      setTarget(ANNUAL_OVERVIEW.defaultSavingsRateTarget);
    }
  }, [profileId]);

  function saveTarget(nextTarget: number) {
    const value = clampTarget(nextTarget);
    setTarget(value);
    try { localStorage.setItem(targetStorageKey(profileId), String(value)); } catch {}
    showToast(t('toast.goalSaved'), 'success');
  }

  if (error) return <EmptyState className="text-neg">{t('annual.loadError', { error })}</EmptyState>;
  if (!data) return <EmptyState>{loading ? t('common.loading') : ''}</EmptyState>;

  const months = tl('chart.months');
  const dataMonths = data.months.filter((month) => month.hasData);
  const flowMonths = data.months.filter((month) => month.hasFlow);
  const metCount = flowMonths.filter((month) => month.savingsRate != null && month.savingsRate >= target).length;
  const contributionSlices = data.months
    .filter((month) => month.net > 0)
    .map((month) => ({ label: months[month.month - 1], value: month.net }));

  if (!dataMonths.length) return <EmptyState>{t('annual.empty')}</EmptyState>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <Metric label={t('annual.savedThisYear')} value={money(data.totals.net)} accent={data.totals.net >= 0} negative={data.totals.net < 0} />
          <Metric label={t('annual.avgRate')} value={percent(data.totals.savingsRate)} />
          <Metric label={t('annual.monthsMet')} value={flowMonths.length ? `${metCount} / ${flowMonths.length}` : '—'} />
        </div>
        <SavingsTargetEditor target={target} onSave={saveTarget} />
      </div>

      <AnnualSummaryTable summary={data} target={target} />

      <div className="mt-10 flex w-full gap-14 border-t border-hairline pt-8 max-lg:flex-col max-lg:gap-7">
        <div className="w-full">
          <h3 className="m-0 mb-3 text-sm font-semibold">{t('annual.byCategory')}</h3>
          <PieChartDisplay data={categorySlices(data.byCategory, t('common.untagged'))} emptyNote={t('annual.noExpenses')} />
        </div>
        <Separator direction="vertical" className="max-lg:hidden" />
        <div className="w-full">
          <h3 className="m-0 mb-3 text-sm font-semibold">{t('annual.monthlyContribution')}</h3>
          <PieChartDisplay
            data={contributionSlices}
            emptyNote={t('annual.noSavings')}
            formatValue={(value, total) => percent(value / total)}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent, negative }: { label: string; value: string; accent?: boolean; negative?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className={cn('text-2xl font-semibold tabular-nums', { 'text-accent': accent && !negative, 'text-neg': negative })}>{value}</span>
    </div>
  );
}
