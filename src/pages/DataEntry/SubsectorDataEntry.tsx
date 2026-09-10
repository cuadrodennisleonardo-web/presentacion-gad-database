import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useRole } from '@/hooks/useRole';
import { fetchBarangays } from '@/services/api';
import DataEntryLayout from '@/components/layout/DataEntryLayout';
import NativeDemographyDataEntryGrid from '@/components/dataEntry/NativeDemographyDataEntryGrid';
import DynamicDataEntryGrid from '@/components/common/DynamicDataEntryGrid';
import YearSelector from '@/components/common/YearSelector';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import type { Database } from '@/types/database';

type Subsector = Database['public']['Tables']['subsectors']['Row'];
type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];

const SLUG_TO_SECTOR: Record<string, string> = {
  'social-development': 'Social Development',
  'economic-development': 'Economic Development',
  'infrastructure': 'Infrastructure',
  'environment': 'Environment',
  'institutional': 'Institutional',
};

export default function SubsectorDataEntry() {
  const { sectorSlug, subsectorId } = useParams<{ sectorSlug: string; subsectorId: string }>();
  const navigate = useNavigate();
  const { canWrite, isSuperAdmin } = useRole();

  const sectorName = sectorSlug ? SLUG_TO_SECTOR[sectorSlug] || sectorSlug : '';
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<string>('');

  // Fetch subsector details
  const { data: subsector, isLoading: isLoadingSubsector } = useQuery<Subsector | null>({
    queryKey: ['subsector_detail', subsectorId],
    queryFn: async () => {
      if (!subsectorId) return null;
      const { data, error } = await supabase
        .from('subsectors')
        .select('*')
        .eq('id', subsectorId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!subsectorId,
  });

  const isDemographySubsector = 
    subsectorId === 'demography' || 
    subsectorId === 'population' || 
    (subsector?.name || '').toLowerCase().includes('demograph') ||
    (subsector?.name || '').toLowerCase().includes('population');

  // Fetch dynamic schemas matching this subsector
  const { data: dynamicSchemas = [], isLoading: isLoadingSchemas } = useQuery<DynamicSchema[]>({
    queryKey: ['dynamic_schemas_by_subsector', sectorName, subsectorId],
    queryFn: async () => {
      if (!subsectorId && !sectorName) return [];
      
      let query = supabase.from('dynamic_schemas').select('*');
      if (subsectorId) {
        query = query.eq('subsector', subsectorId);
      } else {
        query = query.eq('department', sectorName);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!sectorName || !!subsectorId,
  });

  const { data: barangays = [] } = useQuery({
    queryKey: ['barangays'],
    queryFn: fetchBarangays,
  });

  // Automatically select the first available tab
  useEffect(() => {
    if (isDemographySubsector) {
      if (!activeTab) {
        setActiveTab('native_demography');
      }
    } else if (dynamicSchemas.length > 0) {
      if (!activeTab || !dynamicSchemas.some((d) => d.id === activeTab)) {
        setActiveTab(dynamicSchemas[0].id);
      }
    }
  }, [dynamicSchemas, activeTab, isDemographySubsector]);

  if (isLoadingSubsector || isLoadingSchemas) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const subsectorTitle = subsector?.name || (isDemographySubsector ? 'Demography' : sectorName);
  const currentTabSchema = dynamicSchemas.find((d) => d.id === activeTab);

  // If Demography Subsector: Render Unified Card Container matching the system design
  if (isDemographySubsector) {
    const hasMultipleTabs = dynamicSchemas.length > 0;

    return (
      <>
        <PageMeta
          title={`${subsectorTitle} Data Entry`}
          description={subsector?.description || 'Manage official sex-disaggregated population and household statistics'}
        />

        {/* Top Header with Breadcrumb & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageBreadcrumb pageTitle={subsectorTitle} rootLabel={sectorName} rootPath={`/data-entry/${sectorSlug}`} />
          <button
            type="button"
            onClick={() => navigate(`/data-entry/${sectorSlug}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs transition hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to {sectorName} Hub</span>
          </button>
        </div>

        {/* Standard Card Container */}
        <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          
          {/* Tab Navigation Header (Underline Tabs) */}
          {hasMultipleTabs && (
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 w-full min-w-0 bg-gray-50/40 dark:bg-gray-800/20">
              <div className="flex overflow-x-auto no-scrollbar w-full min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('native_demography')}
                  className={`px-6 py-4 text-sm font-medium outline-none transition whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'native_demography'
                      ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400 font-bold bg-white dark:bg-gray-900/50'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
                  }`}
                >
                  Population &amp; Households
                </button>
                {dynamicSchemas.map((ds) => (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => setActiveTab(ds.id)}
                    className={`px-6 py-4 text-sm font-medium outline-none transition whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === ds.id
                        ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400 font-bold bg-white dark:bg-gray-900/50'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    {ds.tab_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card Body */}
          <div className="p-5 lg:p-6 space-y-4 w-full min-w-0">
            {/* Inner Header with Title, Description & Year Selector */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between w-full min-w-0">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {activeTab === 'native_demography' ? 'Demography Grid' : `${currentTabSchema?.tab_name || ''} Grid`}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {activeTab === 'native_demography'
                    ? 'Manage official population, household counts, and age groups for all 18 official barangays.'
                    : ((currentTabSchema?.schema as any)?.description || `Manage ${currentTabSchema?.tab_name || 'subsector'} indicators.`)}
                </p>
              </div>

              <div className="shrink-0">
                <YearSelector
                  year={year}
                  setYear={setYear}
                  scopeKey={`SocialDevelopment_${activeTab}`}
                />
              </div>
            </div>

            {/* Grid Body */}
            {activeTab === 'native_demography' ? (
              <NativeDemographyDataEntryGrid year={year} entityName="Barangay" />
            ) : currentTabSchema ? (
              <DynamicDataEntryGrid
                schema={currentTabSchema}
                barangays={barangays}
                year={year}
                entityName="Barangay"
              />
            ) : null}
          </div>
        </div>
      </>
    );
  }

  // Non-Demography Subsectors without dynamic schemas: Show Guidance Empty State with Back Button
  if (dynamicSchemas.length === 0) {
    return (
      <div className="space-y-6">
        <PageMeta
          title={`${subsector?.name || 'Subsector'} Data Entry`}
          description={subsector?.description || 'Data entry grid'}
        />
        
        {/* Top Header with Breadcrumb & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageBreadcrumb pageTitle={subsector?.name || 'Subsector'} rootLabel={sectorName} rootPath={`/data-entry/${sectorSlug}`} />
          <button
            type="button"
            onClick={() => navigate(`/data-entry/${sectorSlug}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs transition hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to {sectorName} Hub</span>
          </button>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40 mb-3">
            {sectorName} • {subsector?.is_barangay_level ? 'Barangay Level' : 'Municipal Level'}
          </span>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {subsector?.name || 'Subsector Data Tables'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            {subsector?.description || 'No dynamic tables have been configured for this subsector yet.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/data-entry/${sectorSlug}`)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm cursor-pointer"
            >
              ← Back to {sectorName} Hub
            </button>

            {isSuperAdmin && (
              <Link
                to={`/settings/dynamic-tables?dept=${encodeURIComponent(sectorName)}&subsector=${encodeURIComponent(subsectorId || '')}`}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Table in Dynamic Tables
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Non-Demography Subsectors with dynamic schemas: Render using DataEntryLayout with Back Button
  return (
    <DataEntryLayout
      moduleName={sectorName}
      pageTitle={`${subsectorTitle} Data Entry`}
      pageDescription={subsector?.description || `Manage ${subsectorTitle} sex-disaggregated indicators and statistics.`}
      breadcrumbTitle={subsectorTitle}
      gridTitle={`${currentTabSchema?.tab_name || subsectorTitle} Grid`}
      gridDescription={`Data entry grid for ${currentTabSchema?.tab_name || subsectorTitle} indicators (${year})`}
      year={year}
      setYear={setYear}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dynamicSchemas={dynamicSchemas}
      barangays={barangays}
      nativeTabs={[]}
      isLocked={false}
      latestApproval={null}
      isSuperAdmin={isSuperAdmin}
      canWrite={canWrite}
      onSave={() => {}}
      isSaving={false}
      isLoading={false}
      showConfirmModal={false}
      setShowConfirmModal={() => {}}
      onConfirmSave={() => {}}
      backButton={{
        label: `Back to ${sectorName} Hub`,
        onClick: () => navigate(`/data-entry/${sectorSlug}`)
      }}
    >
      <div />
    </DataEntryLayout>
  );
}
