import { getDefaultYear } from '@/utils/yearUtils';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { useRole } from '../../hooks/useRole';
import { getLatestApproval } from '../../utils/approvalUtils';
import { fetchBarangays } from '@/services/api';
import DataEntryLayout from '@/components/layout/DataEntryLayout';

export default function InfrastructureDataEntry() {
  const { canWrite, canDirectSave } = useRole();
  const [activeTab, setActiveTab] = useState<string>('');
  const [year, setYear] = useState(getDefaultYear('Infrastructure'));

  const nativeTabs: { key: string; label: string }[] = [];

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', 'Infrastructure'],
    queryFn: async () => {
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', 'Infrastructure');
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
    queryKey: ['latest_approval', 'Infrastructure', tabLabel, year],
    queryFn: () => getLatestApproval('Infrastructure', tabLabel, year)
  });

  const isLocked = latestApproval && latestApproval.status === 'pending' && !canDirectSave;

  return (
    <DataEntryLayout
      moduleName="Infrastructure"
      pageTitle="Infrastructure Data Entry"
      pageDescription="Manage custom dynamic tables for infrastructure"
      breadcrumbTitle="Infrastructure"
      gridTitle="Infrastructure Grid"
      gridDescription="Data entry grid for infrastructure indicators"
      year={year}
      setYear={setYear}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dynamicSchemas={dynamicSchemas}
      barangays={barangays}
      nativeTabs={nativeTabs}
      isLocked={!!isLocked}
      latestApproval={latestApproval}
      isSuperAdmin={canDirectSave}
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
