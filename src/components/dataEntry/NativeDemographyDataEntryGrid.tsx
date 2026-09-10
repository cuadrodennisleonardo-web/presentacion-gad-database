import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { supabase } from '@/config/supabase';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { submitForApproval, getLatestApproval, notifySuperAdminsOfDirectSave } from '@/utils/approvalUtils';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { DataExportImport, ExportColumn } from '@/components/common/DataExportImport';
import { fetchBarangays } from '@/services/api';

interface NativeDemographyDataEntryGridProps {
  year: number;
  entityName?: string;
}

interface DemographyRow {
  id?: string;
  barangay_id: string;
  barangay_name: string;
  year: number;
  male_count: number | null;
  female_count: number | null;
  total_population: number | null;
  household_heads_m: number | null;
  household_heads_f: number | null;
  household_heads_total: number | null;
  total_households: number | null;
  age_under_18: number | null;
  age_19_to_59: number | null;
  age_60_plus: number | null;
}

const DEMOGRAPHY_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'male_count', header: 'Male Population' },
  { key: 'female_count', header: 'Female Population' },
  { key: 'total_population', header: 'Total Population' },
  { key: 'household_heads_m', header: 'Male Household Heads' },
  { key: 'household_heads_f', header: 'Female Household Heads' },
  { key: 'total_households', header: 'Total Households' },
  { key: 'age_under_18', header: 'Age < 18' },
  { key: 'age_19_to_59', header: 'Age 19-59' },
  { key: 'age_60_plus', header: 'Age 60+' },
];

