import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { fetchBarangays, fetchDynamicSchemas, fetchSchools } from '@/services/api';

export function useDynamicDashboardSchemas(department: string) {
  return useQuery({
    queryKey: ['dynamic_dashboard_schemas', department],
    queryFn: async () => {
      const [barangays, schools, schemas] = await Promise.all([
        fetchBarangays(),
        fetchSchools(),
        fetchDynamicSchemas(department)
      ]);
      return { barangays, schools, schemas };
    }
  });
}

export function useDynamicSchemaData(schemaId: string, year: number) {
  return useQuery({
    queryKey: ['dynamic_schema_data', schemaId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_data')
        .select('*')
        .eq('year', year)
        .eq('schema_id', schemaId);
        
      if (error) throw error;
      return data || [];
    }
  });
}
