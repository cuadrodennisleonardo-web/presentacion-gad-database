import React from 'react';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { DataExportImport, ExportColumn } from '@/components/common/DataExportImport';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import DynamicDataEntryGrid from '@/components/common/DynamicDataEntryGrid';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import YearSelector from '@/components/common/YearSelector';
import { getSchemaSubSector } from '@/utils/subSectorUtils';
import type { Database } from '@/types/database';

type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];
type Barangay = Database['public']['Tables']['barangays']['Row'];

export interface SubSector {
  id: string;
  label: string;
  keys: string[];
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
  isSuperAdmin: _isSuperAdmin,
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
  
  const allTabs = [
    ...nativeTabs.map(t => ({ key: t.key, label: t.label, isDynamic: false, schema: undefined })),
    ...dynamicSchemas.map(ds => ({ key: ds.id, label: ds.tab_name, isDynamic: true, schema: ds }))
  ];

  // Filter tabs if a sub-sector is selected
  const tabs = allTabs.filter(t => {
    if (!subSectors || subSectors.length === 0 || activeSubSector === 'all') return true;
    const selectedSub = subSectors.find(s => s.id === activeSubSector);
    if (!selectedSub) return true;

    if (t.isDynamic && t.schema) {
      const sSub = getSchemaSubSector(t.schema);
      return sSub === selectedSub.id;
    }
    
    return selectedSub.keys.includes(t.key);
  });

  const activeTabData = allTabs.find(t => t.key === activeTab);

  const displayTitle = activeTabData?.isDynamic ? `${activeTabData.label} Grid` : gridTitle;
  
  let displayDescription = gridDescription;
  if (activeTabData?.isDynamic && activeTabData.schema) {
    const sData = activeTabData.schema.schema as any;
    displayDescription = Array.isArray(sData) 
      ? `Manage custom data for ${barangays.length} barangays.` 
      : (sData?.description || `Manage custom data for ${barangays.length} barangays.`);
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

        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar w-full min-w-0">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`px-6 py-4 text-sm font-medium outline-none transition whitespace-nowrap cursor-pointer ${
                activeTab === t.key
                  ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

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
