export const BG_COLORS = {
  Blue: 'bg-paper-blue',
  Green: 'bg-paper-green',
  Red: 'bg-paper-red',
  Yellow: 'bg-paper-yellow',
} as const;

export const CHART_COLORS = {
  accent: '#1f6fae',
  hairline: '#d3e2ee',
  blues: ['#1F6FAE', '#5D97C4', '#93BEDC', '#2E4E68', '#7FA6C1', '#C6DDEE', '#B3CCDE'],
} as const;

export type BgColor = keyof typeof BG_COLORS;
