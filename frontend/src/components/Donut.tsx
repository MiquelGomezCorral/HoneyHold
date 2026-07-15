import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { money } from '../lib/format.js';
import { CHART_COLORS } from '../lib/theme.js';
import EmptyState from './EmptyState.js';
import type { DonutSlice } from '../types.js';

interface Props {
  data: DonutSlice[];
  emptyNote: string;
}

export default function Donut({ data, emptyNote }: Props) {
  const slices = data.filter((d) => Number(d.value) > 0);

  if (!slices.length) {
    return <EmptyState>{emptyNote}</EmptyState>;
  }

  return (
    <div className="grid grid-cols-[190px_1fr] gap-5 items-center">
      <div>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {slices.map((entry, i) => (
                <Cell key={entry.label} fill={CHART_COLORS.blues[i % CHART_COLORS.blues.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => money(v)}
              separator=" · "
              contentStyle={{ background: CHART_COLORS.surface, border: `1px solid ${CHART_COLORS.hairline}`, borderRadius: 8 }}
              itemStyle={{ color: CHART_COLORS.ink }}
              labelStyle={{ color: CHART_COLORS.muted }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="list-none m-0 p-0">
        {slices.map((entry, i) => (
          <li key={entry.label} className="flex justify-between gap-3.5 py-2 border-b border-hairline text-sm last:border-b-0">
            <span>
              <i className="inline-block h-2.5 w-2.5 rounded-sm mr-2.5" style={{ background: CHART_COLORS.blues[i % CHART_COLORS.blues.length] }} />
              {entry.label}
            </span>
            <span className="tabular-nums">{money(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
