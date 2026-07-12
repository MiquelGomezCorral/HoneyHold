import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'close' | 'danger' | 'danger-active' | 'link' | 'outline' | 'nav';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  square?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'font-semibold text-xs rounded-lg disabled:opacity-45 disabled:cursor-not-allowed',
  md: 'font-semibold text-sm rounded-lg disabled:opacity-45 disabled:cursor-not-allowed',
  lg: 'font-semibold text-base rounded-xl disabled:opacity-45 disabled:cursor-not-allowed',
};

const PAD_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2 py-1.5',
  md: 'px-3 py-2',
  lg: 'px-4 py-4',
};

const SQUARE_CLASSES: Record<ButtonSize, string> = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-4',
};

const VARIANT_CLASSES: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: {
    sm: `${SIZE_CLASSES.sm} border-0 bg-accent text-white hover:bg-accent-deep disabled:bg-accent disabled:text-white`,
    md: `${SIZE_CLASSES.md} border-0 bg-accent text-white hover:bg-accent-deep disabled:bg-accent disabled:text-white`,
    lg: `${SIZE_CLASSES.lg} border-0 bg-accent text-white hover:bg-accent-deep disabled:bg-accent disabled:text-white`,
  },
  ghost: {
    sm: `${SIZE_CLASSES.sm} bg-transparent text-accent border border-hairline hover:bg-accent-soft disabled:bg-transparent disabled:text-accent`,
    md: `${SIZE_CLASSES.md} bg-transparent text-accent border border-hairline hover:bg-accent-soft disabled:bg-transparent disabled:text-accent`,
    lg: `${SIZE_CLASSES.lg} bg-transparent text-accent border border-hairline hover:bg-accent-soft disabled:bg-transparent disabled:text-accent`,
  },
  outline: {
    sm: `${SIZE_CLASSES.sm} bg-transparent text-ink border border-hairline hover:bg-accent-soft hover:border-accent disabled:bg-transparent disabled:text-ink disabled:border-hairline`,
    md: `${SIZE_CLASSES.md} bg-transparent text-ink border border-hairline hover:bg-accent-soft hover:border-accent disabled:bg-transparent disabled:text-ink disabled:border-hairline`,
    lg: `${SIZE_CLASSES.lg} bg-transparent text-ink border border-hairline hover:bg-accent-soft hover:border-accent disabled:bg-transparent disabled:text-ink disabled:border-hairline`,
  },
  close: {
    sm: `${SIZE_CLASSES.sm} border-0 bg-none text-muted hover:text-ink hover:bg-accent-soft disabled:bg-none disabled:text-muted`,
    md: `${SIZE_CLASSES.md} border-0 bg-none text-muted hover:text-ink hover:bg-accent-soft disabled:bg-none disabled:text-muted`,
    lg: `${SIZE_CLASSES.lg} border-0 bg-none text-muted hover:text-ink hover:bg-accent-soft disabled:bg-none disabled:text-muted`,
  },
  danger: {
    sm: `${SIZE_CLASSES.sm} border-0 bg-none text-muted hover:bg-paper-red hover:text-neg disabled:bg-none disabled:text-muted`,
    md: `${SIZE_CLASSES.md} border-0 bg-none text-muted hover:bg-paper-red hover:text-neg disabled:bg-none disabled:text-muted`,
    lg: `${SIZE_CLASSES.lg} border-0 bg-none text-muted hover:bg-paper-red hover:text-neg disabled:bg-none disabled:text-muted`,
  },
  'danger-active': {
    sm: `${SIZE_CLASSES.sm} bg-none text-neg border border-hairline hover:bg-paper-red disabled:bg-none disabled:text-neg disabled:border-hairline`,
    md: `${SIZE_CLASSES.md} bg-none text-neg border border-hairline hover:bg-paper-red disabled:bg-none disabled:text-neg disabled:border-hairline`,
    lg: `${SIZE_CLASSES.lg} bg-none text-neg border border-hairline hover:bg-paper-red disabled:bg-none disabled:text-neg disabled:border-hairline`,
  },
  link: {
    sm: 'border-0 bg-none p-0 text-accent font-medium text-xs underline underline-offset-[3px] decoration-hairline hover:decoration-accent disabled:opacity-45 disabled:cursor-not-allowed disabled:decoration-hairline',
    md: 'border-0 bg-none p-0 text-accent font-medium text-xs underline underline-offset-[3px] decoration-hairline hover:decoration-accent disabled:opacity-45 disabled:cursor-not-allowed disabled:decoration-hairline',
    lg: 'border-0 bg-none p-0 text-accent font-medium text-xs underline underline-offset-[3px] decoration-hairline hover:decoration-accent disabled:opacity-45 disabled:cursor-not-allowed disabled:decoration-hairline',
  },
  nav: {
    sm: 'border border-hairline bg-transparent text-muted w-[30px] h-[30px] rounded-lg text-base leading-none hover:text-ink hover:bg-accent-soft disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted',
    md: 'border border-hairline bg-transparent text-muted w-[30px] h-[30px] rounded-lg text-base leading-none hover:text-ink hover:bg-accent-soft disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted',
    lg: 'border border-hairline bg-transparent text-muted w-[30px] h-[30px] rounded-lg text-base leading-none hover:text-ink hover:bg-accent-soft disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted',
  },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  square = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isSized = !['nav', 'link'].includes(variant);
  const padClass = isSized ? (square ? SQUARE_CLASSES[size] : PAD_CLASSES[size]) : '';
  const classes = `cursor-pointer transition-colors inline-flex items-center justify-center ${padClass} ${VARIANT_CLASSES[variant][size]}`;
  const final = className ? `${classes} ${className}` : classes;

  return (
    <button type={type} className={final} {...rest}>
      {children}
    </button>
  );
}
