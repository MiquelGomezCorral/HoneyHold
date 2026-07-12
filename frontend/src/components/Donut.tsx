import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { money } from '../lib/format.js';
import EmptyState from './EmptyState.js';
import type { DonutSlice } from '../types.js';

const BLUES = ['#1F6FAE', '#5D97C4', '#93BEDC', '#2E4E68', '#7FA6C1', '#C6DDEE', '#B3CCDE'];

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
                <Cell key={entry.label} fill={BLUES[i % BLUES.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => money(v)} separator=" · " />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="list-none m-0 p-0">
        {slices.map((entry, i) => (
          <li key={entry.label} className="flex justify-between gap-[14px] py-[7px] border-b border-hairline text-sm last:border-b-0">
            <span>
              <i className="inline-block w-[10px] h-[10px] rounded-[3px] mr-[9px]" style={{ background: BLUES[i % BLUES.length] }} />
              {entry.label}
            </span>
            <span className="tabular-nums">{money(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
