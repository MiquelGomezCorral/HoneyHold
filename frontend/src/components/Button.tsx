import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'close' | 'danger' | 'link' | 'outline' | 'nav';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: {
    sm: 'border-0 bg-accent text-white px-3 py-[6px] rounded-[9px] font-semibold text-xs hover:bg-accent-deep disabled:opacity-45 disabled:cursor-default',
    md: 'border-0 bg-accent text-white px-4 py-[9px] rounded-[9px] font-semibold text-sm hover:bg-accent-deep disabled:opacity-45 disabled:cursor-default',
    lg: 'border-0 bg-accent text-white px-4 py-[15px] rounded-xl font-semibold text-base hover:bg-accent-deep disabled:opacity-45 disabled:cursor-default',
  },
  ghost: {
    sm: 'bg-transparent text-accent px-3 py-[6px] rounded-[9px] font-semibold text-xs border border-hairline hover:bg-accent-soft disabled:opacity-45',
    md: 'bg-transparent text-accent px-4 py-[9px] rounded-[9px] font-semibold text-sm border border-hairline hover:bg-accent-soft disabled:opacity-45',
    lg: 'bg-transparent text-accent px-4 py-[15px] rounded-xl font-semibold text-base border border-hairline hover:bg-accent-soft disabled:opacity-45',
  },
  outline: {
    sm: 'border border-hairline bg-transparent text-ink px-8 py-4 rounded-xl font-semibold text-base hover:bg-accent-soft hover:border-accent',
    md: 'border border-hairline bg-transparent text-ink px-8 py-4 rounded-xl font-semibold text-base hover:bg-accent-soft hover:border-accent',
    lg: 'border border-hairline bg-transparent text-ink px-8 py-4 rounded-xl font-semibold text-base hover:bg-accent-soft hover:border-accent',
  },
  close: {
    sm: 'border-0 bg-none px-2 py-1 rounded-[7px] text-muted text-sm hover:text-ink hover:bg-accent-soft',
    md: 'border-0 bg-none px-2 py-1 rounded-[7px] text-muted text-sm hover:text-ink hover:bg-accent-soft',
    lg: 'border-0 bg-none px-2 py-1 rounded-[7px] text-muted text-sm hover:text-ink hover:bg-accent-soft',
  },
  danger: {
    sm: 'border-0 bg-none px-2 py-1 rounded-[7px] text-muted text-sm hover:bg-paper-red hover:text-neg',
    md: 'border-0 bg-none px-2 py-1 rounded-[7px] text-muted text-sm hover:bg-paper-red hover:text-neg',
    lg: 'border-0 bg-none px-2 py-1 rounded-[7px] text-muted text-sm hover:bg-paper-red hover:text-neg',
  },
  link: {
    sm: 'border-0 bg-none p-0 text-accent font-medium text-xs underline underline-offset-[3px] decoration-hairline hover:decoration-accent',
    md: 'border-0 bg-none p-0 text-accent font-medium text-xs underline underline-offset-[3px] decoration-hairline hover:decoration-accent',
    lg: 'border-0 bg-none p-0 text-accent font-medium text-xs underline underline-offset-[3px] decoration-hairline hover:decoration-accent',
  },
  nav: {
    sm: 'border border-hairline bg-transparent text-muted w-[30px] h-[30px] rounded-lg text-base leading-none hover:text-ink hover:bg-accent-soft',
    md: 'border border-hairline bg-transparent text-muted w-[30px] h-[30px] rounded-lg text-base leading-none hover:text-ink hover:bg-accent-soft',
    lg: 'border border-hairline bg-transparent text-muted w-[30px] h-[30px] rounded-lg text-base leading-none hover:text-ink hover:bg-accent-soft',
  },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = `cursor-pointer transition-colors ${VARIANT_CLASSES[variant][size]}`;
  const final = className ? `${classes} ${className}` : classes;

  return (
    <button type={type} className={final} {...rest}>
      {children}
    </button>
  );
}
