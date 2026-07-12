import Modal from './Modal.js';
import Button, { type ButtonVariant } from './Button.js';

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
  confirmLabel = 'Confirm',
  variant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted">{message}</p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant={variant} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
