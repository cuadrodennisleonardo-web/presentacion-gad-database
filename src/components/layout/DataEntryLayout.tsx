import React from 'react';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { DataExportImport, ExportColumn } from '@/components/common/DataExportImport';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import DynamicDataEntryGrid from '@/components/common/DynamicDataEntryGrid';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import YearSelector from '@/components/common/YearSelector';
import type { Database } from '@/types/database';

type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];
type Barangay = Database['public']['Tables']['barangays']['Row'];

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
  setActiveTab: (tab: string) => void;
  
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
  setActiveTab,
  dynamicSchemas,
  barangays,
  nativeTabs,
  isLocked,
  latestApproval,
  isSuperAdmin,
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
  
  const tabs = [
    ...nativeTabs.map(t => ({ key: t.key, label: t.label, isDynamic: false, schema: undefined })),
    ...dynamicSchemas.map(ds => ({ key: ds.id, label: ds.tab_name, isDynamic: true, schema: ds }))
  ];

  const activeTabData = tabs.find(t => t.key === activeTab);

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
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`px-6 py-4 text-sm font-medium outline-none transition whitespace-nowrap ${
                activeTab === t.key
                  ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 lg:p-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {displayTitle}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {displayDescription}
              </p>
            </div>
            
            <YearSelector 
              year={year} 
              setYear={setYear} 
              yearOptions={yearOptions} 
              scopeKey={`${moduleName}_${activeTab}`}
            />
          </div>
          
          {latestApproval?.status === 'rejected' && (
            <div className="mb-4 rounded-lg bg-error-50 border border-error-200 p-4 dark:bg-error-900/20 dark:border-error-800/50 flex items-start gap-3">
               <svg className="w-5 h-5 text-error-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <div>
                 <h4 className="text-sm font-medium text-error-800 dark:text-error-300">Approval Rejected</h4>
                 <p className="text-xs text-error-700 dark:text-error-400 mt-0.5">Your previous submission was rejected. Please review the feedback and resubmit.</p>
                 {latestApproval.comments && (
                   <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border border-error-100 dark:border-error-800/30 text-sm text-gray-700 dark:text-gray-300">
                     <strong>Reviewer Comments:</strong><br/>
                     {latestApproval.comments}
                   </div>
                 )}
               </div>
            </div>
          )}

          {isLocked && !isSuperAdmin && (
            <div className="mb-4 rounded-lg bg-brand-50 border border-brand-200 p-4 dark:bg-brand-900/20 dark:border-brand-800/50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <svg className="w-5 h-5 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                 </svg>
                 <div>
                   <h4 className="text-sm font-medium text-brand-800 dark:text-brand-300">Module Locked ({latestApproval.status})</h4>
                   <p className="text-xs text-brand-700 dark:text-brand-400 mt-0.5">This data is currently {latestApproval.status} and cannot be edited. Wait for review or contact a superadmin.</p>
                 </div>
               </div>
            </div>
          )}

          {activeTabData?.isDynamic ? (
            <ErrorBoundary>
              <DynamicDataEntryGrid schema={activeTabData.schema!} barangays={barangays} year={year} />
            </ErrorBoundary>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {exportData && exportColumns && exportTitle && (
                  <DataExportImport 
                    data={exportData} 
                    columns={exportColumns}
                    title={exportTitle}
                    onImport={canWrite ? onImport : undefined} 
                  />
                )}
                {canWrite && (
                  <button
                    onClick={onSave}
                    disabled={isSaving || isLoading || !canWrite || isLocked}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50 ml-auto"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                {isLoading ? (
                  <div className="py-10 text-center text-sm text-gray-500">Loading grid...</div>
                ) : (
                  <ErrorBoundary>
                    <div className="overflow-x-auto">
                      {children}
                    </div>
                  </ErrorBoundary>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Overwrite Pending Approval?"
        message="A pending approval request already exists for this tab. Saving new changes will replace the existing pending request. Do you want to proceed?"
        confirmLabel="Yes, Overwrite"
        onConfirm={onConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  );
}
