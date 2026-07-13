import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ActionModalProps {
  isOpen: boolean;
  actionType: 'approve' | 'reject';
  onClose: () => void;
  onConfirm: (comment: string) => void;
  loading?: boolean;
}

export default function ActionModal({
  isOpen,
  actionType,
  onClose,
  onConfirm,
  loading
}: ActionModalProps) {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(comment);
    setComment('');
  };

  const isReject = actionType === 'reject';
  const title = isReject ? 'Reject Request' : 'Approve Request';
  const confirmText = isReject ? 'Reject' : 'Approve';
  const confirmBtnClass = isReject
    ? 'bg-error-500 hover:bg-error-600 text-white'
    : 'bg-success-500 hover:bg-success-600 text-white';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          <p className="text-sm text-gray-500 mb-6">
            Please provide a {isReject ? 'reason for rejection' : 'comment (optional)'}.
          </p>

          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
              rows={4}
              placeholder={isReject ? "Reason for rejection (required)..." : "Add an optional comment..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required={isReject}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (isReject && !comment.trim())}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${confirmBtnClass}`}
              >
                {loading ? 'Processing...' : confirmText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
