import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useFetch } from '../hooks/useFetch.js';
import { useProfile } from '../context/ProfileContext.js';
import { money } from '../lib/format.js';
import { CHART_COLORS } from '../lib/theme.js';
import { useI18n } from '../i18n.js';
import EmptyState from './EmptyState.js';

interface BalancePoint {
  month: number;
  balance: number;
}

interface Props {
  year: number;
}

export default function BalanceChart({ year }: Props) {
  const { profileId, version } = useProfile();
  const { t, tl } = useI18n();

  const { data, error } = useFetch<BalancePoint[]>(
    profileId ? `/profiles/${profileId}/balance-series?year=${year}` : null,
    [profileId, year, version]
  );

  if (error) return <EmptyState className="text-neg">{t('chart.loadError', { error })}</EmptyState>;
  if (!data) return <EmptyState>{t('common.loading')}</EmptyState>;

  const months = tl('chart.months');
  const series = data.map((p) => ({ label: months[p.month - 1], balance: p.balance }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={CHART_COLORS.hairline} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: CHART_COLORS.hairline }} tick={{ fontSize: 12 }} />
        <YAxis
          width={72}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickFormatter={(v: number) => money(v)}
        />
        <Tooltip
          formatter={(v: number) => [money(v), t('chart.balance')]}
          labelFormatter={(label) => `${label} ${year}`}
          separator=" · "
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke={CHART_COLORS.accent}
          strokeWidth={2}
          dot={{ r: 3, fill: CHART_COLORS.accent }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
