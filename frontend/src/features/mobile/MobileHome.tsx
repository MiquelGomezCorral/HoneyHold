import cn from 'classnames';
import ProfileSwitcher from '../../components/ProfileSwitcher.js';
import LanguageChanger from '../../components/LanguageChanger.js';
import Button from '../../components/Button.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useI18n } from '../../i18n.js';
import { currentPeriod, money } from '../../lib/format.js';
import type { DashboardData, EntryType } from '../../types.js';

interface Props {
  onAdd: (type: EntryType) => void;
}

export default function MobileHome({ onAdd }: Props) {
  const { profileId, version } = useProfile();
  const { t } = useI18n();
  const { year, month } = currentPeriod();
  const { data } = useFetch<DashboardData>(
    `/profiles/${profileId}/dashboard?year=${year}&month=${month}`,
    [profileId, version]
  );

  return (
    <div className="min-h-dvh flex flex-col p-[18px_20px_calc(20px+env(safe-area-inset-bottom))]">
      <div className="flex justify-between items-center gap-2.5">
        <span className="font-display font-semibold text-xl tracking-[-0.02em]">
          HoneyHold<span className="text-accent">.</span>
        </span>
        <div className="flex items-center gap-2">
          <LanguageChanger mobile />
          <ProfileSwitcher />
        </div>
      </div>

      <div className="mt-[13vh]">
        <span className="m-0 text-xs font-semibold tracking-[0.14em] uppercase text-muted">{t('mobile.totalBalance')}</span>
        <p className={cn('m-0 font-display font-semibold leading-[1.05] tracking-[-0.02em] tabular-nums mt-2', { 'text-neg': data != null && data.totalBalance < 0 })}
          style={{ fontSize: 'clamp(44px, 13vw, 58px)' }}
        >
          {data ? money(data.totalBalance) : '—'}
        </p>
        {data && (
          <p className="mt-3 text-muted text-sm tabular-nums">
            {t('mobile.monthFlow', { income: money(data.month.income), expense: money(data.month.expense) })}
          </p>
        )}
      </div>

      <div className="mt-auto grid gap-3 pt-8">
        <Button variant="ghost" size="lg" onClick={() => onAdd('income')}>
          {t('common.addIncome')}
        </Button>
        <Button variant="outline" size="lg" onClick={() => onAdd('transfer')}>
          {t('common.addTransfer')}
        </Button>
        <Button variant="primary" size="lg" onClick={() => onAdd('expense')}>
          {t('common.addExpense')}
        </Button>
      </div>
    </div>
  );
}
