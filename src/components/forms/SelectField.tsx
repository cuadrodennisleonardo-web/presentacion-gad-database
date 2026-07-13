import React from "react";
import type { UseFormRegister, FieldError, RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SelectFieldProps {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  registerOptions?: RegisterOptions;
  error?: FieldError;
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  register,
  registerOptions,
  error,
  options,
  placeholder = "Select...",
  required = false,
  disabled = false,
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
      <select
        id={name}
        disabled={disabled}
        {...register(name, registerOptions)}
        className={cn(
          "h-10 w-full rounded-lg border bg-transparent px-3 text-sm text-gray-800 outline-none transition-colors appearance-none",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          "dark:text-white/90 dark:focus:border-brand-400",
          error
            ? "border-error-400 focus:border-error-500 focus:ring-error-500/20"
            : "border-gray-300 dark:border-gray-700",
          disabled && "cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-800"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 0.5rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.5em 1.5em",
          paddingRight: "2.5rem",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const label = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="text-xs text-error-500">{error.message}</p>
      )}
    </div>
  );
};

export default SelectField;
