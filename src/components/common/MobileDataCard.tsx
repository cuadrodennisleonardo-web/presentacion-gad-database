import React, { useState } from 'react';

interface MobileDataCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function MobileDataCard({ title, children, defaultExpanded = false }: MobileDataCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-3 shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/30 text-left outline-none transition hover:bg-gray-100 dark:hover:bg-gray-800/80 focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <span className="font-medium text-gray-900 dark:text-white text-sm">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
