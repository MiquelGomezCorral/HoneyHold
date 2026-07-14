import cn from 'classnames';
import { useEffect, type ReactNode } from 'react';
import Button from './Button.js';
import { BG_COLORS, type BgColor } from '../lib/theme.js';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  bgColor?: BgColor;
}

export default function Modal({ title, onClose, children, bgColor = 'Blue' }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-5 max-sm:items-end max-sm:p-0"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'w-full max-w-md max-h-[calc(100vh-40px)] overflow-visible border border-hairline rounded-xl p-6 pb-5 max-sm:max-w-none max-sm:max-h-[92dvh] max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0',
          BG_COLORS[bgColor]
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="m-0 text-base font-semibold">{title}</h2>
          <Button variant="close" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
