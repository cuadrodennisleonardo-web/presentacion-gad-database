import { getDefaultYear } from '@/utils/yearUtils';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { useRole } from '../../hooks/useRole';
import { getLatestApproval } from '../../utils/approvalUtils';
import { fetchBarangays } from '@/services/api';
import DataEntryLayout from '@/components/layout/DataEntryLayout';

export default function EconomicDevelopmentDataEntry() {
  const { canWrite, canDirectSave, isSuperAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<string>('');
  const [year, setYear] = useState(getDefaultYear('Economic Development'));

  const nativeTabs: { key: string; label: string }[] = [];

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', 'Economic Development'],
    queryFn: async () => {
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', 'Economic Development');
      return data || [];
    }
  });

  const { data: barangays = [] } = useQuery({
    queryKey: ['barangays'],
    queryFn: fetchBarangays
  });

  useEffect(() => {
    if (dynamicSchemas.length > 0 && (!activeTab || !dynamicSchemas.some(d => d.id === activeTab))) {
      setActiveTab(dynamicSchemas[0].id);
    }
  }, [dynamicSchemas]);

  const tabLabel = dynamicSchemas.find(d => d.id === activeTab)?.tab_name || '';

  const { data: latestApproval } = useQuery({
    queryKey: ['latest_approval', 'Economic Development', tabLabel, year],
    queryFn: () => getLatestApproval('Economic Development', tabLabel, year)
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !canDirectSave;

  return (
    <DataEntryLayout
      moduleName="Economic Development"
      pageTitle="Economic Development Data Entry"
      pageDescription="Manage custom dynamic tables for economic development"
      breadcrumbTitle="Economic Development"
      gridTitle="Economic Development Grid"
      gridDescription="Data entry grid for economic development indicators"
      year={year}
      setYear={setYear}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dynamicSchemas={dynamicSchemas}
      barangays={barangays}
      nativeTabs={nativeTabs}
      isLocked={!!isLocked}
      latestApproval={latestApproval}
      isSuperAdmin={isSuperAdmin}
      canWrite={canWrite}
      onSave={() => {}}
      isSaving={false}
      isLoading={false}
      showConfirmModal={false}
      setShowConfirmModal={() => {}}
      onConfirmSave={() => {}}
    >
      <div />
    </DataEntryLayout>
  );
}
