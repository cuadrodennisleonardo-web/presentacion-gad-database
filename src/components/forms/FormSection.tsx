import React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  columns = 2,
  className,
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={cn("border-b border-gray-200 pb-6 dark:border-gray-800 last:border-b-0 last:pb-0", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className={cn("grid gap-4", gridCols[columns])}>
        {children}
      </div>
    </div>
  );
};

export default FormSection;
