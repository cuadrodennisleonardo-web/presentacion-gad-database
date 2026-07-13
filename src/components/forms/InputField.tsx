import React from "react";
import type { UseFormRegister, FieldError, RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils";

interface InputFieldProps {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  registerOptions?: RegisterOptions;
  error?: FieldError;
  type?: "text" | "email" | "tel" | "number" | "password" | "date";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  step?: string;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  register,
  registerOptions,
  error,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
  step,
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
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        step={step}
        {...register(name, registerOptions)}
        className={cn(
          "h-10 w-full rounded-lg border bg-transparent px-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          "dark:text-white/90 dark:placeholder-gray-500 dark:focus:border-brand-400",
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

export default InputField;
