import Modal from './Modal.js';
import Button, { type ButtonVariant } from './Button.js';
import { useI18n } from '../i18n.js';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  variant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted">{message}</p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" size="sm" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant={variant} size="sm" onClick={onConfirm}>{confirmLabel ?? t('common.confirm')}</Button>
      </div>
    </Modal>
  );
}
