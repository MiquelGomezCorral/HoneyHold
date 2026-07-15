import cn from 'classnames';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'close' | 'danger' | 'danger-active' | 'link' | 'outline' | 'nav';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'font-semibold text-xs rounded-lg disabled:opacity-45 disabled:cursor-not-allowed',
  md: 'font-semibold text-sm rounded-lg disabled:opacity-45 disabled:cursor-not-allowed',
  lg: 'font-semibold text-base rounded-xl disabled:opacity-45 disabled:cursor-not-allowed',
};

const PAD_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2 py-1',
  md: 'px-3 py-2',
  lg: 'px-4 py-4',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-0 bg-accent text-white hover:bg-accent-deep disabled:bg-accent disabled:text-white',
  ghost: 'bg-transparent text-accent border border-hairline hover:bg-accent-soft disabled:bg-transparent disabled:text-accent',
  outline: 'bg-transparent text-ink border border-hairline hover:bg-accent-soft hover:border-accent disabled:bg-transparent disabled:text-ink disabled:border-hairline',
  close: 'border-0 bg-transparent text-muted hover:text-ink hover:bg-accent-soft disabled:bg-transparent disabled:text-muted',
  danger: 'border-0 bg-transparent text-muted hover:bg-paper-red hover:text-neg disabled:bg-transparent disabled:text-muted',
  'danger-active': 'bg-transparent text-neg border border-neg/20 hover:bg-paper-red disabled:bg-transparent disabled:text-neg disabled:border-hairline',
  link: 'border-0 bg-transparent p-0 text-accent font-medium text-xs underline underline-offset-[3px] decoration-hairline hover:decoration-accent disabled:opacity-45 disabled:cursor-not-allowed disabled:decoration-hairline',
  nav: 'h-8 w-8 border border-hairline bg-transparent text-muted rounded-lg text-base leading-none hover:text-ink hover:bg-accent-soft disabled:opacity-45 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isSized = variant !== 'nav' && variant !== 'link';
  const classes = cn(
    'cursor-pointer transition-[color,background-color,border-color,transform] duration-300 active:duration-75 active:scale-95 disabled:active:scale-100 inline-flex items-center justify-center',
    {
      [SIZE_CLASSES[size]]: isSized,
      [PAD_CLASSES[size]]: isSized,
    },
    VARIANT_CLASSES[variant],
    className
  );

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
