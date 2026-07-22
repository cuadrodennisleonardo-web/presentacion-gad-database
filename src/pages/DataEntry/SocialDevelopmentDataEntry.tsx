import { getDefaultYear } from '@/utils/yearUtils';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { ExportColumn } from '../../components/common/DataExportImport';
import type { Database } from '../../types/database';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../hooks/useAuth';
import { submitForApproval, getLatestApproval, notifySuperAdminsOfDirectSave } from '../../utils/approvalUtils';
import DataEntryLayout from '@/components/layout/DataEntryLayout';
import { MobileDataCard } from '@/components/common/MobileDataCard';
import { MobileDataInput, SplitInputWrapper } from '@/components/common/MobileDataInput';
import { useDataEntryStats } from '@/hooks/queries/useDataEntryStats';

type SocialStat = Database['public']['Tables']['social_dev_stats']['Row'];
type TabType = string;

export default function SocialDevelopmentDataEntry() {
  const { isSuperAdmin, canWrite } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [stats, setStats] = useState<Record<string, Partial<SocialStat>>>({});
  const [originalStats, setOriginalStats] = useState<Record<string, Partial<SocialStat>>>({});
  const [activeTab, setActiveTab] = useState<TabType>('education');
  const [year, setYear] = useState(getDefaultYear(`Social Development_${'education'}`));

  useEffect(() => {
    setYear(getDefaultYear('Social Development_' + activeTab));
  }, [activeTab]);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any> | null>(null);

  const nativeTabs = [
    { key: 'education', label: 'Education' },
    { key: 'health', label: 'Health & Nutrition (1st Quarter)' },
    { key: 'welfare', label: 'Social Welfare' },
  ];

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', 'Social Development'],
    queryFn: async () => {
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', 'Social Development');
      return data || [];
    }
  });

  const tabLabel = nativeTabs.find(t => t.key === activeTab)?.label || 
                   dynamicSchemas.find(d => d.id === activeTab)?.tab_name || '';

  const isEducation = activeTab === 'education';
  
  const educationYearOptions = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - 5 + i;
    return { value: y, label: `${y}-${y + 1}` };
  });

  const yearOptions = isEducation ? educationYearOptions : undefined;
  const exportTitle = isEducation ? `Education (${year}-${year + 1})` : `${tabLabel} (${year})`;

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', 'Social Development', tabLabel, year],
    queryFn: () => getLatestApproval('Social Development', tabLabel, year)
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !isSuperAdmin;

  const { data: fetchedData, isLoading } = useDataEntryStats('Social Development', 'social_dev_stats', year);

  useEffect(() => {
    if (fetchedData) {
      setStats(fetchedData.stats);
      setOriginalStats(JSON.parse(JSON.stringify(fetchedData.stats)));
    }
  }, [fetchedData]);

  const entities = isEducation ? fetchedData?.schools || [] : fetchedData?.barangays || [];
  const barangays = fetchedData?.barangays || [];

  const handleChange = (barangayId: string, field: keyof SocialStat, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const prefix = field.toString().replace(/_[mf]$/, '');
    const keyTotal = `${prefix}_total` as keyof SocialStat;

    setStats((prev) => ({
      ...prev,
      [barangayId]: {
        ...prev[barangayId],
        [field]: numValue,
        [keyTotal]: null,
      },
    }));
  };

  const handleTotalChange = (barangayId: string, prefix: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    const keyTotal = `${prefix}_total` as keyof SocialStat;
    const keyM = `${prefix}_m` as keyof SocialStat;
    const keyF = `${prefix}_f` as keyof SocialStat;

    setStats((prev) => ({
      ...prev,
      [barangayId]: {
        ...prev[barangayId],
        [keyTotal]: numValue,
        [keyM]: 0,
        [keyF]: 0,
      },
    }));
  };

  const getExportColumns = (): ExportColumn[] => {
    switch(activeTab) {
      case 'education':
        return [
          { header: 'Student Enrollment (M)', key: 'student_enrollment_m' },
          { header: 'Student Enrollment (F)', key: 'student_enrollment_f' },
          { header: 'Student Enrollment (Total)', key: 'student_enrollment_total' },
          { header: 'School Drop-out (M)', key: 'drop_out_m' },
          { header: 'School Drop-out (F)', key: 'drop_out_f' },
          { header: 'School Drop-out (Total)', key: 'drop_out_total' },
          { header: 'OSY (M)', key: 'osy_m' },
          { header: 'OSY (F)', key: 'osy_f' },
          { header: 'OSY (Total)', key: 'osy_total' },
        ];
      case 'health':
        return [
          { header: 'Malnourished (M)', key: 'malnourished_m' },
          { header: 'Malnourished (F)', key: 'malnourished_f' },
          { header: 'Malnourished (Total)', key: 'malnourished_total' },
          { header: 'Teenage Pregnancy (Total)', key: 'teenage_pregnancy' },
          { header: 'Maternal Mortality (Total)', key: 'maternal_mortality' },
        ];
      case 'welfare':
        return [
          { header: 'PWDs (M)', key: 'pwd_m' },
          { header: 'PWDs (F)', key: 'pwd_f' },
          { header: 'PWDs (Total)', key: 'pwd_total' },
          { header: '4Ps Beneficiaries (M)', key: 'four_ps_m' },
          { header: '4Ps Beneficiaries (F)', key: 'four_ps_f' },
          { header: '4Ps Beneficiaries (Total)', key: 'four_ps_total' },
          { header: 'Senior Citizens (M)', key: 'senior_citizens_m' },
          { header: 'Senior Citizens (F)', key: 'senior_citizens_f' },
          { header: 'Senior Citizens (Total)', key: 'senior_citizens_total' },
          { header: 'Solo Parents (M)', key: 'solo_parents_m' },
          { header: 'Solo Parents (F)', key: 'solo_parents_f' },
          { header: 'Solo Parents (Total)', key: 'solo_parents_total' },
        ];
      default: return [];
    }
  };

  const renderIndicatorCells = (entityId: string, row: any, prefix: string, isLastInGroup: boolean) => {
    const kM = prefix + 'm';
    const kF = prefix + 'f';
    const kTot = prefix + 'total';

    const mM = Number(row[kM] || 0);
    const fF = Number(row[kF] || 0);
    const rawTot = row[kTot];

    const hasMF = mM > 0 || fF > 0;
    const borderRight = isLastInGroup ? 'border-r dark:border-gray-800' : '';

    return (
      <React.Fragment key={prefix}>
        <td className="px-0 py-0 border-l dark:border-gray-800">
          <input 
            type="number" min="0" 
            value={row[kM] || ''} 
            onChange={(e) => handleChange(entityId, kM as any, e.target.value)} 
            disabled={!canWrite || isLocked} 
            className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
          />
        </td>
        <td className="px-0 py-0">
          <input 
            type="number" min="0" 
            value={row[kF] || ''} 
            onChange={(e) => handleChange(entityId, kF as any, e.target.value)} 
            disabled={!canWrite || isLocked} 
            className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" 
          />
        </td>
        {hasMF ? (
          <td className={`px-4 py-3 text-center font-medium bg-gray-100 dark:bg-gray-800/50 ${borderRight}`}>
            {mM + fF}
          </td>
        ) : (
          <td className={`px-0 py-0 text-center font-medium bg-amber-50/40 dark:bg-amber-900/10 ${borderRight}`}>
            <input 
              type="number" min="0"
              placeholder="Total" 
              value={rawTot ?? ''} 
              onChange={(e) => handleTotalChange(entityId, prefix.replace(/_$/, ''), e.target.value)} 
              disabled={!canWrite || isLocked} 
              className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center text-brand-600 dark:text-brand-400 font-semibold outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 placeholder:text-gray-400 placeholder:font-normal" 
            />
          </td>
        )}
      </React.Fragment>
    );
  };

  const handleImport = (importedData: any[]) => {
    const fields = getExportColumns().map(c => c.key);
    importedData.forEach((row) => {
      const b = barangays.find(b => b.name.toLowerCase() === row.barangay_name?.toLowerCase());
      if (b) {
        Object.keys(row).forEach(key => {
          if (key !== 'barangay_name' && fields.includes(key)) {
            handleChange(b.id, key as keyof SocialStat, String(row[key]));
          }
        });
      }
    });
    toast.success('Data imported successfully!');
  };

  const mutation = useMutation({
    mutationFn: async (changedData: Record<string, any>) => {
      if (isSuperAdmin) {
        const upsertData = Object.keys(changedData).map(bId => {
           const rowChanges: any = {};
           Object.keys(changedData[bId]).forEach(k => {
             rowChanges[k] = changedData[bId][k].new;
           });
           return {
             barangay_id: bId,
             year,
             month_updated: new Date().getMonth() + 1,
             ...rowChanges
           };
        });
        
        const { error } = await supabase.from('social_dev_stats').upsert(upsertData, { onConflict: 'barangay_id,year' });
        if (error) throw error;
        
        await notifySuperAdminsOfDirectSave('Social Development', tabLabel, year, user!.id);
      } else {
        await submitForApproval('Social Development', tabLabel, year, changedData, user!.id);
      }
    },
    onSuccess: () => {
      toast.success(isSuperAdmin ? `Social Development data saved directly!` : `Changes submitted for approval!`);
      queryClient.invalidateQueries({ queryKey: ['native_data', 'Social Development', year] });
      queryClient.invalidateQueries({ queryKey: ['latest_approval', 'Social Development', tabLabel, year] });
      queryClient.invalidateQueries({ queryKey: ['social_dev_stats', year] });
      queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
      setShowConfirmModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save data');
    }
  });

  const handleSaveAll = () => {
    const changedData: Record<string, any> = {};
    const fields = getExportColumns().map(c => c.key);
    
    entities.forEach(b => {
      const row = stats[b.id] || {};
      const originalRow = originalStats[b.id] || {};
      
      let hasChanges = false;
      const currentChanges: any = {};
      
      fields.forEach(f => {
        const key = f as keyof SocialStat;
        const oldVal = (originalRow as any)[key] ?? null;
        const newVal = (row as any)[key] ?? null;
        if (newVal !== oldVal) {
          hasChanges = true;
        }
        currentChanges[f] = { old: oldVal, new: newVal };
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
  };

  const isDynamic = !nativeTabs.some(t => t.key === activeTab);

  return (
    <DataEntryLayout
      moduleName="Social Development"
      pageTitle="Social Development Data Entry"
      pageDescription="Manage Social Development stats"
      breadcrumbTitle={`Social Development ${!canWrite ? 'View Data' : 'Data Entry'}`}
      gridTitle={`${tabLabel} Grid`}
      gridDescription={`Manage social development data for ${entities.length} ${isEducation ? "schools" : "barangays"}. Enter Sex-Disaggregated Data.`}
      year={year}
      setYear={setYear}
      yearOptions={yearOptions}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dynamicSchemas={dynamicSchemas}
      barangays={entities}
      entityName={isEducation ? "School" : "Barangay"}
      nativeTabs={nativeTabs}
      isLocked={isLocked}
      latestApproval={latestApproval}
      isSuperAdmin={isSuperAdmin}
      canWrite={canWrite}
      exportData={isDynamic ? undefined : entities.map(b => ({ barangay_name: b.name, ...stats[b.id] }))}
      exportColumns={isDynamic ? undefined : getExportColumns()}
      exportTitle={exportTitle}
      onImport={isDynamic ? undefined : handleImport}
      onSave={handleSaveAll}
      isSaving={mutation.isPending}
      isLoading={isLoading}
      showConfirmModal={showConfirmModal}
      setShowConfirmModal={setShowConfirmModal}
      onConfirmSave={() => { if(pendingChanges) mutation.mutate(pendingChanges) }}
    >
      <>
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
             {activeTab === 'education' && (
               <tr>
                 <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>School</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-blue-600 dark:text-blue-400" colSpan={3}>Student Enrollment</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-orange-600 dark:text-orange-400" colSpan={3}>School Drop-out</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l border-r dark:border-gray-800 text-red-600 dark:text-red-400" colSpan={3}>Out-of-School Youth</th>
               </tr>
             )}
             {activeTab === 'health' && (
               <tr>
                 <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>Barangay</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-orange-600 dark:text-orange-400" colSpan={3}>Malnourished / Stunted</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-red-600 dark:text-red-400" colSpan={1} rowSpan={2}>Teenage Pregnancy<br/>(Total)</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l border-r dark:border-gray-800 text-rose-600 dark:text-rose-400" colSpan={1} rowSpan={2}>Maternal Mortality<br/>(Total)</th>
               </tr>
             )}
             {activeTab === 'welfare' && (
               <tr>
                 <th className="whitespace-nowrap px-4 py-3 font-medium border-b dark:border-gray-800" rowSpan={2}>Barangay</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-purple-600 dark:text-purple-400" colSpan={3}>Persons with Disability (PWD)</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-emerald-600 dark:text-emerald-400" colSpan={3}>4Ps Beneficiaries</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l dark:border-gray-800 text-amber-600 dark:text-amber-400" colSpan={3}>Senior Citizens</th>
                 <th className="whitespace-nowrap px-4 py-2 font-medium text-center border-l border-r dark:border-gray-800 text-blue-600 dark:text-blue-400" colSpan={3}>Solo Parents</th>
               </tr>
             )}
             <tr>
               {activeTab === 'education' && Array.from({ length: 3 }).map((_, i) => (
                 <React.Fragment key={i}>
                   <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
                   <th className="px-2 py-2 text-center">F</th>
                   <th className={`px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50 ${i === 2 ? 'border-r dark:border-gray-800' : ''}`}>Total</th>
                 </React.Fragment>
               ))}
               {activeTab === 'health' && (
                 <React.Fragment>
                   <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
                   <th className="px-2 py-2 text-center">F</th>
                   <th className="px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50">Total</th>
                 </React.Fragment>
               )}
               {activeTab === 'welfare' && Array.from({ length: 4 }).map((_, i) => (
                 <React.Fragment key={i}>
                   <th className="px-2 py-2 text-center border-l dark:border-gray-800">M</th>
                   <th className="px-2 py-2 text-center">F</th>
                   <th className={`px-2 py-2 text-center bg-gray-100 dark:bg-gray-800/50 ${i === 3 ? 'border-r dark:border-gray-800' : ''}`}>Total</th>
                 </React.Fragment>
               ))}
             </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {entities.map((b, index) => {
            const row = stats[b.id] || {};
            const prevDistrict = index > 0 ? entities[index - 1].district : null;
            const showCategoryHeader = isEducation && b.district !== prevDistrict;
            const categoryLabel = b.district === 'School-Primary' ? 'PRIMARY & ELEMENTARY SCHOOLS' : b.district === 'School-Secondary' ? 'SECONDARY SCHOOLS' : b.district === 'School-Private' ? 'PRIVATE SCHOOLS' : '';
            
            if (activeTab === 'education') {
              return (
                <React.Fragment key={b.id}>
                  {showCategoryHeader && (
                    <tr>
                      <td colSpan={10} className="px-4 py-2.5 text-xs font-bold tracking-wider text-white bg-brand-500 dark:bg-brand-600 border-y-2 border-brand-600 dark:border-brand-700">
                        {categoryLabel}
                      </td>
                    </tr>
                  )}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white ">{b.name}</td>
                  {['student_enrollment_', 'drop_out_', 'osy_'].map((prefix, idx) => 
                    renderIndicatorCells(b.id, row, prefix, idx === 2)
                  )}
                </tr>
                </React.Fragment>
              );
            }
            
            if (activeTab === 'welfare') {
              return (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white ">{b.name}</td>
                  {['pwd_', 'four_ps_', 'senior_citizens_', 'solo_parents_'].map((prefix, idx) => 
                    renderIndicatorCells(b.id, row, prefix, idx === 3)
                  )}
                </tr>
              );
            }

            if (activeTab === 'health') {
              return (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white ">{b.name}</td>
                  {renderIndicatorCells(b.id, row, 'malnourished_', false)}
                  
                  <td className="px-0 py-0 border-l border-r dark:border-gray-800 "><input type="number" min="0" value={row['teenage_pregnancy'] || ''} onChange={(e) => handleChange(b.id, 'teenage_pregnancy', e.target.value)} disabled={!canWrite || isLocked} className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" /></td>
                  <td className="px-0 py-0 border-r dark:border-gray-800 "><input type="number" min="0" value={row['maternal_mortality'] || ''} onChange={(e) => handleChange(b.id, 'maternal_mortality', e.target.value)} disabled={!canWrite || isLocked} className="w-full min-w-[60px] bg-transparent px-2 py-2 text-center outline-none focus:bg-brand-50 dark:focus:bg-brand-900/20 disabled:opacity-100 disabled:text-gray-900 dark:disabled:text-white" /></td>
                </tr>
              );
            }
            
            return null;
          })}
        </tbody>
      
        </table>
      </div>
        <div className="block lg:hidden mt-2">
          {entities.map((b, index) => {
            const row = stats[b.id] || {};
            const prevDistrict = index > 0 ? entities[index - 1].district : null;
            const showCategoryHeader = isEducation && b.district !== prevDistrict;
            const categoryLabel = b.district === 'School-Primary' ? 'PRIMARY & ELEMENTARY SCHOOLS' : b.district === 'School-Secondary' ? 'SECONDARY SCHOOLS' : b.district === 'School-Private' ? 'PRIVATE SCHOOLS' : '';
            
            if (activeTab === 'education') {
              return (
                <React.Fragment key={b.id}>
                  {showCategoryHeader && (
                    <div className="px-4 py-2.5 mt-4 mb-2 text-xs font-bold tracking-wider text-white bg-brand-500 dark:bg-brand-600 rounded-lg">
                      {categoryLabel}
                    </div>
                  )}
                <MobileDataCard title={b.name}>
                  {['Student Enrollment', 'School Drop-out', 'Out-of-school Youth'].map((label, idx) => {
                    const prefix = ['student_enrollment_', 'drop_out_', 'osy_'][idx];
                    const kM = prefix + 'm';
                    const kF = prefix + 'f';
                    const m = (row as any)[kM] || 0;
                    const fVal = (row as any)[kF] || 0;
                    return (
                      <MobileDataInput key={prefix} label={label} type="split">
                        <SplitInputWrapper
                          inputMale={<input type="number" min="0" value={(row as any)[kM] || ''} onChange={(e) => handleChange(b.id, kM as any, e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                          inputFemale={<input type="number" min="0" value={(row as any)[kF] || ''} onChange={(e) => handleChange(b.id, kF as any, e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                          total={Number(m) + Number(fVal)}
                        />
                      </MobileDataInput>
                    );
                  })}
                </MobileDataCard>
                </React.Fragment>
              );
            }
            
            if (activeTab === 'welfare') {
              return (
                <MobileDataCard key={b.id} title={b.name}>
                  {['Persons with Disability (PWD)', '4Ps Beneficiaries', 'Senior Citizens', 'Solo Parents'].map((label, idx) => {
                    const prefix = ['pwd_', 'four_ps_', 'senior_citizens_', 'solo_parents_'][idx];
                    const kM = prefix + 'm';
                    const kF = prefix + 'f';
                    const m = (row as any)[kM] || 0;
                    const fVal = (row as any)[kF] || 0;
                    return (
                      <MobileDataInput key={prefix} label={label} type="split">
                        <SplitInputWrapper
                          inputMale={<input type="number" min="0" value={(row as any)[kM] || ''} onChange={(e) => handleChange(b.id, kM as any, e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                          inputFemale={<input type="number" min="0" value={(row as any)[kF] || ''} onChange={(e) => handleChange(b.id, kF as any, e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                          total={Number(m) + Number(fVal)}
                        />
                      </MobileDataInput>
                    );
                  })}
                </MobileDataCard>
              );
            }

            if (activeTab === 'health') {
              const mm = row['malnourished_m'] || 0;
              const mf = row['malnourished_f'] || 0;
              return (
                <MobileDataCard key={b.id} title={b.name}>
                  <MobileDataInput label="Malnourished / Stunted" type="split">
                    <SplitInputWrapper
                      inputMale={<input type="number" min="0" value={row['malnourished_m'] || ''} onChange={(e) => handleChange(b.id, 'malnourished_m', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                      inputFemale={<input type="number" min="0" value={row['malnourished_f'] || ''} onChange={(e) => handleChange(b.id, 'malnourished_f', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />}
                      total={Number(mm) + Number(mf)}
                    />
                  </MobileDataInput>
                  <MobileDataInput label="Teenage Pregnancy (Total)">
                    <input type="number" min="0" value={row['teenage_pregnancy'] || ''} onChange={(e) => handleChange(b.id, 'teenage_pregnancy', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />
                  </MobileDataInput>
                  <MobileDataInput label="Maternal Mortality (Total)">
                    <input type="number" min="0" value={row['maternal_mortality'] || ''} onChange={(e) => handleChange(b.id, 'maternal_mortality', e.target.value)} disabled={!canWrite || isLocked} className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-center text-gray-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500" />
                  </MobileDataInput>
                </MobileDataCard>
              );
            }
            return null;
          })}
        </div>
      </>
    </DataEntryLayout>
  );
}
