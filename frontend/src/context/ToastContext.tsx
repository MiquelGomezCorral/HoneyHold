import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Button from '../components/Button.js';
import { useI18n } from '../i18n.js';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  closing: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showError: (error: unknown) => void;
}

const MAX_TOASTS = 5;
const TOAST_DURATION_MS = 3000;
const TOAST_EXIT_MS = 200;
const Ctx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastsRef = useRef<Toast[]>([]);
  const pendingToasts = useRef<Toast[]>([]);
  const nextId = useRef(0);
  const expiryTimers = useRef(new Map<number, ReturnType<typeof window.setTimeout>>());
  const removalTimers = useRef(new Map<number, ReturnType<typeof window.setTimeout>>());

  function updateToasts(next: Toast[]) {
    toastsRef.current = next;
    setToasts(next);
  }

  function removeToast(id: number) {
    const expiryTimer = expiryTimers.current.get(id);
    if (expiryTimer) window.clearTimeout(expiryTimer);
    const removalTimer = removalTimers.current.get(id);
    if (removalTimer) window.clearTimeout(removalTimer);
    expiryTimers.current.delete(id);
    removalTimers.current.delete(id);
    updateToasts(toastsRef.current.filter((toast) => toast.id !== id));
    const nextToast = pendingToasts.current.shift();
    if (nextToast) {
      addToast(nextToast);
      const oldestToast = toastsRef.current.find((toast) => !toast.closing);
      if (pendingToasts.current.length && oldestToast) dismissToast(oldestToast.id);
    }
  }

  function dismissToast(id: number) {
    const toast = toastsRef.current.find((item) => item.id === id);
    if (!toast || toast.closing) return;

    const expiryTimer = expiryTimers.current.get(id);
    if (expiryTimer) window.clearTimeout(expiryTimer);
    expiryTimers.current.delete(id);
    updateToasts(toastsRef.current.map((item) => item.id === id ? { ...item, closing: true } : item));
    removalTimers.current.set(id, window.setTimeout(() => removeToast(id), TOAST_EXIT_MS));
  }

  function showToast(message: string, type: ToastType = 'info') {
    const toast = { id: nextId.current++, message, type, closing: false };
    if (toastsRef.current.length >= MAX_TOASTS) {
      pendingToasts.current.push(toast);
      if (!toastsRef.current.some((item) => item.closing)) dismissToast(toastsRef.current[0].id);
      return;
    }

    addToast(toast);
  }

  function addToast(toast: Toast) {
    updateToasts([...toastsRef.current, toast]);
    expiryTimers.current.set(toast.id, window.setTimeout(() => dismissToast(toast.id), TOAST_DURATION_MS));
  }

  function showError(error: unknown) {
    console.error(error);
    showToast(error instanceof Error ? error.message : String(error), 'error');
  }

  useEffect(() => () => {
    expiryTimers.current.forEach((timer) => window.clearTimeout(timer));
    removalTimers.current.forEach((timer) => window.clearTimeout(timer));
    pendingToasts.current = [];
  }, []);

  return (
    <Ctx.Provider value={{ showToast, showError }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex w-[min(24rem,calc(100vw-40px))] flex-col gap-2.5 max-sm:left-5 max-sm:right-5 max-sm:w-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              'flex items-start gap-3 rounded-lg border px-3 py-2 text-sm font-medium shadow-xl transition-all duration-200 ease-out',
              toast.type === 'success' ? 'border-[#4c8b73]/30 bg-paper-green text-ink' : toast.type === 'error' ? 'border-neg/30 bg-paper-red text-ink' : 'border-hairline bg-paper-blue-raise text-ink',
              toast.closing ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
            ].join(' ')}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          >
            <span className="min-w-0 flex-1">{toast.message}</span>
            <Button variant="close" size="sm" className="-mr-1 -mt-1" onClick={() => dismissToast(toast.id)} aria-label={t('common.close')}>✕</Button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
