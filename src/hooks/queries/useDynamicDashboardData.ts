import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { fetchBarangays, fetchDynamicSchemas } from '@/services/api';

export function useDynamicDashboardData(department: string, year: number) {
  return useQuery({
    queryKey: ['dynamic_dashboard_data', department, year],
    queryFn: async () => {
      const [barangays, schemas] = await Promise.all([
        fetchBarangays(),
        fetchDynamicSchemas(department)
      ]);

      let dynData: any[] = [];
      if (schemas && schemas.length > 0) {
        const schemaIds = schemas.map(s => s.id);
        const { data, error } = await supabase.from('dynamic_data').select('*').eq('year', year).in('schema_id', schemaIds);
        if (error) throw error;
        if (data) dynData = data;
      }

      return { barangays, schemas, data: dynData };
    }
  });
}
