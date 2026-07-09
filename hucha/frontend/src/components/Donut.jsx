import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { money } from '../lib/format.js';

// Monochrome-blue donut + a ruled legend that doubles as the value list.
const BLUES = ['#1F6FAE', '#5D97C4', '#93BEDC', '#2E4E68', '#7FA6C1', '#C6DDEE', '#B3CCDE'];

export default function Donut({ data, emptyNote }) {
  const slices = data.filter((d) => Number(d.value) > 0);

  if (!slices.length) {
    return <p className="empty">{emptyNote}</p>;
  }

  return (
    <div className="donut-wrap">
      <div className="donut-chart">
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
            <Tooltip formatter={(v) => money(v)} separator=" · " />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="legend">
        {slices.map((entry, i) => (
          <li key={entry.label}>
            <span>
              <i className="swatch" style={{ background: BLUES[i % BLUES.length] }} />
              {entry.label}
            </span>
            <span className="num">{money(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
