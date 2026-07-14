import cn from 'classnames';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface FilterPopoverProps {
  label: ReactNode;
  active?: boolean;
  buttonClassName?: string;
  children: ReactNode;
}

export default function FilterPopover({ label, active, buttonClassName, children }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          'inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-[color,background-color,border-color,transform] duration-300 active:duration-75 active:scale-95',
          {
            'bg-accent text-white border border-accent': active,
            'bg-white/45 text-ink border border-hairline hover:bg-accent-soft': !active,
          },
          buttonClassName
        )}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 truncate">{label}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-[min(340px,calc(100vw-32px))] rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-muted/15 backdrop-blur">
          {children}
        </div>
      )}
    </div>
  );
}
