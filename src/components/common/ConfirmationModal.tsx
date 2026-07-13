import { useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requireComment?: boolean;
  onConfirm: (comment?: string) => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  requireComment = false,
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmationModalProps) {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message}
        </p>

        {requireComment && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comment / Reason (Optional)
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white"
              rows={3}
              placeholder="Add your comment here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(comment)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              isDestructive 
                ? 'bg-error-500 hover:bg-error-600' 
                : 'bg-brand-500 hover:bg-brand-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
