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

import { fetchSchools } from '@/services/api';

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
  const { isSuperAdmin, canWrite } = useRole();
  const { user } = useAuth();
  
  const [data, setData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);
  const queryClient = useQueryClient();

  const sData = schema.schema as any;
  const targetEntity = sData?.targetEntity || 'barangays';

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: fetchSchools,
    enabled: targetEntity !== 'barangays'
  });

  let entitiesToDisplay: any[] = barangays;
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
  const isLocked = latestApproval && latestApproval.status === 'pending' && !isSuperAdmin;

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
      if (isSuperAdmin) {
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
      if (isSuperAdmin) {
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
      
      barangays.forEach(b => {
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

      if (latestApproval?.status === 'pending' && !isSuperAdmin) {
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
        { header: 'Barangay', key: 'barangay_name' },
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
        { header: 'Barangay', key: 'barangay_name' },
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
        { header: 'Barangay', key: 'barangay_name' },
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

  const handleImport = (importedData: any[]) => {
    const newData = { ...data };
    importedData.forEach(row => {
      const bName = (row.barangay_name || '').trim().toLowerCase();
      const b = barangays.find(b => b.name.trim().toLowerCase() === bName);
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
                const m = row[`${f.id}_m`];
                const fVal = row[`${f.id}_f`];
                if (m !== undefined && m !== null && m !== '') {
                   newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), m: Number(m) };
                }
                if (fVal !== undefined && fVal !== null && fVal !== '') {
                   newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), f: Number(fVal) };
                }
              } else {
                const val = row[f.id];
                if (val !== undefined && val !== null && val !== '') {
                   newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), value: Number(val) };
                }
              }
            });
          });
        } else {
          fields.forEach(f => {
            if (f.type === 'gender_split') {
              const m = row[`${f.id}_m`];
              const fVal = row[`${f.id}_f`];
              if (m !== undefined && m !== null && m !== '') {
                 newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), m: Number(m) };
              }
              if (fVal !== undefined && fVal !== null && fVal !== '') {
                 newData[b.id][f.id] = { ...(newData[b.id][f.id] || {}), f: Number(fVal) };
              }
            } else {
              const val = row[f.id];
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

  const headKeyMatch = (row: any, name: string) => {
    const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? row[key] : undefined;
  };

  const renderEntityCell = (b: any) => {
    const isPrivate = Boolean(
      b.isPrivate || 
      b.district === 'School-Private' || 
      b.name?.includes('Holy Angel') || 
      b.name?.includes('Moises D. Fernandez')
    );

    return (
      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
        <div className="flex items-center justify-between gap-2">
          <span>{b.name}</span>
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
        {canWrite && exportData && exportColumns && (
          <DataExportImport 
            data={exportData} 
            columns={exportColumns}
            title={`${schema.tab_name} (${year})`}
            onImport={handleImport} 
          />
        )}
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
                {entitiesToDisplay.map((b) => {
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
                {entitiesToDisplay.map((b) => {
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
                {entitiesToDisplay.map((b) => {
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
