import cn from 'classnames';

interface IconProps {
  width?: number;
  height?: number;
  src: string;
  title?: string;
  type?: 'white' | 'color' | 'black' | 'country';
  className?: string;
}

export default function Icon({
  width = 24,
  height = 24,
  src,
  title,
  type = 'white',
  className,
}: IconProps) {
  return (
    <figure className={cn('relative flex items-center justify-center rounded-full', className)}>
      <img
        src={`/assets/icons/${type}/${src}.svg`}
        alt={title ?? ''}
        width={width}
        height={height}
        title={title}
        className="h-full w-full object-contain"
      />
    </figure>
  );
}
