import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { supabase } from '@/config/supabase';
import type { Database } from '@/types/database';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { submitForApproval, getLatestApproval, notifySuperAdminsOfDirectSave } from '@/utils/approvalUtils';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { DataExportImport } from '@/components/common/DataExportImport';

import { fetchSchools, fetchBarangays, fetchDaycareCenters, getSingleYearAgeEntities, getAgeBracketEntities, OFFICIAL_BARANGAY_NAMES } from '@/services/api';

type Barangay = Database['public']['Tables']['barangays']['Row'];
type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];

interface FieldDef {
  id: string;
  name: string;
  type: 'gender_split' | 'single_value';
  chartType: 'bar' | 'pie' | 'stat_card' | 'hidden';
}

interface DynamicDataEntryGridProps {
  schema: DynamicSchema;
  barangays: Barangay[];
  year: number;
  entityName?: string;
}

export default function DynamicDataEntryGrid({ schema, barangays, year, entityName = "Barangay" }: DynamicDataEntryGridProps) {
  const { canWrite, canDirectSave } = useRole();
  const { user } = useAuth();
  
  const [data, setData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const queryClient = useQueryClient();

  const sData = schema.schema as any;
  const targetEntity = sData?.targetEntity || 'barangays';

  const isAgeTable = targetEntity === 'age_0_to_99_plus' || targetEntity === 'age_single_year' || targetEntity === 'age_1_to_99';
  const isAgeBracketTable = targetEntity === 'age_brackets';

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: fetchSchools,
    enabled: targetEntity === 'primary_schools' || targetEntity === 'secondary_schools' || targetEntity === 'all_schools'
  });

  const { data: daycareCenters = [] } = useQuery({
    queryKey: ['daycare_centers'],
    queryFn: fetchDaycareCenters,
    enabled: targetEntity === 'eccd_centers' || targetEntity === 'daycare_centers'
  });

  const { data: fetchedBarangays = [] } = useQuery({
    queryKey: ['clean_barangays'],
    queryFn: fetchBarangays,
    enabled: targetEntity === 'barangays'
  });

  const cleanBarangays = (barangays && barangays.length > 0)
    ? barangays.filter((b: any) => {
        if (b.district) {
          const d = b.district.toLowerCase();
          if (d.startsWith('school') || d.startsWith('daycare') || d.startsWith('eccd') || d.startsWith('cdc') || d.startsWith('age')) {
            return false;
          }
        }
        const cleanName = (b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanName.startsWith('age')) return false;
        if (cleanName === 'santamaria' || cleanName === 'stamariapob') return true;
        if (cleanName === 'liwasan') return true;
        if (cleanName === 'pagsanahan') return true;
        if (cleanName === 'patrocino') return true;
        return OFFICIAL_BARANGAY_NAMES.some(n => n.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanName);
      })
    : fetchedBarangays;

  let entitiesToDisplay: any[] = cleanBarangays;
  let currentEntityLabel = entityName || "Barangay";

  if (targetEntity === 'primary_schools') {
    entitiesToDisplay = schools.filter((s: any) => s.district === 'School-Primary' || s.district?.toLowerCase().includes('primary'));
    currentEntityLabel = "Primary School";
  } else if (targetEntity === 'secondary_schools') {
    entitiesToDisplay = schools.filter((s: any) => s.district === 'School-Secondary' || s.district?.toLowerCase().includes('secondary'));
    currentEntityLabel = "Secondary School";
  } else if (targetEntity === 'all_schools') {
    entitiesToDisplay = schools;
    currentEntityLabel = "School";
  } else if (targetEntity === 'eccd_centers' || targetEntity === 'daycare_centers') {
    entitiesToDisplay = daycareCenters;
    currentEntityLabel = "ECCD / Daycare Center";
  } else if (isAgeTable) {
    entitiesToDisplay = getSingleYearAgeEntities();
    currentEntityLabel = "Single-Year Age (Municipality)";
  } else if (isAgeBracketTable) {
    entitiesToDisplay = getAgeBracketEntities();
    currentEntityLabel = "Age Group / Cohort";
  } else {
    entitiesToDisplay = cleanBarangays;
    currentEntityLabel = "Barangay";
  }

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', schema.department, schema.tab_name, year],
    queryFn: () => getLatestApproval(schema.department, schema.tab_name, year)
  });

  const isPercentage = sData?.isPercentage || sData?.tableType === 'percentage';
  const isMultiGroup = sData?.tableCategory === 'multi_group' || sData?.tableType === 'multi_group';
  const percentageGroups = (sData?.groups || []) as { id: string; groupTitle?: string; totalTitle: string; fields: { id: string; name: string }[] }[];
  const multiGroups = (sData?.multiGroups || []) as { id: string; groupTitle: string; totalTitle?: string; fields: FieldDef[] }[];
  const fields = (Array.isArray(sData) ? sData : (sData?.fields || [])) as FieldDef[];
  const isLocked = latestApproval && latestApproval.status === 'pending' && !canDirectSave;

  const { data: fetchedData, isLoading: loading } = useQuery({
    queryKey: ['dynamic_data', schema.id, year],
    queryFn: async () => {
      const { data: dynData, error } = await supabase
        .from('dynamic_data')
        .select('*')
        .eq('schema_id', schema.id)
        .eq('year', year);

      if (error) throw error;

      const dMap: Record<string, any> = {};
      if (dynData) {
        dynData.forEach(row => {
          dMap[row.barangay_id] = row.data;
        });
      }

      const searchParams = new URLSearchParams(window.location.search);
      const resubmitId = searchParams.get('resubmit');
      
      if (resubmitId) {
        const { data: approval } = await supabase.from('data_approvals').select('changes, tab').eq('id', resubmitId).single();
        if (approval && approval.changes && approval.tab === schema.tab_name) {
          const changes = approval.changes as any;
          Object.keys(changes).forEach(bId => {
            if (!dMap[bId]) dMap[bId] = {};
            const bChanges = changes[bId];
            Object.keys(bChanges).forEach(fieldId => {
               dMap[bId][fieldId] = bChanges[fieldId].new;
            });
          });
          toast.success("Loaded rejected data for resubmission");
        }
      }

      return dMap;
    }
  });

  useEffect(() => {
    if (fetchedData) {
      setData(fetchedData);
      setOriginalData(JSON.parse(JSON.stringify(fetchedData)));
    }
  }, [fetchedData]);

  const handleChange = (barangayId: string, fieldId: string, subKey: string | null, value: string) => {
    const numValue = value === '' ? null : Number(value);
    
    setData(prev => {
      const bData = { ...(prev[barangayId] || {}) };
      
      if (subKey) {
        bData[fieldId] = { ...(bData[fieldId] || {}), [subKey]: numValue };
      } else {
        bData[fieldId] = { ...(bData[fieldId] || {}), value: numValue };
      }
      
      return { ...prev, [barangayId]: bData };
    });
  };

  const mutation = useMutation({
    mutationFn: async (changedData: Record<string, any>) => {
      // Ensure daycare entities exist in the barangays table if needed
      if (targetEntity === 'eccd_centers' || targetEntity === 'daycare_centers') {
        const centersToEnsure = entitiesToDisplay.map(e => ({
          id: e.id,
          name: e.name,
          district: e.district || 'Daycare'
        }));
        await supabase.from('barangays').upsert(centersToEnsure, { onConflict: 'id' });
      }

      if (canDirectSave) {
        const upsertData = Object.keys(changedData).map(bId => {
           const newData = { ...(data[bId] || {}) };
           Object.keys(changedData[bId]).forEach(fieldId => {
             newData[fieldId] = changedData[bId][fieldId].new;
           });

           return {
             barangay_id: bId,
             year,
             month_updated: new Date().getMonth() + 1 + '',
             schema_id: schema.id,
             data: newData
           };
        });
        
        const { error } = await supabase.from('dynamic_data').upsert(upsertData, { onConflict: 'barangay_id,year,schema_id' });
        if (error) throw error;
        await notifySuperAdminsOfDirectSave(schema.department, schema.tab_name, year, user!.id);
      } else {
        await submitForApproval(schema.department, schema.tab_name, year, changedData, user!.id);
      }
    },
    onSuccess: () => {
      if (canDirectSave) {
        toast.success(`${schema.tab_name} data saved directly!`);
      } else {
        toast.success(`Changes submitted for approval!`);
      }
      queryClient.invalidateQueries({ queryKey: ['dynamic_data', schema.id, year] });
      queryClient.invalidateQueries({ queryKey: ['latest_approval', schema.department, schema.tab_name, year] });
      setShowConfirmModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save data');
    }
  });

  const handleSaveAll = () => {
    try {
      const changedData: Record<string, any> = {};
      
      entitiesToDisplay.forEach(b => {
        const row = data[b.id] || {};
        const originalRow = originalData[b.id] || {};
        
        let hasChanges = false;
        const currentChanges: any = {};

        if (isPercentage) {
          percentageGroups.forEach(g => {
            const oldVal = originalRow[g.id] || {};
            const newVal = row[g.id] || {};
            
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              hasChanges = true;
            }
            currentChanges[g.id] = { old: oldVal, new: newVal };
          });
        } else if (isMultiGroup) {
          multiGroups.forEach(mg => {
            mg.fields.forEach(f => {
              const oldVal = originalRow[f.id] || {};
              const newVal = row[f.id] || {};
              
              if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                hasChanges = true;
              }
              currentChanges[f.id] = { old: oldVal, new: newVal };
            });
          });
        } else {
          fields.forEach(f => {
            const oldVal = originalRow[f.id] || {};
            const newVal = row[f.id] || {};
            
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              hasChanges = true;
            }
            currentChanges[f.id] = { old: oldVal, new: newVal };
          });
        }

        if (hasChanges) {
          changedData[b.id] = currentChanges;
        }
      });

      if (Object.keys(changedData).length === 0) {
         toast('No changes to save.');
         return;
      }

      if (isLocked) {
        toast.error('Data is locked pending approval.');
        return;
      }

      if (latestApproval?.status === 'pending' && !canDirectSave) {
        setPendingChanges(changedData);
        setShowConfirmModal(true);
        return;
      }

      mutation.mutate(changedData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to prepare data');
    }
  };

  const exportColumns = isPercentage
    ? [
        { header: currentEntityLabel, key: 'barangay_name' },
        ...percentageGroups.flatMap(g => [
          { header: `${g.totalTitle}`, key: `${g.id}_total` },
          ...g.fields.flatMap(sf => [
            { header: `${sf.name}`, key: `${g.id}_${sf.id}` },
            { header: `% ${sf.name}`, key: `${g.id}_${sf.id}_pct` }
          ])
        ])
      ]
    : isMultiGroup
    ? [
        { header: currentEntityLabel, key: 'barangay_name' },
        ...multiGroups.flatMap(mg =>
          mg.fields.flatMap(f => {
            if (f.type === 'gender_split') {
              return [
                { header: `[${mg.groupTitle}] ${f.name} (M)`, key: `${f.id}_m` },
                { header: `[${mg.groupTitle}] ${f.name} (F)`, key: `${f.id}_f` }
              ];
            } else {
              return [{ header: `[${mg.groupTitle}] ${f.name}`, key: f.id }];
            }
          })
        )
      ]
    : [
        { header: currentEntityLabel, key: 'barangay_name' },
        ...fields.flatMap(f => {
          if (f.type === 'gender_split') {
            return [
              { header: `${f.name} (M)`, key: `${f.id}_m` },
              { header: `${f.name} (F)`, key: `${f.id}_f` }
            ];
          } else {
            return [{ header: f.name, key: f.id }];
          }
        })
      ];

  const exportData = entitiesToDisplay.map(b => {
    const bData = data[b.id] || {};
    const row: any = { barangay_name: b.name };

    if (isPercentage) {
      percentageGroups.forEach(g => {
        const gData = bData[g.id] || {};
        const total = Number(gData.total || 0);
        row[`${g.id}_total`] = gData.total;
        
        g.fields.forEach(sf => {
          const count = Number(gData[sf.id] || 0);
          row[`${g.id}_${sf.id}`] = gData[sf.id];
          row[`${g.id}_${sf.id}_pct`] = total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '--';
        });
      });
    } else if (isMultiGroup) {
      multiGroups.forEach(mg => {
        mg.fields.forEach(f => {
          if (f.type === 'gender_split') {
            row[`${f.id}_m`] = bData[f.id]?.m;
            row[`${f.id}_f`] = bData[f.id]?.f;
          } else {
            row[f.id] = bData[f.id]?.value;
          }
        });
      });
    } else {
      fields.forEach(f => {
         if (f.type === 'gender_split') {
           row[`${f.id}_m`] = bData[f.id]?.m;
           row[`${f.id}_f`] = bData[f.id]?.f;
         } else {
           row[f.id] = bData[f.id]?.value;
         }
      });
    }
    return row;
  });

  const headKeyMatch = (rowObj: any, searchKey: string) => {
    if (!searchKey || !rowObj) return undefined;
    const targetLower = searchKey.trim().toLowerCase();
    for (const k of Object.keys(rowObj)) {
      if (k.trim().toLowerCase() === targetLower) {
        return rowObj[k];
      }
    }
    return undefined;
  };

  const handleImport = (importedData: any[]) => {
    const newData = { ...data };
    importedData.forEach(row => {
      const bName = (
        row.barangay_name || 
        row.entity_name || 
        row.school_name || 
        row.daycare_center || 
        headKeyMatch(row, 'Daycare Center') || 
        headKeyMatch(row, 'Center') || 
        headKeyMatch(row, 'School') || 
        headKeyMatch(row, 'Barangay') || 
        Object.values(row)[0] || 
        ''
      ).toString().trim().toLowerCase();

      const b = entitiesToDisplay.find(e => {
        const eName = e.name.trim().toLowerCase();
        return eName === bName || eName.includes(bName) || bName.includes(eName);
      });

      if (b) {
        newData[b.id] = { ...(newData[b.id] || {}) };

        if (isPercentage) {
          percentageGroups.forEach(g => {
            const totVal = row[`${g.id}_total`] ?? headKeyMatch(row, g.totalTitle);
            if (totVal !== undefined && totVal !== null && totVal !== '') {
              newData[b.id][g.id] = { ...(newData[b.id][g.id] || {}), total: Number(totVal) };
            }
            g.fields.forEach(sf => {
              const val = row[`${g.id}_${sf.id}`] ?? headKeyMatch(row, sf.name);
              if (val !== undefined && val !== null && val !== '') {
                newData[b.id][g.id] = { ...(newData[b.id][g.id] || {}), [sf.id]: Number(val) };
              }
            });
          });
        } else if (isMultiGroup) {
          multiGroups.forEach(mg => {
            mg.fields.forEach(f => {
              if (f.type === 'gender_split') {
                const m = row[`${f.id}_m`]
                  ?? headKeyMatch(row, `[${mg.groupTitle}] ${f.name} (M)`)
                  ?? headKeyMatch(row, `[${mg.groupTitle}] ${f.name} (Male)`)
                  ?? headKeyMatch(row, `${f.name} (M)`)
                  ?? headKeyMatch(row, `${f.name}_m`);
                const fVal = row[`${f.id}_f`]
                  ?? headKeyMatch(row, `[${mg.groupTitle}] ${f.name} (F)`)
                  ?? headKeyMatch(row, `[${mg.groupTitle}] ${f.name} (Female)`)
                  ?? headKeyMatch(row, `${f.name} (F)`)
                  ?? headKeyMatch(row, `${f.name}_f`);
                if (m !== undefined && m !== null && m !== '') {
                   newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), m: Number(m) };
                }
                if (fVal !== undefined && fVal !== null && fVal !== '') {
                   newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), f: Number(fVal) };
                }
              } else {
                const val = row[f.id] 
                  ?? headKeyMatch(row, `[${mg.groupTitle}] ${f.name}`)
                  ?? headKeyMatch(row, f.name);
                if (val !== undefined && val !== null && val !== '') {
                   newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), value: Number(val) };
                }
              }
            });
          });
        } else {
          fields.forEach(f => {
            if (f.type === 'gender_split') {
              const m = row[`${f.id}_m`] 
                ?? headKeyMatch(row, `${f.name} (M)`) 
                ?? headKeyMatch(row, `${f.name} (Male)`)
                ?? headKeyMatch(row, `${f.name}_m`)
                ?? headKeyMatch(row, `${f.name}_male`)
                ?? headKeyMatch(row, `${f.name} M`)
                ?? headKeyMatch(row, `${f.name} Male`);
                
              const fVal = row[`${f.id}_f`] 
                ?? headKeyMatch(row, `${f.name} (F)`) 
                ?? headKeyMatch(row, `${f.name} (Female)`)
                ?? headKeyMatch(row, `${f.name}_f`)
                ?? headKeyMatch(row, `${f.name}_female`)
                ?? headKeyMatch(row, `${f.name} F`)
                ?? headKeyMatch(row, `${f.name} Female`);

              if (m !== undefined && m !== null && m !== '') {
                 newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), m: Number(m) };
              }
              if (fVal !== undefined && fVal !== null && fVal !== '') {
                 newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), f: Number(fVal) };
              }
            } else {
              const val = row[f.id] ?? headKeyMatch(row, f.name);
              if (val !== undefined && val !== null && val !== '') {
                 newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), value: Number(val) };
              }
            }
          });
        }
      }
    });
    setData(newData);
    toast.success('Data imported successfully. Review and save changes.');
  };

  const filteredEntities = filterQuery.trim()
    ? entitiesToDisplay.filter(e => {
        const q = filterQuery.toLowerCase().trim();
        const n = (e.name || '').toLowerCase();
        const b = (e.bracket || '').toLowerCase();
        const d = (e.district || '').toLowerCase();
        return n.includes(q) || b.includes(q) || d.includes(q) || (e.age !== undefined && String(e.age) === q);
      })
    : entitiesToDisplay;

  const renderEntityCell = (b: any) => {
    const isPrivate = Boolean(
      b.isPrivate || 
      b.district === 'School-Private' || 
      b.name?.includes('Holy Angel') || 
      b.name?.includes('Moises D. Fernandez')
    );

    return (
      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{b.name}</span>
          {b.bracket && (
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
              b.bracketKey === 'infants' || b.bracketKey === 'toddlers'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : b.bracketKey === 'children'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : b.bracketKey === 'youth'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : b.bracketKey === 'working_age'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
              {b.bracket}
            </span>
          )}
          {isPrivate && (
            <span className="inline-flex items-center rounded-md bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              (Private)
            </span>
          )}
        </div>
      </td>
    );
  };

  const hasNoFields = isPercentage ? percentageGroups.length === 0 : isMultiGroup ? multiGroups.length === 0 : fields.length === 0;

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 mb-4 w-full min-w-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {canWrite && exportData && exportColumns && (
            <DataExportImport 
              data={exportData} 
              columns={exportColumns}
              title={`${schema.tab_name} (${year})`}
              onImport={handleImport} 
            />
          )}

          {entitiesToDisplay.length > 20 && (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={`Filter ${currentEntityLabel.toLowerCase()}s (e.g. 60, Youth, Toddlers)...`}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none"
              />
              {filterQuery && (
                <button 
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {canWrite && (
          <button
            onClick={handleSaveAll}
            disabled={mutation.isPending || loading || !canWrite || isLocked}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50 ml-auto shrink-0 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">Loading grid...</div>
      ) : hasNoFields ? (
        <div className="py-10 text-center text-sm text-gray-500">No fields defined for this table.</div>
      ) : entitiesToDisplay.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base">
            i
          </div>
          <p className="font-semibold text-gray-800 dark:text-white">
            No {currentEntityLabel} records found
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {targetEntity.includes('eccd') || targetEntity.includes('daycare')
              ? "You can add your Daycare Centers & ECCD facilities directly in src/config/daycareCenters.ts."
              : `No ${currentEntityLabel.toLowerCase()} entries are available.`}
          </p>
        </div>
      ) : isPercentage ? (
        /* Percentage Table Render */
        <>
          <div className="hidden lg:block w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[750px] text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>{currentEntityLabel}</th>
                  {percentageGroups.map((g, gIdx) => (
                    <th 
                      key={g.id} 
                      className={`whitespace-nowrap px-4 py-2 font-bold text-center border-b border-l ${gIdx === percentageGroups.length - 1 ? 'border-r' : ''} dark:border-gray-800 bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300`} 
                      colSpan={1 + g.fields.length * 2}
                    >
                      {g.groupTitle || g.totalTitle}
                    </th>
                  ))}
                </tr>
                <tr>
                  {percentageGroups.map((g) => (
                    <React.Fragment key={g.id + '_subcols'}>
                      <th className="px-3 py-2 text-center font-semibold border-l dark:border-gray-800 bg-gray-100/70 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300">
                        {g.totalTitle} (Count)
                      </th>
                      {g.fields.map(sf => (
                        <React.Fragment key={sf.id}>
                          <th className="px-3 py-2 text-center font-medium border-l dark:border-gray-800">
                            {sf.name}
                          </th>
                          <th className="px-3 py-2 text-center font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-l dark:border-gray-800">
                            % {sf.name}
                          </th>
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredEntities.map((b) => {
                  const bData = data[b.id] || {};

                  return (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {renderEntityCell(b)}
                      {percentageGroups.map((g) => {
                        const gData = bData[g.id] || {};
                        const totalVal = gData.total !== undefined && gData.total !== null ? Number(gData.total) : 0;

                        return (
                          <React.Fragment key={g.id}>
                            <td className="border-l dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={gData.total !== undefined && gData.total !== null ? gData.total : ''}
                                onChange={(e) => handleChange(b.id, g.id, 'total', e.target.value)}
                                disabled={!canWrite || isLocked}
                                className="w-full min-w-[70px] bg-transparent px-2 py-2 text-center font-semibold text-gray-900 dark:text-white outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100"
                              />
                            </td>
                            {g.fields.map(sf => {
                              const fieldVal = gData[sf.id] !== undefined && gData[sf.id] !== null ? Number(gData[sf.id]) : null;
                              const pct = totalVal > 0 && fieldVal !== null ? ((fieldVal / totalVal) * 100).toFixed(1) : null;

                              return (
                                <React.Fragment key={sf.id}>
                                  <td className="border-l dark:border-gray-800">
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={gData[sf.id] !== undefined && gData[sf.id] !== null ? gData[sf.id] : ''}
                                      onChange={(e) => handleChange(b.id, g.id, sf.id, e.target.value)}
                                      disabled={!canWrite || isLocked}
                                      className="w-full min-w-[65px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100"
                                    />
                                  </td>
                                  <td className="border-l dark:border-gray-800 bg-amber-50/40 dark:bg-amber-950/20 text-center font-bold text-amber-700 dark:text-amber-300 px-2 py-2">
                                    {pct !== null ? `${pct}%` : '--'}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-amber-50/80 dark:bg-amber-950/30 font-bold border-t-2 border-amber-300 dark:border-amber-800 text-gray-900 dark:text-white">
                {(() => {
                  const totals: Record<string, { total: number; subfields: Record<string, number> }> = {};
                  percentageGroups.forEach(g => {
                    totals[g.id] = { total: 0, subfields: {} };
                    g.fields.forEach(sf => { totals[g.id].subfields[sf.id] = 0; });
                  });

                  entitiesToDisplay.forEach(b => {
                    const bData = data[b.id] || {};
                    percentageGroups.forEach(g => {
                      const gData = bData[g.id] || {};
                      totals[g.id].total += Number(gData.total || 0);
                      g.fields.forEach(sf => {
                        totals[g.id].subfields[sf.id] += Number(gData[sf.id] || 0);
                      });
                    });
                  });

                  return (
                    <tr>
                      <td className="whitespace-nowrap px-4 py-3 font-extrabold text-amber-800 dark:text-amber-300">Total</td>
                      {percentageGroups.map(g => {
                        const gTot = totals[g.id].total;
                        return (
                          <React.Fragment key={g.id}>
                            <td className="border-l dark:border-gray-800 text-center font-extrabold px-2 py-3 bg-gray-100/70 dark:bg-gray-800/80 text-gray-900 dark:text-white">
                              {gTot.toLocaleString()}
                            </td>
                            {g.fields.map(sf => {
                              const sfCount = totals[g.id].subfields[sf.id];
                              const sfPct = gTot > 0 ? ((sfCount / gTot) * 100).toFixed(1) + '%' : '--';
                              return (
                                <React.Fragment key={sf.id}>
                                  <td className="border-l dark:border-gray-800 text-center font-bold px-2 py-3 text-gray-800 dark:text-gray-200">
                                    {sfCount.toLocaleString()}
                                  </td>
                                  <td className="border-l dark:border-gray-800 text-center font-extrabold px-2 py-3 bg-amber-100/90 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                    {sfPct}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </>
      ) : isMultiGroup ? (
        /* Multi-Group Subtable Render */
        <>
          <div className="hidden lg:block w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[750px] text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>{currentEntityLabel}</th>
                  {multiGroups.map((mg, mgIdx) => {
                    const colCount = mg.fields.reduce((acc, f) => acc + (f.type === 'gender_split' ? 3 : 1), 0);
                    return (
                      <th 
                        key={mg.id} 
                        className={`whitespace-nowrap px-4 py-2 font-bold text-center border-b border-l ${mgIdx === multiGroups.length - 1 ? 'border-r' : ''} dark:border-gray-800 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300`} 
                        colSpan={colCount}
                      >
                        {mg.groupTitle}
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  {multiGroups.map((mg) => (
                    <React.Fragment key={mg.id + '_subcols'}>
                      {mg.fields.map(f => (
                        <React.Fragment key={f.id}>
                          {f.type === 'gender_split' ? (
                            <>
                              <th className="px-2 py-2 text-center border-l dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/60 font-semibold">{f.name} (M)</th>
                              <th className="px-2 py-2 text-center font-semibold">{f.name} (F)</th>
                              <th className="px-2 py-2 text-center font-bold bg-indigo-100/40 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300">Total</th>
                            </>
                          ) : (
                            <th className="px-3 py-2 text-center font-semibold border-l dark:border-gray-800">
                              {f.name}
                            </th>
                          )}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredEntities.map((b) => {
                  const bData = data[b.id] || {};

                  return (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {renderEntityCell(b)}
                      {multiGroups.map((mg) => (
                        <React.Fragment key={mg.id}>
                          {mg.fields.map(f => {
                            const fData = bData[f.id] || {};

                            if (f.type === 'gender_split') {
                              const m = fData.m || 0;
                              const fVal = fData.f || 0;
                              return (
                                <React.Fragment key={f.id}>
                                  <td className="border-l dark:border-gray-800">
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={fData.m !== undefined && fData.m !== null ? fData.m : ''} 
                                      onChange={(e) => handleChange(b.id, f.id, 'm', e.target.value)} 
                                      disabled={!canWrite || isLocked} 
                                      className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/20 disabled:opacity-100" 
                                    />
                                  </td>
                                  <td>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={fData.f !== undefined && fData.f !== null ? fData.f : ''} 
                                      onChange={(e) => handleChange(b.id, f.id, 'f', e.target.value)} 
                                      disabled={!canWrite || isLocked} 
                                      className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/20 disabled:opacity-100" 
                                    />
                                  </td>
                                  <td className="bg-indigo-50/30 dark:bg-indigo-950/20 text-center font-bold text-indigo-700 dark:text-indigo-300">
                                    {m + fVal}
                                  </td>
                                </React.Fragment>
                              );
                            } else {
                              return (
                                <td key={f.id} className="border-l dark:border-gray-800">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={fData.value !== undefined && fData.value !== null ? fData.value : ''} 
                                    onChange={(e) => handleChange(b.id, f.id, null, e.target.value)} 
                                    disabled={!canWrite || isLocked} 
                                    className="w-full min-w-[65px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/20 disabled:opacity-100" 
                                  />
                                </td>
                              );
                            }
                          })}
                        </React.Fragment>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-indigo-50/80 dark:bg-indigo-950/30 font-bold border-t-2 border-indigo-300 dark:border-indigo-800 text-gray-900 dark:text-white">
                {(() => {
                  const totals: Record<string, { m: number; f: number; total: number; value: number }> = {};
                  multiGroups.forEach(mg => {
                    mg.fields.forEach(f => {
                      totals[f.id] = { m: 0, f: 0, total: 0, value: 0 };
                    });
                  });

                  entitiesToDisplay.forEach(b => {
                    const bData = data[b.id] || {};
                    multiGroups.forEach(mg => {
                      mg.fields.forEach(f => {
                        const fData = bData[f.id] || {};
                        if (f.type === 'gender_split') {
                          const m = Number(fData.m || 0);
                          const fVal = Number(fData.f || 0);
                          totals[f.id].m += m;
                          totals[f.id].f += fVal;
                          totals[f.id].total += (m + fVal);
                        } else {
                          totals[f.id].value += Number(fData.value || 0);
                        }
                      });
                    });
                  });

                  return (
                    <tr>
                      <td className="whitespace-nowrap px-4 py-3 font-extrabold text-indigo-700 dark:text-indigo-300">Total</td>
                      {multiGroups.map(mg => (
                        <React.Fragment key={mg.id}>
                          {mg.fields.map(f => {
                            if (f.type === 'gender_split') {
                              return (
                                <React.Fragment key={f.id}>
                                  <td className="border-l dark:border-gray-800 text-center font-bold px-2 py-3 text-blue-700 dark:text-blue-300">
                                    {totals[f.id].m.toLocaleString()}
                                  </td>
                                  <td className="text-center font-bold px-2 py-3 text-pink-700 dark:text-pink-300">
                                    {totals[f.id].f.toLocaleString()}
                                  </td>
                                  <td className="text-center font-extrabold px-2 py-3 bg-indigo-100/60 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200">
                                    {totals[f.id].total.toLocaleString()}
                                  </td>
                                </React.Fragment>
                              );
                            } else {
                              return (
                                <td key={f.id} className="border-l dark:border-gray-800 text-center font-bold px-3 py-3 text-gray-900 dark:text-white">
                                  {totals[f.id].value.toLocaleString()}
                                </td>
                              );
                            }
                          })}
                        </React.Fragment>
                      ))}
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        /* Standard / Budget Table Render */
        <>
          <div className="hidden lg:block w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[750px] text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>{currentEntityLabel}</th>
                  {fields.map(f => (
                    <th key={f.id} className={`whitespace-nowrap px-4 py-2 font-medium text-center border-b border-l ${f === fields[fields.length-1] ? 'border-r' : ''} dark:border-gray-800`} colSpan={f.type === 'gender_split' ? 3 : 1} rowSpan={f.type === 'gender_split' ? 1 : 2}>
                      {f.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  {fields.map(f => {
                    if (f.type === 'gender_split') {
                      return (
                        <React.Fragment key={f.id + '_sub'}>
                          <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
                          <th className="px-2 py-2 text-center">F</th>
                          <th className={`px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50 ${f === fields[fields.length-1] ? 'border-r dark:border-gray-800' : ''}`}>Total</th>
                        </React.Fragment>
                      )
                    }
                    return null;
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredEntities.map((b) => {
                  const bData = data[b.id] || {};
                  
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {renderEntityCell(b)}
                      
                      {fields.map(f => {
                        const fData = bData[f.id] || {};
                        
                        if (f.type === 'gender_split') {
                          const m = fData.m || 0;
                          const fVal = fData.f || 0;
                          return (
                            <React.Fragment key={f.id}>
                              <td className="border-l dark:border-gray-800">
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={fData.m !== undefined && fData.m !== null ? fData.m : ''} 
                                  onChange={(e) => handleChange(b.id, f.id, 'm', e.target.value)} 
                                  disabled={!canWrite || isLocked} 
                                  className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:bg-transparent disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={fData.f !== undefined && fData.f !== null ? fData.f : ''} 
                                  onChange={(e) => handleChange(b.id, f.id, 'f', e.target.value)} 
                                  disabled={!canWrite || isLocked} 
                                  className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-gray-900 dark:text-white outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:bg-transparent disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
                                />
                              </td>
                              <td className={`bg-gray-100 dark:bg-gray-800/50 text-center font-medium ${f === fields[fields.length-1] ? 'border-r dark:border-gray-800' : ''}`}>
                                {m + fVal}
                              </td>
                            </React.Fragment>
                          );
                        } else {
                          return (
                            <td key={f.id} className={`border-l dark:border-gray-800 relative ${f === fields[fields.length-1] ? 'border-r' : ''}`}>
                              {sData.isBudget && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₱</span>}
                              <input 
                                  type="number" 
                                  min="0" 
                                  value={fData.value !== undefined && fData.value !== null ? fData.value : ''} 
                                  onChange={(e) => handleChange(b.id, f.id, null, e.target.value)} 
                                  disabled={!canWrite || isLocked} 
                                  className={`w-full min-w-[60px] bg-transparent py-2 text-gray-900 dark:text-white outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:bg-transparent disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white ${sData.isBudget ? 'pl-8 pr-2 text-left' : 'px-2 text-center'}`} 
                                />
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-amber-50/80 dark:bg-amber-950/30 font-bold border-t-2 border-amber-300 dark:border-amber-800 text-gray-900 dark:text-white">
                {(() => {
                  const totals: Record<string, { m: number; f: number; total: number; value: number }> = {};
                  fields.forEach(f => {
                    totals[f.id] = { m: 0, f: 0, total: 0, value: 0 };
                  });

                  entitiesToDisplay.forEach(b => {
                    const bData = data[b.id] || {};
                    fields.forEach(f => {
                      const fData = bData[f.id] || {};
                      if (f.type === 'gender_split') {
                        const m = Number(fData.m || 0);
                        const fVal = Number(fData.f || 0);
                        totals[f.id].m += m;
                        totals[f.id].f += fVal;
                        totals[f.id].total += (m + fVal);
                      } else {
                        totals[f.id].value += Number(fData.value || 0);
                      }
                    });
                  });

                  return (
                    <tr>
                      <td className="whitespace-nowrap px-4 py-3 font-extrabold text-brand-700 dark:text-brand-300">Total</td>
                      {fields.map(f => {
                        if (f.type === 'gender_split') {
                          return (
                            <React.Fragment key={f.id}>
                              <td className="border-l dark:border-gray-800 text-center font-bold px-2 py-3 text-blue-700 dark:text-blue-300">
                                {totals[f.id].m.toLocaleString()}
                              </td>
                              <td className="text-center font-bold px-2 py-3 text-pink-700 dark:text-pink-300">
                                {totals[f.id].f.toLocaleString()}
                              </td>
                              <td className={`text-center font-extrabold px-2 py-3 bg-amber-100/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 ${f === fields[fields.length-1] ? 'border-r dark:border-gray-800' : ''}`}>
                                {totals[f.id].total.toLocaleString()}
                              </td>
                            </React.Fragment>
                          );
                        } else {
                          return (
                            <td key={f.id} className={`border-l dark:border-gray-800 font-bold px-3 py-3 ${sData.isBudget ? 'text-left pl-8 text-emerald-700 dark:text-emerald-300' : 'text-center text-gray-900 dark:text-white'} ${f === fields[fields.length-1] ? 'border-r dark:border-gray-800' : ''}`}>
                              {sData.isBudget ? `₱${totals[f.id].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : totals[f.id].value.toLocaleString()}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => {
          if (pendingChanges) {
            mutation.mutate(pendingChanges);
          }
        }}
        title="Submit Changes for Approval"
        message="Your changes will be submitted to the Superadmin for approval before updating the database. Proceed?"
      />
    </div>
  );
}
