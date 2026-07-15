export const BG_COLORS = {
  Blue: 'bg-paper-blue',
  Green: 'bg-paper-green',
  Red: 'bg-paper-red',
  Yellow: 'bg-paper-yellow',
} as const;

export const CHART_COLORS = {
  accent: 'rgb(var(--accent))',
  hairline: 'rgb(var(--hairline))',
  ink: 'rgb(var(--ink))',
  muted: 'rgb(var(--muted))',
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
