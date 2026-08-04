import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { HelpCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-amber-500/15 text-amber-500 rounded-xl border border-amber-500/25 flex-shrink-0">
            <HelpCircle className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-355 text-slate-300 leading-relaxed pt-0.5">{message}</p>
        </div>
        <div className="flex gap-3 justify-end border-t border-slate-800/60 pt-4 mt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
