import cn from 'classnames';


export function Separator({ direction = 'horizontal', className }: { direction?: 'horizontal' | 'vertical'; className?: string }) {
  return (
    direction === 'horizontal' ? (
      <div className={cn('self-stretch h-0.5 rounded-full bg-hairline', className)} />
    ) : (
      <div className={cn('self-stretch w-0.5 rounded-full bg-hairline', className)} />
    )
  );
}


