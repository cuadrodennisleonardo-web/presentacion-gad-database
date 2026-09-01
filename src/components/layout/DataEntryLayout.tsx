import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { DataExportImport, ExportColumn } from '@/components/common/DataExportImport';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import DynamicDataEntryGrid from '@/components/common/DynamicDataEntryGrid';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import YearSelector from '@/components/common/YearSelector';
import TabSequenceModal from '@/components/common/TabSequenceModal';
import { getSchemaSubSector } from '@/utils/subSectorUtils';
import { supabase } from '@/config/supabase';
import { toast } from 'react-hot-toast';
import type { Database } from '@/types/database';

type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];
type Barangay = Database['public']['Tables']['barangays']['Row'];

export interface SubSector {
  id: string;
  label: string;
  keys: string[];
}

interface TabItem {
  key: string;
  label: string;
  isDynamic?: boolean;
  schema?: DynamicSchema;
}

interface DataEntryLayoutProps {
  moduleName: string;
  pageTitle: string;
  pageDescription: string;
  breadcrumbTitle: string;
  
  gridTitle: string;
  gridDescription: string;
  
  year: number;
  setYear: (y: number) => void;
  yearOptions?: { value: number; label: string }[];
  
  activeTab: string;
  entityName?: string;
  setActiveTab: (tab: string) => void;

  subSectors?: SubSector[];
  activeSubSector?: string;
  onSelectSubSector?: (subSectorId: string) => void;
  
  dynamicSchemas: DynamicSchema[];
  barangays: Barangay[];
  nativeTabs: { key: string; label: string }[];
  
  isLocked: boolean;
  latestApproval: any;
  isSuperAdmin: boolean;
  canWrite: boolean;
  
  exportData?: any[];
  exportColumns?: ExportColumn[];
  exportTitle?: string;
  onImport?: (data: any[]) => void;
  
  onSave: () => void;
  isSaving: boolean;
  isLoading: boolean;
  
  showConfirmModal: boolean;
  setShowConfirmModal: (show: boolean) => void;
  onConfirmSave: () => void;
  
  children: React.ReactNode;
}

