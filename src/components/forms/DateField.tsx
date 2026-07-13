import React from "react";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

interface DateFieldProps {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  max?: string;
  min?: string;
  className?: string;
}

const DateField: React.FC<DateFieldProps> = ({
  label,
  name,
  register,
  error,
  required = false,
  disabled = false,
  max,
  min,
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={name}
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="ml-0.5 text-error-500">*</span>}
      </label>
      <input
        id={name}
        type="date"
        disabled={disabled}
        max={max}
        min={min}
        {...register(name)}
        className={cn(
          "h-10 w-full rounded-lg border bg-transparent px-3 text-sm text-gray-800 outline-none transition-colors",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          "dark:text-white/90 dark:focus:border-brand-400",
          "[&::-webkit-calendar-picker-indicator]:dark:invert",
          error
            ? "border-error-400 focus:border-error-500 focus:ring-error-500/20"
            : "border-gray-300 dark:border-gray-700",
          disabled && "cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-800"
        )}
      />
      {error && (
        <p className="text-xs text-error-500">{error.message}</p>
      )}
    </div>
  );
};

export default DateField;
