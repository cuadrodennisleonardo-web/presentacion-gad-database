import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h3 className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white/90">
            {value}
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400">
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.isPositive
                ? "text-success-600 dark:text-success-500"
                : "text-error-600 dark:text-error-500"
            )}
          >
            <svg
              className={cn("h-4 w-4", !trend.isPositive && "rotate-180")}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 3.33337V12.6667M8 3.33337L12.6667 8.00004M8 3.33337L3.33334 8.00004"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            vs last period
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
