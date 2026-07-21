import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { fetchBarangays, fetchStats, fetchApprovalChanges, fetchSchools } from '@/services/api';

export function useDataEntryStats(department: string, tableName: string, year: number) {
  return useQuery({
    queryKey: ['native_data', department, year],
    queryFn: async () => {
      const [barangays, schools, sData] = await Promise.all([
        fetchBarangays(),
        fetchSchools(),
        fetchStats(tableName, year)
      ]);

      const sMap: Record<string, any> = {};
      if (sData) {
        sData.forEach((stat) => { sMap[stat.barangay_id] = stat; });
      }

      const searchParams = new URLSearchParams(window.location.search);
      const resubmitId = searchParams.get('resubmit');
      
      if (resubmitId) {
        try {
          const changes = await fetchApprovalChanges(resubmitId);
          if (changes) {
            Object.keys(changes).forEach(bId => {
              if (!sMap[bId]) sMap[bId] = {};
              const bChanges = changes[bId];
              Object.keys(bChanges).forEach(field => {
                const val = bChanges[field];
                sMap[bId][field] = (val && typeof val === 'object' && 'new' in val) ? val.new : val;
              });
            });
            toast.success("Loaded rejected data for resubmission", { icon: '🔄' });
          }
        } catch (err) {
          console.error("Failed to load resubmission changes", err);
        }
      }

      return { barangays, schools, stats: sMap };
    }
  });
}
