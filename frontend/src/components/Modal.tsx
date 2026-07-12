import { useEffect, type ReactNode } from 'react';
import Button from './Button.js';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  bgColor?: 'Blue' | 'Green' | 'Red' | 'Yellow';
}

export default function Modal({ title, onClose, children, bgColor = 'Blue' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[rgba(22,50,74,0.35)] max-sm:items-end max-sm:p-0"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full max-w-[460px] max-h-[calc(100vh-40px)] overflow-auto border border-hairline rounded-[14px] p-[22px_24px_20px] max-sm:max-w-none max-sm:max-h-[92dvh] max-sm:rounded-t-[16px] max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 
          ${bgColor === 'Blue' && 'bg-paper-blue'}
          ${bgColor === 'Green' && 'bg-paper-green'} 
          ${bgColor === 'Red' && 'bg-paper-red'} 
          ${bgColor === 'Yellow' && 'bg-paper-yellow'}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex justify-between items-center mb-[18px]">
          <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
