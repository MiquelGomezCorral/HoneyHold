export const BG_COLORS = {
  Blue: 'bg-paper-blue',
  Green: 'bg-paper-green',
  Red: 'bg-paper-red',
  Yellow: 'bg-paper-yellow',
} as const;

export type BgColor = keyof typeof BG_COLORS;
