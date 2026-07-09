import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[rgba(22,50,74,0.35)] max-sm:items-end max-sm:p-0"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[460px] max-h-[calc(100vh-40px)] overflow-auto bg-paper border border-hairline rounded-[14px] p-[22px_24px_20px] max-sm:max-w-none max-sm:max-h-[92dvh] max-sm:rounded-t-[16px] max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex justify-between items-center mb-[18px]">
          <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
          <button
            type="button"
            className="border-0 bg-none px-2 py-1 rounded-[7px] text-muted text-sm cursor-pointer hover:text-ink hover:bg-accent-soft"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
