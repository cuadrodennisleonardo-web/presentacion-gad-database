import React, { useState, useEffect } from 'react';

export interface TabItem {
  key: string;
  label: string;
  isDynamic?: boolean;
}

interface TabSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TabItem[];
  onSaveSequence: (orderedKeys: string[]) => void;
  onResetSequence: () => void;
  moduleName: string;
}

export default function TabSequenceModal({
  isOpen,
  onClose,
  tabs,
  onSaveSequence,
  onResetSequence,
  moduleName,
}: TabSequenceModalProps) {
  const [orderedTabs, setOrderedTabs] = useState<TabItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOrderedTabs([...tabs]);
    }
  }, [isOpen, tabs]);

  if (!isOpen) return null;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newTabs = [...orderedTabs];
    const temp = newTabs[index - 1];
    newTabs[index - 1] = newTabs[index];
    newTabs[index] = temp;
    setOrderedTabs(newTabs);
  };

  const moveDown = (index: number) => {
    if (index === orderedTabs.length - 1) return;
    const newTabs = [...orderedTabs];
    const temp = newTabs[index + 1];
    newTabs[index + 1] = newTabs[index];
    newTabs[index] = temp;
    setOrderedTabs(newTabs);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newTabs = [...orderedTabs];
    const draggedItem = newTabs[draggedIndex];
    newTabs.splice(draggedIndex, 1);
    newTabs.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(targetIndex);
    setOrderedTabs(newTabs);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    const keys = orderedTabs.map(t => t.key);
    onSaveSequence(keys);
    onClose();
  };

  const handleReset = () => {
    onResetSequence();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Customize Table Sequence
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Arrange the order of tabs for <span className="font-semibold text-brand-600 dark:text-brand-400">{moduleName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Reordering List */}
        <div className="my-5 max-h-[60vh] overflow-y-auto space-y-2 pr-1">
          <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 mb-2 px-1 flex items-center justify-between">
            <span>Tab Order (Top to Bottom = Left to Right)</span>
            <span className="text-[10px] lowercase text-gray-400 font-normal">drag or use ⬆️ ⬇️</span>
          </div>

          {orderedTabs.map((tab, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === orderedTabs.length - 1;
            const isDragging = draggedIndex === idx;

            return (
              <div
                key={tab.key}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.02] shadow-md'
                    : 'border-gray-200 bg-gray-50/70 hover:bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-gray-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Position Badge */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {idx + 1}
                  </span>

                  {/* Drag Handle Icon */}
                  <div className="text-gray-400 dark:text-gray-500 shrink-0 cursor-grab">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9h.01M8 15h.01M16 9h.01M16 15h.01" />
                    </svg>
                  </div>

                  {/* Tab Info */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {tab.label}
                    </p>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-0.5 ${
                      tab.isDynamic
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}>
                      {tab.isDynamic ? 'Dynamic Table' : 'Native Table'}
                    </span>
                  </div>
                </div>

                {/* Move Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={isFirst}
                    title="Move Up"
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={isLast}
                    title="Move Down"
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition underline cursor-pointer"
          >
            Reset to Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl dark:text-gray-300 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Save Sequence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
