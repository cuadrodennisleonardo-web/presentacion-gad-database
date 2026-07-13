import React from "react";
import type { UseFormRegister } from "react-hook-form";
import { cn } from "@/lib/utils";

interface ToggleFieldProps {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  description?: string;
  disabled?: boolean;
  className?: string;
}

const ToggleField: React.FC<ToggleFieldProps> = ({
  label,
  name,
  register,
  description,
  disabled = false,
  className,
}) => {
  return (
    <label
      htmlFor={name}
      className={cn(
        "flex items-start gap-3 cursor-pointer group",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          id={name}
          type="checkbox"
          disabled={disabled}
          {...register(name)}
          className="peer sr-only"
        />
        <div className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-brand-500 peer-focus:ring-2 peer-focus:ring-brand-500/20 dark:bg-gray-700 dark:peer-checked:bg-brand-500" />
        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </div>
    </label>
  );
};

export default ToggleField;
