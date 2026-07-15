import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LabelList } from 'recharts';
import { useFetch } from '../hooks/useFetch.js';
import { useProfile } from '../context/ProfileContext.js';
import { money } from '../lib/format.js';
import { CHART_COLORS } from '../lib/theme.js';
import { useI18n } from '../i18n.js';
import EmptyState from './EmptyState.js';

interface BalancePoint {
  year: number;
  month: number;
  balance: number;
  net: number;
  expected: number;
}

export default function BalanceChart() {
  const { profileId, version } = useProfile();
  const { t, tl } = useI18n();

  const { data, error } = useFetch<BalancePoint[]>(
    profileId ? `/profiles/${profileId}/balance-series` : null,
    [profileId, version]
  );

  if (error) return <EmptyState className="text-neg">{t('chart.loadError', { error })}</EmptyState>;
  if (!data) return <EmptyState>{t('common.loading')}</EmptyState>;

  const months = tl('chart.months');
  const series = data.map((point) => ({
    ...point,
    label: `${months[point.month - 1]} '${String(point.year).slice(-2)}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <AreaChart accessibilityLayer data={series} margin={{ top: 24, right: 24, bottom: 24, left: 16 }}>
        <CartesianGrid stroke={CHART_COLORS.hairline} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={{ stroke: CHART_COLORS.hairline }} tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} />
        <YAxis
          width={72}
          tickLine={false}
          tickMargin={20}
          axisLine={false}
          tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
          tickFormatter={(v: number) => money(v)}
        />
        <Tooltip
          formatter={(value: number, name: string) => [money(value), name]}
          itemSorter={(item) => -Number(item.value)}
          separator=" · "
          contentStyle={{ background: CHART_COLORS.surface, border: `1px solid ${CHART_COLORS.hairline}`, borderRadius: 8 }}
          itemStyle={{ color: CHART_COLORS.ink }}
          labelStyle={{ color: CHART_COLORS.muted }}
        />
        <Legend wrapperStyle={{ color: CHART_COLORS.muted, fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="balance"
          name={t('chart.balance')}
          stroke={CHART_COLORS.balance}
          strokeWidth={2}
          fill={CHART_COLORS.balance}
          fillOpacity={1}
          dot={false}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        >
          <LabelList dataKey="balance" position="top" fill={CHART_COLORS.balance} fontSize={10} formatter={money} stroke="rgba(255, 255, 255, 0.55)" strokeWidth={1.5} paintOrder="stroke" />
        </Area>
        <Area
          type="monotone"
          dataKey="expected"
          name={t('chart.expected')}
          stroke={CHART_COLORS.blue}
          strokeWidth={2}
          strokeDasharray="6 5"
          fill={CHART_COLORS.blue}
          fillOpacity={0.3}
          dot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="net"
          name={t('chart.monthlyNet')}
          stroke={CHART_COLORS.net}
          strokeWidth={1.5}
          strokeOpacity={0.8}
          fill={CHART_COLORS.net}
          fillOpacity={0.3}
          dot={false}
          isAnimationActive={false}
        >
          <LabelList dataKey="net" position="bottom" fill={CHART_COLORS.net} fontSize={10} formatter={money} stroke="rgba(255, 255, 255, 0.55)" strokeWidth={1.5} paintOrder="stroke" />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}
