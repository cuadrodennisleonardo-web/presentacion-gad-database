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
import { MobileDataCard } from '@/components/common/MobileDataCard';
import { MobileDataInput, SplitInputWrapper } from '@/components/common/MobileDataInput';

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
}

export default function DynamicDataEntryGrid({ schema, barangays, year }: DynamicDataEntryGridProps) {
  const { isSuperAdmin, canWrite } = useRole();
  const { user } = useAuth();
  
  const [data, setData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);
  const queryClient = useQueryClient();

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', schema.department, schema.tab_name, year],
    queryFn: () => getLatestApproval(schema.department, schema.tab_name, year)
  });

  const sData = schema.schema as any;
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
          toast.success("Loaded rejected data for resubmission", { icon: '🔄' });
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
        
        fields.forEach(f => {
          const oldVal = originalRow[f.id] || {};
          const newVal = row[f.id] || {};
          
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            hasChanges = true;
          }
          currentChanges[f.id] = { old: oldVal, new: newVal };
        });

        if (hasChanges) {
          changedData[b.id] = currentChanges;
        }
      });

      if (Object.keys(changedData).length === 0) {
         toast('No changes to save.', { icon: 'ℹ️' });
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

  const exportColumns = [
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

  const exportData = barangays.map(b => {
    const bData = data[b.id] || {};
    const row: any = { barangay_name: b.name };
    fields.forEach(f => {
       if (f.type === 'gender_split') {
         row[`${f.id}_m`] = bData[f.id]?.m;
         row[`${f.id}_f`] = bData[f.id]?.f;
       } else {
         row[f.id] = bData[f.id]?.value;
       }
    });
    return row;
  });

  const handleImport = (importedData: any[]) => {
    const newData = { ...data };
    importedData.forEach(row => {
      const b = barangays.find(b => b.name === row.barangay_name);
      if (b) {
        newData[b.id] = { ...(newData[b.id] || {}) };
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
    });
    setData(newData);
    toast.success('Data imported successfully. Review and save changes.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 mb-4">
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
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50 ml-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">Loading grid...</div>
      ) : fields.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">No fields defined for this table.</div>
      ) : (
        <>
        <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>Barangay</th>
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
              {barangays.map((b) => {
                const bData = data[b.id] || {};
                
                return (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">{b.name}</td>
                    
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
        <div className="block lg:hidden mt-2">
          {barangays.map((b) => {
            const bData = data[b.id] || {};
            return (
              <MobileDataCard key={b.id} title={b.name}>
                {fields.map(f => {
                  const fData = bData[f.id] || {};
                  
                  if (f.type === 'gender_split') {
                    const m = fData.m || 0;
                    const fVal = fData.f || 0;
                    return (
                      <MobileDataInput key={f.id} label={f.name} type="split">
                        <SplitInputWrapper
                          inputMale={
                            <input 
                              type="number" min="0" 
                              value={fData.m !== undefined && fData.m !== null ? fData.m : ''} 
                              onChange={(e) => handleChange(b.id, f.id, 'm', e.target.value)} 
                              disabled={!canWrite || isLocked} 
                              className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" 
                            />
                          }
                          inputFemale={
                            <input 
                              type="number" min="0" 
                              value={fData.f !== undefined && fData.f !== null ? fData.f : ''} 
                              onChange={(e) => handleChange(b.id, f.id, 'f', e.target.value)} 
                              disabled={!canWrite || isLocked} 
                              className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" 
                            />
                          }
                          total={m + fVal}
                        />
                      </MobileDataInput>
                    );
                  } else {
                    return (
                      <MobileDataInput key={f.id} label={f.name}>
                        <div className="relative w-full">
                          {sData.isBudget && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₱</span>}
                          <input 
                            type="number" min="0" 
                            value={fData.value !== undefined && fData.value !== null ? fData.value : ''} 
                            onChange={(e) => handleChange(b.id, f.id, null, e.target.value)} 
                            disabled={!canWrite || isLocked} 
                            className={`w-full py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 ${sData.isBudget ? 'pl-8 pr-2 text-left' : 'px-2 text-center'}`} 
                          />
                        </div>
                      </MobileDataInput>
                    );
                  }
                })}
              </MobileDataCard>
            );
          })}
        </div>
        </>
      )}
      
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Overwrite Pending Approval?"
        message="A pending approval request already exists for this tab. Saving new changes will replace the existing pending request. Do you want to proceed?"
        confirmLabel="Yes, Overwrite"
        onConfirm={() => mutation.mutate(pendingChanges!)}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
