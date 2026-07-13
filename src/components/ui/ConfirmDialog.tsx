import React from "react";
import Modal from "./Modal";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    iconBg: "bg-error-50 dark:bg-error-500/10",
    iconColor: "text-error-500",
    button:
      "bg-error-500 hover:bg-error-600 focus:ring-error-300 dark:focus:ring-error-800",
  },
  warning: {
    iconBg: "bg-warning-50 dark:bg-warning-500/10",
    iconColor: "text-warning-500",
    button:
      "bg-warning-500 hover:bg-warning-600 focus:ring-warning-300 dark:focus:ring-warning-800",
  },
  info: {
    iconBg: "bg-brand-50 dark:bg-brand-500/10",
    iconColor: "text-brand-500",
    button:
      "bg-brand-500 hover:bg-brand-600 focus:ring-brand-300 dark:focus:ring-brand-800",
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div
          className={cn(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
            styles.iconBg
          )}
        >
          {variant === "danger" ? (
            <svg
              className={cn("h-7 w-7", styles.iconColor)}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg
              className={cn("h-7 w-7", styles.iconColor)}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        {/* Text */}
        <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2",
              styles.button,
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