export default function DataEntryLayout({
  moduleName,
  pageTitle,
  pageDescription,
  breadcrumbTitle,
  gridTitle,
  gridDescription,
  year,
  setYear,
  yearOptions,
  activeTab,
  entityName,
  setActiveTab,
  subSectors,
  activeSubSector = 'all',
  onSelectSubSector,
  dynamicSchemas,
  barangays,
  nativeTabs,
  isLocked,
  latestApproval: _latestApproval,
  isSuperAdmin = false,
  canWrite,
  exportData,
  exportColumns,
  exportTitle,
  onImport,
  onSave,
  isSaving,
  isLoading,
  showConfirmModal,
  setShowConfirmModal,
  onConfirmSave,
  children
}: DataEntryLayoutProps) {
  
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [tabOrderOverride, setTabOrderOverride] = useState<string[] | null>(() => {
    try {
      const saved = localStorage.getItem(`tab_order_${moduleName}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const allTabs: TabItem[] = [
    ...nativeTabs.map(t => ({ key: t.key, label: t.label, isDynamic: false, schema: undefined as DynamicSchema | undefined })),
    ...dynamicSchemas.map(ds => ({ key: ds.id, label: ds.tab_name, isDynamic: true, schema: ds as DynamicSchema | undefined }))
  ];

  // Filter tabs if a sub-sector is selected
  const rawFilteredTabs: TabItem[] = allTabs.filter(t => {
    if (!subSectors || subSectors.length === 0 || activeSubSector === 'all') return true;
    const selectedSub = subSectors.find(s => s.id === activeSubSector);
    if (!selectedSub) return true;

    if (t.isDynamic && t.schema) {
      const sSub = getSchemaSubSector(t.schema);
      return sSub === selectedSub.id;
    }
    
    return selectedSub.keys.includes(t.key);
  });

  // Memoize tabs to prevent unnecessary re-render reference changes
  const tabs: TabItem[] = useMemo(() => {
    if (tabOrderOverride && tabOrderOverride.length > 0) {
      return [...rawFilteredTabs].sort((a: TabItem, b: TabItem) => {
        const indexA = tabOrderOverride.indexOf(a.key);
        const indexB = tabOrderOverride.indexOf(b.key);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
    }

    return [...rawFilteredTabs].sort((a: TabItem, b: TabItem) => {
      const orderA = (a.schema?.schema as any)?.tab_order ?? (a.isDynamic ? 100 : 0);
      const orderB = (b.schema?.schema as any)?.tab_order ?? (b.isDynamic ? 100 : 0);
      return orderA - orderB;
    });
  }, [rawFilteredTabs, tabOrderOverride]);

  const handleSaveSequence = async (orderedKeys: string[]) => {
    setTabOrderOverride(orderedKeys);
    try {
      localStorage.setItem(`tab_order_${moduleName}`, JSON.stringify(orderedKeys));
    } catch (e) {
      console.error(e);
    }
    toast.success('Table sequence updated successfully!');

    // If superadmin, also persist tab_order into dynamic_schemas in Supabase
    if (isSuperAdmin) {
      try {
        const updatePromises = orderedKeys.map(async (key, index) => {
          const ds = dynamicSchemas.find(d => d.id === key);
          if (ds) {
            const currentSchema = (typeof ds.schema === 'object' && ds.schema !== null) ? ds.schema as any : {};
            await supabase.from('dynamic_schemas').update({
              schema: {
                ...currentSchema,
                tab_order: index + 1
              }
            }).eq('id', ds.id);
          }
        });
        await Promise.all(updatePromises);
      } catch (err) {
        console.error('Failed to sync tab order to server:', err);
      }
    }
  };

  const handleResetSequence = () => {
    setTabOrderOverride(null);
    try {
      localStorage.removeItem(`tab_order_${moduleName}`);
    } catch (e) {
      console.error(e);
    }
    toast.success('Table sequence reset to default.');
  };

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const prevActiveTabRef = useRef<string>(activeTab);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hiddenRightCount, setHiddenRightCount] = useState(0);

  const checkScrollability = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const hasLeft = el.scrollLeft > 6;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const hasRight = el.scrollLeft < maxScroll - 6;
    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);

    // Calculate count of tabs that are currently outside visible view on the right
    const visibleRightEdge = el.scrollLeft + el.clientWidth;
    const tabElements = Array.from(el.querySelectorAll<HTMLElement>('[data-tab-item]'));
    let hiddenCount = 0;
    tabElements.forEach(tEl => {
      if (tEl.offsetLeft + tEl.offsetWidth > visibleRightEdge + 10) {
        hiddenCount++;
      }
    });
    setHiddenRightCount(hiddenCount);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    checkScrollability();
    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    const observer = new ResizeObserver(() => {
      checkScrollability();
    });
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
      observer.disconnect();
    };
  }, [checkScrollability, tabs]);

  // Smoothly scroll active tab into view ONLY when activeTab actually changes
  useEffect(() => {
    if (prevActiveTabRef.current !== activeTab) {
      prevActiveTabRef.current = activeTab;
      const el = tabsContainerRef.current;
      if (!el) return;

      const activeEl = el.querySelector<HTMLElement>(`[data-tab-key="${activeTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      const timer = setTimeout(checkScrollability, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, checkScrollability]);

  const handleScrollLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const handleScrollRight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const activeTabData = allTabs.find(t => t.key === activeTab);

  const displayTitle = activeTabData?.isDynamic ? `${activeTabData.label} Grid` : gridTitle;
  
  let displayDescription = gridDescription;
  if (activeTabData?.isDynamic && activeTabData.schema) {
    const sData = activeTabData.schema.schema as any;
    const isCustom = sData?.targetEntity === 'custom_rows';
    const rowCount = isCustom ? (sData?.customRows?.length || 0) : barangays.length;
    const rowLabel = isCustom ? (sData?.customRowLabel || 'custom items') : `${rowCount} barangays`;
    displayDescription = Array.isArray(sData) 
      ? `Manage custom data for ${barangays.length} barangays.` 
      : (sData?.description || `Manage custom data for ${rowLabel}.`);
  }

  return (
    <>
      <PageMeta title={pageTitle} description={pageDescription} />
      <PageBreadcrumb pageTitle={breadcrumbTitle} rootLabel="Menu" rootPath={null} />
      
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Optional Sub-Sector Pills Bar */}
        {subSectors && subSectors.length > 0 && (
          <div className="px-5 py-3 bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 shrink-0 mr-1">
              Sub-Sector:
            </span>
            {subSectors.map(ss => (
              <button
                key={ss.id}
                onClick={() => onSelectSubSector?.(ss.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSubSector === ss.id
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 ring-2 ring-brand-500/20'
                    : 'bg-white dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {ss.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Headers with Scroll Indicators and Sequence Customizer Button */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 w-full min-w-0 bg-gray-50/40 dark:bg-gray-800/20">
          
          {/* Scrollable Tabs Wrapper with Left & Right Gradient Overlays */}
          <div className="relative flex-1 min-w-0 flex items-center overflow-hidden">
            
            {/* Left Scroll Navigation Button & Gradient Mask */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-2 pr-6 bg-gradient-to-r from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 pointer-events-none">
                <button
                  type="button"
                  onClick={handleScrollLeft}
                  className="pointer-events-auto h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-brand-600 hover:border-brand-300 dark:hover:text-brand-400 hover:scale-105 active:scale-95 transition cursor-pointer"
                  title="Scroll left for previous tables"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Scrollable Tabs Container */}
            <div 
              ref={tabsContainerRef}
              className="flex overflow-x-auto no-scrollbar w-full min-w-0"
            >
              {tabs.map(t => (
                <button
                  key={t.key}
                  data-tab-item="true"
                  data-tab-key={t.key}
                  className={`px-6 py-4 text-sm font-medium outline-none transition whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === t.key
                      ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400 font-bold bg-white dark:bg-gray-900/50'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
                  }`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Right Scroll Indicator & Gradient Mask */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-8 pr-2 bg-gradient-to-l from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 pointer-events-none">
                <button
                  type="button"
                  onClick={handleScrollRight}
                  className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-md text-xs font-bold hover:scale-105 active:scale-95 transition cursor-pointer"
                  title="Scroll right to view more hidden tables"
                >
                  <span className="text-[11px] font-bold">
                    {hiddenRightCount > 0 ? `${hiddenRightCount} more table${hiddenRightCount > 1 ? 's' : ''}` : 'More tables'}
                  </span>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Right Toolbar Actions */}
          <div className="px-3.5 py-2 shrink-0 flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 z-20">
            {tabs.length > 4 && (
              <div className="hidden md:flex items-center">
                <select
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-brand-500 max-w-[140px] truncate cursor-pointer"
                  title="Jump directly to any table"
                >
                  {tabs.map((t, idx) => (
                    <option key={t.key} value={t.key}>
                      {idx + 1}. {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSuperAdmin && tabs.length > 1 && (
              <button
                type="button"
                onClick={() => setShowSequenceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-brand-600 bg-white hover:bg-brand-50 rounded-xl border border-gray-200 hover:border-brand-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-brand-400 dark:hover:bg-gray-700 dark:border-gray-700 transition shadow-xs cursor-pointer"
                title="Customize table tab sequence"
              >
                <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="hidden sm:inline">Reorder Tables</span>
                <span className="sm:hidden">Reorder</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Sequence Customizer Modal */}
        <TabSequenceModal
          isOpen={showSequenceModal}
          onClose={() => setShowSequenceModal(false)}
          tabs={tabs}
          onSaveSequence={handleSaveSequence}
          onResetSequence={handleResetSequence}
          moduleName={moduleName}
        />

        <div className="p-5 lg:p-6 space-y-4 w-full min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between w-full min-w-0">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {displayTitle}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {displayDescription}
              </p>
            </div>
            
            <div className="shrink-0">
              {(() => {
                const educationYearOptions = Array.from({ length: 10 }, (_, i) => {
                  const y = new Date().getFullYear() - 5 + i;
                  return { value: y, label: `${y}-${y + 1}` };
                });

                const isSchoolDynamic = activeTabData?.isDynamic && (activeTabData.schema?.schema as any)?.targetEntity && (activeTabData.schema?.schema as any)?.targetEntity !== 'barangays';
                const resolvedYearOptions = yearOptions || (isSchoolDynamic ? educationYearOptions : undefined);

                return (
                  <YearSelector 
                    year={year} 
                    setYear={setYear}
                    yearOptions={resolvedYearOptions}
                    scopeKey={`${moduleName}_${activeTab}`}
                  />
                );
              })()}
            </div>
          </div>

          {!activeTabData?.isDynamic && canWrite && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 mb-4 w-full min-w-0">
              {exportData && exportColumns && (
                <DataExportImport 
                  data={exportData} 
                  columns={exportColumns}
                  title={exportTitle || `${pageTitle} (${year})`}
                  onImport={onImport} 
                />
              )}
              <button
                onClick={onSave}
                disabled={isSaving || isLoading || !canWrite || isLocked}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50 ml-auto shrink-0 cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {tabs.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-500 flex items-center justify-center font-bold text-lg">
                +
              </div>
              <p className="font-semibold text-gray-800 dark:text-white">No dynamic tables created for {moduleName} yet.</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Go to <span className="font-semibold text-brand-600 dark:text-brand-400">Settings &gt; Dynamic Tables Manager</span> to create custom dynamic tables for this sector.
              </p>
            </div>
          ) : (
            <ErrorBoundary>
              {activeTabData?.isDynamic && activeTabData.schema ? (
                <DynamicDataEntryGrid
                  schema={activeTabData.schema}
                  barangays={barangays}
                  year={year}
                  entityName={entityName}
                />
              ) : (
                children
              )}
            </ErrorBoundary>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={onConfirmSave}
        title="Submit Changes for Approval"
        message="Your changes will be submitted to the Superadmin for approval before updating the database. Proceed?"
      />
    </>
  );
}
