export interface IconProps {
  width?: number;
  height?: number;
  src: string;
  title?: string;
  text?: string;
  disabled?: boolean;
  hover?: boolean;
  type?: 'white' | 'color' | 'country' | 'tech-white';
  glowing?: boolean;
  className?: string;
}

export default function Icon({
  width = 24,
  height = 24,
  src,
  title,
  text,
  disabled,
  hover,
  type = 'white',
  glowing,
  className,
}: IconProps) {
  const base = 'relative flex items-center justify-center rounded-full gap-2';
  const interactive = !disabled
    ? ' transition-[opacity,transform] duration-300 active:duration-75 active:scale-95 group-hover:opacity-100 hover:opacity-100'
    : '';
  const dim = hover ? ' opacity-70' : '';
  const extra = className ? ` ${className}` : '';
  const imgClasses = [
    'w-full h-full object-contain',
    glowing ? 'drop-shadow-[0_0_6px_currentColor]' : '',
  ].filter(Boolean).join(' ');

  return (
    <figure className={`${base}${interactive}${dim}${extra}`}>
      <img
        src={`/assets/icons/${type}/${src}.svg`}
        alt={title ?? src}
        width={width}
        height={height}
        title={title}
        className={imgClasses || undefined}
      />
      {text}
    </figure>
  );
}
