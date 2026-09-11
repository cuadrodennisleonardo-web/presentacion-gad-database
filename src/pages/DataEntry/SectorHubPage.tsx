import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useRole } from '@/hooks/useRole';
import PageMeta from '@/components/common/PageMeta';
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
    <div className="space-y-4 pb-10">
      <PageMeta title={`${sector} Hub`} description={description} />
      
      {/* Compact Bento Header: Combines Breadcrumb, Title, Description, Stats & Search into a unified space-saving block */}
      <div className="rounded-2xl border border-gray-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-800/90 p-4 sm:p-5 shadow-xs backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                JMC 2013-01 Mandated Sector
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">/</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Data Entry Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {sector}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-3xl line-clamp-2">
              {description}
            </p>
          </div>

          {/* Quick Counter Bento Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 px-3 py-1.5 border border-gray-200/70 dark:border-gray-700/60 text-xs">
              <span className="font-extrabold text-gray-900 dark:text-white">{totalCount}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px]">Total</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 border border-emerald-200/70 dark:border-emerald-800/40 text-xs">
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{barangayLevelCount}</span>
              <span className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">Barangay</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 border border-amber-200/70 dark:border-amber-800/40 text-xs">
              <span className="font-extrabold text-amber-700 dark:text-amber-400">{municipalLevelCount}</span>
              <span className="text-amber-700/80 dark:text-amber-400/80 text-[11px]">Municipal</span>
            </div>
          </div>
        </div>

        {/* Integrated Filter and Search Row */}
        <div className="pt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search subsectors or indicators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 pl-9 pr-8 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-gray-900/70 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                levelFilter === 'all'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setLevelFilter('barangay')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                levelFilter === 'barangay'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Barangay ({barangayLevelCount})
            </button>
            <button
              onClick={() => setLevelFilter('municipal')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                levelFilter === 'municipal'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Municipal ({municipalLevelCount})
            </button>
          </div>
        </div>
      </div>

      {/* High-Density Bento Subsectors Card Grid */}
      {filteredSubsectors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center bg-white/50 dark:bg-gray-800/50">
          <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No subsectors found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Try adjusting your search query or filter level.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredSubsectors.map((sub) => {
            const tableCount = schemaCountBySubsector[sub.id] || 0;
            const isNative = sub.id === 'demography';

            return (
              <div
                key={sub.id}
                onClick={() => navigate(`/data-entry/${sectorSlug}/${sub.id}`)}
                className="group relative flex flex-col justify-between rounded-xl bg-white dark:bg-gray-800/90 p-4 shadow-xs hover:shadow-md border border-gray-200/80 dark:border-gray-700/80 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shrink-0">
                      <SubsectorIcon icon={sub.icon} className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sub.is_barangay_level ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                          Barangay
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                          Municipal
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {sub.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px] leading-relaxed">
                    {sub.description || 'Sex-disaggregated indicators and statistics.'}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    {isNative ? (
                      <span className="inline-flex items-center text-blue-600 dark:text-blue-400">
                        Native + Dynamic
                      </span>
                    ) : tableCount > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {tableCount} {tableCount === 1 ? 'Table' : 'Tables'}
                      </span>
                    ) : (
                      <span className="text-gray-400">Dynamic Ready</span>
                    )}
                  </span>

                  <span className="inline-flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    {isViewer ? 'View' : 'Open'}
                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
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
        <div className="rounded-xl bg-blue-50/60 dark:bg-blue-900/20 p-3.5 border border-blue-100 dark:border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Need to create custom indicators for this sector?</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Add dynamic schemas or configure new subsector tables using Dynamic Tables Manager.</p>
            </div>
          </div>
          <Link
            to="/settings/dynamic-tables"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Manage Dynamic Tables
          </Link>
        </div>
      )}
    </div>
  );
}
