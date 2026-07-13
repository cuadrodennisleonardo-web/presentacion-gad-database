import React from "react";
import { Link } from "react-router";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageBreadcrumbProps {
  pageTitle: string;
  items?: BreadcrumbItem[];
  hideNav?: boolean;
  rootLabel?: string;
  rootPath?: string | null;
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({
  pageTitle,
  items = [],
  hideNav = false,
  rootLabel = "Dashboard",
  rootPath = "/dashboard",
}) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
        {pageTitle}
      </h1>
      {!hideNav && (
        <nav>
          <ol className="flex items-center gap-2">
            {rootLabel && (
              <li>
                {rootPath ? (
                  <Link
                    className="text-sm font-medium text-gray-500 hover:text-brand-500 dark:text-gray-400"
                    to={rootPath}
                  >
                    {rootLabel}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {rootLabel}
                  </span>
                )}
              </li>
            )}
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 15L12.5 10L7.5 5"
                    stroke="currentColor"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item.path ? (
                  <Link
                    className="text-sm font-medium text-gray-500 hover:text-brand-500 dark:text-gray-400"
                    to={item.path}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-brand-500 dark:text-brand-400">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
            <li className="flex items-center gap-2">
              {rootLabel && (
                <svg
                  className="h-4 w-4 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 15L12.5 10L7.5 5"
                    stroke="currentColor"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span className="text-sm font-medium text-brand-500 dark:text-brand-400">
                {pageTitle}
              </span>
            </li>
          </ol>
        </nav>
      )}
    </div>
  );
};

export default PageBreadcrumb;
