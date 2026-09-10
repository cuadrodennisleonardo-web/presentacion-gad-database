import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useRole } from '@/hooks/useRole';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Database } from '@/types/database';

type Subsector = Database['public']['Tables']['subsectors']['Row'];
type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];

interface SectorHubPageProps {
  sector: 'Social Development' | 'Economic Development' | 'Infrastructure' | 'Environment' | 'Institutional';
  sectorSlug: string;
  description: string;
  badgeColor?: string;
}

// Icon renderer for subsectors
const SubsectorIcon: React.FC<{ icon?: string | null; className?: string }> = ({ icon, className = "w-6 h-6" }) => {
  switch (icon) {
    case 'Users':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'GraduationCap':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
        </svg>
      );
    case 'HeartPulse':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l2-3 3 6 2-3h6" />
        </svg>
      );
    case 'Home':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'ShieldAlert':
    case 'ShieldCheck':
    case 'Shield':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'Briefcase':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
      );
    case 'TrendingDown':
    case 'TrendingUp':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case 'Droplets':
    case 'Droplet':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
        </svg>
      );
    case 'Wheat':
    case 'Apple':
    case 'Fish':
    case 'Trees':
    case 'Mountain':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l8 8m-8-8l-8 8m8 5l5 5m-5-5l-5 5" />
        </svg>
      );
    case 'Coins':
    case 'Vote':
    case 'Scale':
    case 'CheckCircle2':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
  }
};

export default function SectorHubPage({ sector, sectorSlug, description }: SectorHubPageProps) {
  const navigate = useNavigate();
  const { role, isSuperAdmin } = useRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'barangay' | 'municipal'>('all');

  // Fetch subsectors for this sector
  const { data: subsectors = [], isLoading: isLoadingSubsectors } = useQuery<Subsector[]>({
    queryKey: ['subsectors', sector],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subsectors')
        .select('*')
        .eq('sector', sector)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch dynamic schemas count per subsector
  const { data: dynamicSchemas = [] } = useQuery<DynamicSchema[]>({
    queryKey: ['dynamic_schemas_by_sector', sector],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_schemas')
        .select('*')
        .eq('department', sector);
      if (error) throw error;
      return data || [];
    },
  });

  // Map subsector ID to schema counts
  const schemaCountBySubsector = useMemo(() => {
    const map: Record<string, number> = {};
    dynamicSchemas.forEach((s) => {
      if (s.subsector) {
        map[s.subsector] = (map[s.subsector] || 0) + 1;
      }
    });
    return map;
  }, [dynamicSchemas]);

  // Filter subsectors
  const filteredSubsectors = useMemo(() => {
    return subsectors.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLevel =
        levelFilter === 'all' ||
        (levelFilter === 'barangay' && item.is_barangay_level) ||
        (levelFilter === 'municipal' && !item.is_barangay_level);

      return matchesSearch && matchesLevel;
    });
  }, [subsectors, searchTerm, levelFilter]);

  const totalCount = subsectors.length;
  const barangayLevelCount = subsectors.filter(s => s.is_barangay_level).length;
  const municipalLevelCount = subsectors.filter(s => !s.is_barangay_level).length;

  if (isLoadingSubsectors) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isViewer = role === 'viewer' || role === 'senior_viewer' || role === 'dept_viewer';

  return (
    <div className="space-y-6 pb-12">
      <PageMeta title={`${sector} Hub`} description={description} />
      <PageBreadcrumb pageTitle={sector} hideNav={false} />

      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/90 p-6 sm:p-7 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            JMC 2013-01 Mandated Sector
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">{sector}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">{description}</p>

          {/* Quick Stat Badges */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 px-3.5 py-1.5 border border-gray-200/80 dark:border-gray-700/60 text-xs sm:text-sm">
              <span className="font-bold text-gray-900 dark:text-white">{totalCount}</span>
              <span className="text-gray-500 dark:text-gray-400">Subsectors Total</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1.5 border border-emerald-200/80 dark:border-emerald-800/40 text-xs sm:text-sm">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{barangayLevelCount}</span>
              <span className="text-emerald-700/80 dark:text-emerald-400/80">Barangay-Level</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3.5 py-1.5 border border-amber-200/80 dark:border-amber-800/40 text-xs sm:text-sm">
              <span className="font-bold text-amber-700 dark:text-amber-400">{municipalLevelCount}</span>
              <span className="text-amber-700/80 dark:text-amber-400/80">Municipal-Level</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search subsectors, indicators, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 pl-10 pr-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900/60 p-1 rounded-lg">
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              levelFilter === 'all'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setLevelFilter('barangay')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              levelFilter === 'barangay'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Barangay ({barangayLevelCount})
          </button>
          <button
            onClick={() => setLevelFilter('municipal')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              levelFilter === 'municipal'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Municipal ({municipalLevelCount})
          </button>
        </div>
      </div>

      {/* Subsectors Card Grid */}
      {filteredSubsectors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No subsectors found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filter terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubsectors.map((sub) => {
            const tableCount = schemaCountBySubsector[sub.id] || 0;
            // Native tables indicator for demography / population
            const isNative = sub.id === 'demography';

            return (
              <div
                key={sub.id}
                onClick={() => navigate(`/data-entry/${sectorSlug}/${sub.id}`)}
                className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700/80 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                      <SubsectorIcon icon={sub.icon} className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sub.is_barangay_level ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                          Barangay
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                          Municipal
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                    {sub.description || 'Sex-disaggregated indicators and statistics.'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {isNative ? (
                      <span className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                        Native + Dynamic
                      </span>
                    ) : tableCount > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {tableCount} {tableCount === 1 ? 'Table' : 'Tables'} Configured
                      </span>
                    ) : (
                      <span className="text-gray-400">Dynamic Ready</span>
                    )}
                  </span>

                  <span className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    {isViewer ? 'View' : 'Open'}
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Superadmin footer helper */}
      {isSuperAdmin && (
        <div className="mt-8 rounded-xl bg-blue-50/70 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Need to create custom indicators for this sector?</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Add dynamic schemas or configure new subsector tables using Dynamic Tables Manager.</p>
            </div>
          </div>
          <Link
            to="/settings/dynamic-tables"
            className="shrink-0 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
          >
            Manage Dynamic Tables
          </Link>
        </div>
      )}
    </div>
  );
}