export default function NativeDemographyDataEntryGrid({ year, entityName = 'Barangay' }: NativeDemographyDataEntryGridProps) {
  const { canWrite, canDirectSave } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [data, setData] = useState<Record<string, Partial<DemographyRow>>>({});
  const [originalData, setOriginalData] = useState<Record<string, Partial<DemographyRow>>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Fetch official 18 barangays
  const { data: barangays = [], isLoading: isLoadingBarangays } = useQuery({
    queryKey: ['clean_barangays'],
    queryFn: fetchBarangays,
  });

  // Fetch native population_stats for the selected year
  const { data: dbStats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ['population_stats', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('population_stats')
        .select('*')
        .eq('year', year);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch latest approval if any
  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', 'Social Development', 'Demography', year],
    queryFn: () => getLatestApproval('Social Development', 'Demography', year),
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !canDirectSave;

  // Initialize data grid state
  useEffect(() => {
    if (barangays.length === 0) return;

    const initialMap: Record<string, Partial<DemographyRow>> = {};
    const dbMap = new Map(dbStats.map(s => [s.barangay_id, s]));

    barangays.forEach(b => {
      const existing = dbMap.get(b.id) || {};
      const calculatedPop = (existing.male_count !== null || existing.female_count !== null)
        ? (Number(existing.male_count || 0) + Number(existing.female_count || 0))
        : null;
      const calculatedHh = existing.total_households ?? existing.household_heads_total ?? (
        (existing.household_heads_m !== null || existing.household_heads_f !== null)
          ? (Number(existing.household_heads_m || 0) + Number(existing.household_heads_f || 0))
          : null
      );

      initialMap[b.id] = {
        id: existing.id,
        barangay_id: b.id,
        barangay_name: b.name,
        year,
        male_count: existing.male_count ?? null,
        female_count: existing.female_count ?? null,
        total_population: existing.total_population ?? calculatedPop,
        household_heads_m: existing.household_heads_m ?? null,
        household_heads_f: existing.household_heads_f ?? null,
        household_heads_total: calculatedHh,
        total_households: calculatedHh,
        age_under_18: existing.age_under_18 ?? null,
        age_19_to_59: existing.age_19_to_59 ?? null,
        age_60_plus: existing.age_60_plus ?? null,
      };
    });

    setData(initialMap);
    setOriginalData(JSON.parse(JSON.stringify(initialMap)));
  }, [barangays, dbStats, year]);

  // Handle cell edits with automatic sum calculation
  const handleCellChange = (barangayId: string, field: keyof DemographyRow, value: string) => {
    if (!canWrite || isLocked) return;

    const numVal = value === '' ? null : Number(value);

    setData(prev => {
      const row = { ...(prev[barangayId] || {}) };
      (row as any)[field] = isNaN(numVal as any) ? null : numVal;

      // Auto-calculate Total Population if male/female is edited
      if (field === 'male_count' || field === 'female_count') {
        const m = field === 'male_count' ? numVal : (row.male_count ?? null);
        const f = field === 'female_count' ? numVal : (row.female_count ?? null);
        if (m !== null || f !== null) {
          row.total_population = Number(m || 0) + Number(f || 0);
        } else {
          row.total_population = null;
        }
      }

      // Auto-calculate Total Households when Male or Female Head is edited
      if (field === 'household_heads_m' || field === 'household_heads_f') {
        const hm = field === 'household_heads_m' ? numVal : (row.household_heads_m ?? null);
        const hf = field === 'household_heads_f' ? numVal : (row.household_heads_f ?? null);
        if (hm !== null || hf !== null) {
          const hhSum = Number(hm || 0) + Number(hf || 0);
          row.household_heads_total = hhSum;
          row.total_households = hhSum;
        } else {
          row.household_heads_total = null;
          row.total_households = null;
        }
      }

      // If user directly edits Total Households
      if (field === 'total_households' || field === 'household_heads_total') {
        row.total_households = numVal;
        row.household_heads_total = numVal;
      }

      return { ...prev, [barangayId]: row };
    });
  };

  // Compute pending differences
  const changes = useMemo(() => {
    const diff: Record<string, any> = {};
    const fields: (keyof DemographyRow)[] = [
      'male_count',
      'female_count',
      'total_population',
      'household_heads_m',
      'household_heads_f',
      'household_heads_total',
      'total_households',
      'age_under_18',
      'age_19_to_59',
      'age_60_plus',
    ];

    Object.keys(data).forEach(bId => {
      const orig = originalData[bId] || {};
      const current = data[bId] || {};

      fields.forEach(f => {
        const origVal = (orig as any)[f] ?? null;
        const currVal = (current as any)[f] ?? null;
        if (origVal !== currVal) {
          if (!diff[bId]) diff[bId] = {};
          diff[bId][f] = { old: origVal, new: currVal };
        }
      });
    });

    return diff;
  }, [data, originalData]);

  const hasChanges = Object.keys(changes).length > 0;

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (changedRows: Record<string, any>) => {
      if (canDirectSave) {
        const upsertRows = Object.keys(data).map(bId => {
          const row = data[bId] || {};
          const hhTotal = row.total_households ?? row.household_heads_total ?? (
            (row.household_heads_m !== null || row.household_heads_f !== null)
              ? (Number(row.household_heads_m || 0) + Number(row.household_heads_f || 0))
              : null
          );
          return {
            barangay_id: bId,
            year,
            month_updated: new Date().getMonth() + 1,
            male_count: row.male_count ?? null,
            female_count: row.female_count ?? null,
            total_population: row.total_population ?? null,
            household_heads_m: row.household_heads_m ?? null,
            household_heads_f: row.household_heads_f ?? null,
            household_heads_total: hhTotal,
            total_households: hhTotal,
            age_under_18: row.age_under_18 ?? null,
            age_19_to_59: row.age_19_to_59 ?? null,
            age_60_plus: row.age_60_plus ?? null,
            updated_at: new Date().toISOString(),
          };
        });

        // Try full upsert with all demography columns
        const { error: fullError } = await supabase
          .from('population_stats')
          .upsert(upsertRows, { onConflict: 'barangay_id,year' });

        if (fullError) {
          // If columns don't exist yet in population_stats table, fallback to core existing columns
          const fallbackRows = upsertRows.map(r => ({
            barangay_id: r.barangay_id,
            year: r.year,
            month_updated: r.month_updated,
            male_count: r.male_count,
            female_count: r.female_count,
            total_population: r.total_population,
            household_heads_m: r.household_heads_m,
            household_heads_f: r.household_heads_f,
            household_heads_total: r.household_heads_total,
            updated_at: r.updated_at,
          }));

          const { error: fallbackError } = await supabase
            .from('population_stats')
            .upsert(fallbackRows, { onConflict: 'barangay_id,year' });

          if (fallbackError) throw fallbackError;
        }

        // Also update any matching dynamic_data row for Demography so everything stays 100% synchronized
        try {
          const { data: demoSchemas } = await supabase
            .from('dynamic_schemas')
            .select('id')
            .in('department', ['Social Development', 'Demographics']);

          if (demoSchemas && demoSchemas.length > 0) {
            const dynamicUpserts = Object.keys(data).map(bId => {
              const row = data[bId] || {};
              const hhTotal = row.total_households ?? row.household_heads_total ?? (
                (row.household_heads_m !== null || row.household_heads_f !== null)
                  ? (Number(row.household_heads_m || 0) + Number(row.household_heads_f || 0))
                  : 0
              );
              return {
                barangay_id: bId,
                year,
                month_updated: String(new Date().getMonth() + 1),
                schema_id: demoSchemas[0].id,
                data: {
                  total_pop: { m: row.male_count || 0, f: row.female_count || 0, total: row.total_population || 0 },
                  hh_heads: { m: row.household_heads_m || 0, f: row.household_heads_f || 0, total: hhTotal },
                  total_households: hhTotal,
                  age_breakdown: {
                    under_18: row.age_under_18 || 0,
                    working_age: row.age_19_to_59 || 0,
                    seniors: row.age_60_plus || 0
                  }
                }
              };
            });
            await supabase.from('dynamic_data').upsert(dynamicUpserts, { onConflict: 'barangay_id,year,schema_id' });
          }
        } catch (syncErr) {
          console.warn("Syncing dynamic data skipped:", syncErr);
        }

        if (user) {
          await notifySuperAdminsOfDirectSave('Social Development', 'Demography', year, user.id);
        }
      } else {
        if (!user) throw new Error("Authentication required to submit for approval");
        await submitForApproval('Social Development', 'Demography', year, changedRows, user.id);
      }
    },
    onSuccess: () => {
      if (canDirectSave) {
        toast.success(`Population & Household stats for ${year} saved directly!`);
      } else {
        toast.success(`Demography updates submitted for approval!`);
      }
      queryClient.invalidateQueries({ queryKey: ['population_stats'] });
      queryClient.invalidateQueries({ queryKey: ['demographics_stats'] });
      queryClient.invalidateQueries({ queryKey: ['barangays'] });
      queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
      queryClient.invalidateQueries({ queryKey: ['social_dev_stats'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic_data'] });
      queryClient.invalidateQueries({ queryKey: ['latest_approval', 'Social Development', 'Demography', year] });
      setShowConfirmModal(false);
      setPendingChanges(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save population data.");
    },
  });

  const handleSaveClick = () => {
    if (!hasChanges) {
      toast("No changes to save.");
      return;
    }
    setPendingChanges(changes);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingChanges || saveMutation.isPending) return;
    try {
      await saveMutation.mutateAsync(pendingChanges);
    } catch (err) {
      console.error("Demography save error:", err);
    }
  };

  // Calculate grand totals across all 18 barangays accurately
  const summaryTotals = useMemo(() => {
    let totMale = 0;
    let totFemale = 0;
    let totPop = 0;
    let totHhMale = 0;
    let totHhFemale = 0;
    let totHouseholds = 0;
    let totUnder18 = 0;
    let tot19to59 = 0;
    let tot60Plus = 0;

    Object.values(data).forEach(r => {
      const m = Number(r.male_count || 0);
      const f = Number(r.female_count || 0);
      const p = Number(r.total_population || (m + f));
      const hhm = Number(r.household_heads_m || 0);
      const hhf = Number(r.household_heads_f || 0);
      const hh = Number(r.total_households ?? r.household_heads_total ?? (hhm + hhf));

      totMale += m;
      totFemale += f;
      totPop += p;
      totHhMale += hhm;
      totHhFemale += hhf;
      totHouseholds += hh;
      totUnder18 += Number(r.age_under_18 || 0);
      tot19to59 += Number(r.age_19_to_59 || 0);
      tot60Plus += Number(r.age_60_plus || 0);
    });

    return {
      totMale,
      totFemale,
      totPop,
      totHhMale,
      totHhFemale,
      totHouseholds,
      totUnder18,
      tot19to59,
      tot60Plus,
    };
  }, [data]);

  // Filter barangay list
  const filteredBarangays = useMemo(() => {
    return barangays.filter(b => 
      b.name.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [barangays, filterQuery]);

  // Export Data Builder
  const exportData = useMemo(() => {
    return barangays.map(b => {
      const r = data[b.id] || {};
      const hh = r.total_households ?? r.household_heads_total ?? (
        (r.household_heads_m !== null || r.household_heads_f !== null)
          ? (Number(r.household_heads_m || 0) + Number(r.household_heads_f || 0))
          : ''
      );
      return {
        barangay_name: b.name,
        male_count: r.male_count ?? '',
        female_count: r.female_count ?? '',
        total_population: r.total_population ?? '',
        household_heads_m: r.household_heads_m ?? '',
        household_heads_f: r.household_heads_f ?? '',
        total_households: hh,
        age_under_18: r.age_under_18 ?? '',
        age_19_to_59: r.age_19_to_59 ?? '',
        age_60_plus: r.age_60_plus ?? '',
      };
    });
  }, [barangays, data]);

  // Handle CSV Import
  const handleImport = (importedRows: any[]) => {
    if (!canWrite || isLocked) return;

    const bMap = new Map(barangays.map(b => [b.name.toLowerCase().replace(/[^a-z0-9]/g, ''), b.id]));
    let importedCount = 0;

    setData(prev => {
      const updated = { ...prev };
      importedRows.forEach(row => {
        const rawName = String(row.barangay_name || row.barangay || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const bId = bMap.get(rawName);
        if (bId) {
          importedCount++;
          const currentRow = { ...(updated[bId] || {}) };
          
          const parseNum = (v: any) => (v === undefined || v === null || v === '' ? null : Number(v));

          if (row.male_count !== undefined) currentRow.male_count = parseNum(row.male_count);
          if (row.female_count !== undefined) currentRow.female_count = parseNum(row.female_count);
          if (row.total_population !== undefined) currentRow.total_population = parseNum(row.total_population);
          else if (currentRow.male_count !== null || currentRow.female_count !== null) {
            currentRow.total_population = Number(currentRow.male_count || 0) + Number(currentRow.female_count || 0);
          }

          if (row.household_heads_m !== undefined) currentRow.household_heads_m = parseNum(row.household_heads_m);
          if (row.household_heads_f !== undefined) currentRow.household_heads_f = parseNum(row.household_heads_f);
          
          if (row.total_households !== undefined) {
            currentRow.total_households = parseNum(row.total_households);
            currentRow.household_heads_total = currentRow.total_households;
          } else if (currentRow.household_heads_m !== null || currentRow.household_heads_f !== null) {
            const hSum = Number(currentRow.household_heads_m || 0) + Number(currentRow.household_heads_f || 0);
            currentRow.household_heads_total = hSum;
            currentRow.total_households = hSum;
          }

          if (row.age_under_18 !== undefined) currentRow.age_under_18 = parseNum(row.age_under_18);
          if (row.age_19_to_59 !== undefined) currentRow.age_19_to_59 = parseNum(row.age_19_to_59);
          if (row.age_60_plus !== undefined) currentRow.age_60_plus = parseNum(row.age_60_plus);

          updated[bId] = currentRow;
        }
      });
      return updated;
    });

    if (importedCount > 0) {
      toast.success(`Imported demographics for ${importedCount} barangays! Review and click Save.`);
    } else {
      toast.error("Could not match any barangay names from the imported file.");
    }
  };

  if (isLoadingBarangays || isLoadingStats) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-gray-400">Loading official demographic records ({year})...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 2 Spacious Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Total Population */}
        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Population
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {summaryTotals.totPop.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              Male: <span className="font-semibold text-gray-700 dark:text-gray-300">{summaryTotals.totMale.toLocaleString()}</span> • Female: <span className="font-semibold text-gray-700 dark:text-gray-300">{summaryTotals.totFemale.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Households */}
        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Households
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {summaryTotals.totHouseholds.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              Avg size: <span className="font-semibold text-gray-700 dark:text-gray-300">{summaryTotals.totHouseholds > 0 ? (summaryTotals.totPop / summaryTotals.totHouseholds).toFixed(1) : '0'}</span> members / HH
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-64">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search barangay..."
              className="w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <DataExportImport
            data={exportData}
            columns={DEMOGRAPHY_EXPORT_COLUMNS}
            title={`Demographics (${year})`}
            onImport={handleImport}
          />
        </div>

        {/* Save / Submit Button */}
        {canWrite && (
          <button
            onClick={handleSaveClick}
            disabled={!hasChanges || saveMutation.isPending || isLocked}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {saveMutation.isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {canDirectSave ? 'Save Changes' : 'Submit for Approval'}
                {hasChanges && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                    {Object.keys(changes).length}
                  </span>
                )}
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Demographic Grid Table */}
      <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[850px] text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            {/* Top grouping row */}
            <tr>
              <th rowSpan={2} className="whitespace-nowrap px-4 py-3 font-medium border-b border-r dark:border-gray-800 min-w-[160px]">
                {entityName}
              </th>
              <th colSpan={3} className="whitespace-nowrap px-4 py-2 font-bold text-center border-b border-r dark:border-gray-800 bg-brand-50/60 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300">
                Population
              </th>
              <th colSpan={3} className="whitespace-nowrap px-4 py-2 font-bold text-center border-b border-r dark:border-gray-800 bg-gray-100/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300">
                Households
              </th>
              <th colSpan={3} className="whitespace-nowrap px-4 py-2 font-bold text-center border-b dark:border-gray-800 bg-gray-100/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300">
                Age Distribution
              </th>
            </tr>
            {/* Secondary column headers */}
            <tr>
              <th className="px-2.5 py-2 text-center border-b dark:border-gray-800 font-semibold min-w-[80px]">Male</th>
              <th className="px-2.5 py-2 text-center border-b dark:border-gray-800 font-semibold min-w-[80px]">Female</th>
              <th className="px-2.5 py-2 text-center border-b border-r dark:border-gray-800 font-bold bg-brand-100/40 dark:bg-brand-950/20 text-brand-800 dark:text-brand-300 min-w-[90px]">Total</th>
              
              <th className="px-2.5 py-2 text-center border-b dark:border-gray-800 font-semibold min-w-[80px]">Male Head</th>
              <th className="px-2.5 py-2 text-center border-b dark:border-gray-800 font-semibold min-w-[80px]">Female Head</th>
              <th className="px-2.5 py-2 text-center border-b border-r dark:border-gray-800 font-bold bg-brand-100/40 dark:bg-brand-950/20 text-brand-800 dark:text-brand-300 min-w-[95px]">Total</th>

              <th className="px-2.5 py-2 text-center border-b dark:border-gray-800 font-semibold min-w-[80px]">&lt; 18 Yrs</th>
              <th className="px-2.5 py-2 text-center border-b dark:border-gray-800 font-semibold min-w-[80px]">19–59 Yrs</th>
              <th className="px-2.5 py-2 text-center border-b dark:border-gray-800 font-semibold min-w-[80px]">60+ Yrs</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredBarangays.map((b) => {
              const r = data[b.id] || {};
              const isModified = !!changes[b.id];

              return (
                <tr
                  key={b.id}
                  className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    isModified ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                  }`}
                >
                  {/* Barangay Name */}
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white border-r dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span>{b.name}</span>
                      {isModified && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
                      )}
                    </div>
                  </td>

                  {/* Male Population */}
                  <td className="p-0 border-r dark:border-gray-800">
                    <input
                      type="number"
                      min="0"
                      value={r.male_count !== undefined && r.male_count !== null ? r.male_count : ''}
                      onChange={(e) => handleCellChange(b.id, 'male_count', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[65px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50/50 dark:focus:bg-brand-900/20 disabled:opacity-80"
                    />
                  </td>

                  {/* Female Population */}
                  <td className="p-0 border-r dark:border-gray-800">
                    <input
                      type="number"
                      min="0"
                      value={r.female_count !== undefined && r.female_count !== null ? r.female_count : ''}
                      onChange={(e) => handleCellChange(b.id, 'female_count', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[65px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50/50 dark:focus:bg-brand-900/20 disabled:opacity-80"
                    />
                  </td>

                  {/* Total Population (Auto-Calculated) */}
                  <td className="p-0 border-r dark:border-gray-800 bg-brand-50/30 dark:bg-brand-950/20 text-center font-bold text-brand-700 dark:text-brand-300">
                    <input
                      type="number"
                      min="0"
                      value={r.total_population !== undefined && r.total_population !== null ? r.total_population : ''}
                      onChange={(e) => handleCellChange(b.id, 'total_population', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[65px] bg-transparent px-2 py-2 text-center font-bold text-brand-800 dark:text-brand-200 outline-none focus:bg-brand-50 dark:focus:bg-brand-900/30 disabled:opacity-90"
                    />
                  </td>

                  {/* Male Household Heads */}
                  <td className="p-0 border-r dark:border-gray-800">
                    <input
                      type="number"
                      min="0"
                      value={r.household_heads_m !== undefined && r.household_heads_m !== null ? r.household_heads_m : ''}
                      onChange={(e) => handleCellChange(b.id, 'household_heads_m', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[65px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50/50 dark:focus:bg-brand-900/20 disabled:opacity-80"
                    />
                  </td>

                  {/* Female Household Heads */}
                  <td className="p-0 border-r dark:border-gray-800">
                    <input
                      type="number"
                      min="0"
                      value={r.household_heads_f !== undefined && r.household_heads_f !== null ? r.household_heads_f : ''}
                      onChange={(e) => handleCellChange(b.id, 'household_heads_f', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[65px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50/50 dark:focus:bg-brand-900/20 disabled:opacity-80"
                    />
                  </td>

                  {/* Total Households (Auto-Calculated from Heads, Editable if M/F blank) */}
                  <td className="p-0 border-r dark:border-gray-800 bg-brand-50/30 dark:bg-brand-950/20 text-center font-bold text-brand-700 dark:text-brand-300">
                    <input
                      type="number"
                      min="0"
                      value={r.total_households !== undefined && r.total_households !== null ? r.total_households : ''}
                      onChange={(e) => handleCellChange(b.id, 'total_households', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[65px] bg-transparent px-2 py-2 text-center font-bold text-brand-800 dark:text-brand-200 outline-none focus:bg-brand-50 dark:focus:bg-brand-900/30 disabled:opacity-90"
                    />
                  </td>

                  {/* Age < 18 */}
                  <td className="p-0 border-r dark:border-gray-800">
                    <input
                      type="number"
                      min="0"
                      value={r.age_under_18 !== undefined && r.age_under_18 !== null ? r.age_under_18 : ''}
                      onChange={(e) => handleCellChange(b.id, 'age_under_18', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50/50 dark:focus:bg-brand-900/20 disabled:opacity-80"
                    />
                  </td>

                  {/* Age 19-59 */}
                  <td className="p-0 border-r dark:border-gray-800">
                    <input
                      type="number"
                      min="0"
                      value={r.age_19_to_59 !== undefined && r.age_19_to_59 !== null ? r.age_19_to_59 : ''}
                      onChange={(e) => handleCellChange(b.id, 'age_19_to_59', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50/50 dark:focus:bg-brand-900/20 disabled:opacity-80"
                    />
                  </td>

                  {/* Age 60+ */}
                  <td className="p-0">
                    <input
                      type="number"
                      min="0"
                      value={r.age_60_plus !== undefined && r.age_60_plus !== null ? r.age_60_plus : ''}
                      onChange={(e) => handleCellChange(b.id, 'age_60_plus', e.target.value)}
                      disabled={!canWrite || isLocked}
                      placeholder="0"
                      className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50/50 dark:focus:bg-brand-900/20 disabled:opacity-80"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Grand Totals Footer */}
          <tfoot className="bg-gray-100/80 dark:bg-gray-900 font-bold border-t-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
            <tr>
              <td className="whitespace-nowrap px-4 py-3 font-extrabold border-r dark:border-gray-800">
                Municipal Total
              </td>
              <td className="px-2 py-3 text-center border-r dark:border-gray-800 font-bold">{summaryTotals.totMale.toLocaleString()}</td>
              <td className="px-2 py-3 text-center border-r dark:border-gray-800 font-bold">{summaryTotals.totFemale.toLocaleString()}</td>
              <td className="px-2 py-3 text-center border-r dark:border-gray-800 font-extrabold bg-brand-100/60 dark:bg-brand-950/60 text-brand-900 dark:text-brand-200">
                {summaryTotals.totPop.toLocaleString()}
              </td>
              <td className="px-2 py-3 text-center border-r dark:border-gray-800 font-bold">{summaryTotals.totHhMale.toLocaleString()}</td>
              <td className="px-2 py-3 text-center border-r dark:border-gray-800 font-bold">{summaryTotals.totHhFemale.toLocaleString()}</td>
              <td className="px-2 py-3 text-center border-r dark:border-gray-800 font-extrabold bg-brand-100/60 dark:bg-brand-950/60 text-brand-900 dark:text-brand-200">
                {summaryTotals.totHouseholds.toLocaleString()}
              </td>
              <td className="px-2 py-3 text-center border-r dark:border-gray-800 font-bold">{summaryTotals.totUnder18.toLocaleString()}</td>
              <td className="px-2 py-3 text-center border-r dark:border-gray-800 font-bold">{summaryTotals.tot19to59.toLocaleString()}</td>
              <td className="px-2 py-3 text-center font-bold">{summaryTotals.tot60Plus.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onCancel={() => {
            if (!saveMutation.isPending) {
              setShowConfirmModal(false);
            }
          }}
          onConfirm={handleConfirmSave}
          isLoading={saveMutation.isPending}
          confirmLabel={canDirectSave ? "Save Changes" : "Submit for Approval"}
          loadingLabel={canDirectSave ? "Saving Changes..." : "Submitting for Approval..."}
          title={canDirectSave ? "Save Demographics Directly" : "Submit Demographics for Approval"}
          message={
            canDirectSave
              ? `You are directly saving population and household stats for ${year}. This will immediately update the maps on the login and landing pages and live dashboards.`
              : `Your changes to population and household stats for ${year} will be submitted to the Super Admin for review and approval.`
          }
        />
      )}
    </div>
  );
}

