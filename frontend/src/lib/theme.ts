export const BG_COLORS = {
  Blue: 'bg-paper-blue',
  Green: 'bg-paper-green',
  Red: 'bg-paper-red',
  Yellow: 'bg-paper-yellow',
} as const;

export const CHART_COLORS = {
  blue: 'var(--chart-blue-2)',
  balance: 'var(--chart-green)',
  hairline: 'rgb(var(--hairline))',
  ink: 'rgb(var(--ink))',
  labelStroke: 'rgb(var(--chart-label-stroke))',
  muted: 'rgb(var(--muted))',
  net: 'var(--chart-purple)',
  surface: 'rgb(var(--paper-blue-raise))',
  blues: [
    'var(--chart-blue-1)',
    'var(--chart-blue-2)',
    'var(--chart-blue-3)',
    'var(--chart-blue-4)',
    'var(--chart-blue-5)',
    'var(--chart-blue-6)',
    'var(--chart-blue-7)',
  ],
} as const;

export type BgColor = keyof typeof BG_COLORS;
