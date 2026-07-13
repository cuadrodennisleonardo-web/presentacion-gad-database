import React from 'react';

interface MobileDataInputProps {
  label: string;
  type?: 'single' | 'split';
  children: React.ReactNode;
}

export function MobileDataInput({ label, type = 'single', children }: MobileDataInputProps) {
  if (type === 'split') {
    return (
      <div className="space-y-2 border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider">
          {label}
        </label>
        {children}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="w-1/3 min-w-[80px]">
        {children}
      </div>
    </div>
  );
}

interface SplitInputWrapperProps {
  inputMale: React.ReactNode;
  inputFemale: React.ReactNode;
  total: number;
}

export function SplitInputWrapper({ inputMale, inputFemale, total }: SplitInputWrapperProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <div className="text-[10px] text-gray-500 dark:text-gray-500 mb-1 text-center font-medium">MALE</div>
        {inputMale}
      </div>
      <div>
        <div className="text-[10px] text-gray-500 dark:text-gray-500 mb-1 text-center font-medium">FEMALE</div>
        {inputFemale}
      </div>
      <div>
        <div className="text-[10px] text-gray-500 dark:text-gray-500 mb-1 text-center font-medium">TOTAL</div>
        <div className="h-[38px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg font-medium text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
          {total}
        </div>
      </div>
    </div>
  );
}
