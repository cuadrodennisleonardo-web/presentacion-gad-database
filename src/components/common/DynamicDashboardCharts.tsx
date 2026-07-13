
import MultiSeriesChart from '@/components/charts/MultiSeriesChart';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { CHART_COLORS } from '@/config/chartColors';
import { useDynamicDashboardData } from '@/hooks/queries/useDynamicDashboardData';


interface FieldDef {
  id: string;
  name: string;
  type: 'gender_split' | 'single_value';
  chartType: 'bar' | 'pie' | 'stat_card' | 'hidden';
}

interface DynamicDashboardChartsProps {
  department: string;
  year: number;
}

export default function DynamicDashboardCharts({ department, year }: DynamicDashboardChartsProps) {
  const { data: dashboardData, isLoading } = useDynamicDashboardData(department, year);

  if (isLoading) {
    return null; // Return null while loading, main dashboard handles loading state usually
  }

  const schemas = dashboardData?.schemas || [];
  const data = dashboardData?.data || [];
  const barangays = dashboardData?.barangays || [];

  if (schemas.length === 0) {
    return null; // No dynamic tables for this department
  }

  // Generate charts for each schema
  return (
    <div className="mt-8">
      {schemas.map(schema => {
        const sData = schema.schema as any;
        const fields = (Array.isArray(sData) ? sData : (sData?.fields || [])) as FieldDef[];
        
        // Find stat cards
        const statFields = fields.filter(f => f.chartType === 'stat_card');
        
        // Find other charts
        const chartFields = fields.filter(f => f.chartType === 'bar' || f.chartType === 'pie');
        
        // Filter data for this schema
        const schemaData = data.filter(d => d.schema_id === schema.id);

        const bNames = barangays.map(b => b.name);

        return (
          <div key={schema.id} className="mb-12">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-4">{schema.tab_name} Dynamic Metrics</h3>
            
            {/* Render Stat Cards */}
            {statFields.length > 0 && (
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {statFields.map(f => {
                  let total = 0;
                  schemaData.forEach(row => {
                    const cell = row.data[f.id];
                    if (cell) {
                      if (f.type === 'gender_split') {
                        total += (cell.m || 0) + (cell.f || 0);
                      } else {
                        total += cell.value || 0;
                      }
                    }
                  });

                  return (
                    <div key={f.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02]">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{f.name}</p>
                      <div className="mt-2 flex items-end justify-between">
                        <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{total.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Render Charts */}
            {chartFields.length > 0 && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {chartFields.map(f => {
                   if (f.type === 'gender_split') {
                     const mSeries: number[] = [];
                     const fSeries: number[] = [];
                     
                     barangays.forEach(b => {
                        const row = schemaData.find(d => d.barangay_id === b.id);
                        if (row && row.data[f.id]) {
                          mSeries.push(row.data[f.id].m || 0);
                          fSeries.push(row.data[f.id].f || 0);
                        } else {
                          mSeries.push(0);
                          fSeries.push(0);
                        }
                     });

                     return (
                       <ErrorBoundary key={f.id}>
                         <MultiSeriesChart 
                           title={f.name + " (M vs F)"}
                           type={f.chartType === 'bar' ? 'bar' : 'area'}
                           categories={bNames}
                           series={[
                             { name: "Male", data: mSeries },
                             { name: "Female", data: fSeries }
                           ]}
                           colors={[CHART_COLORS.male, CHART_COLORS.female]}
                         />
                       </ErrorBoundary>
                     );
                   } else {
                     const valSeries: number[] = [];
                     barangays.forEach(b => {
                        const row = schemaData.find(d => d.barangay_id === b.id);
                        if (row && row.data[f.id]) {
                          valSeries.push(row.data[f.id].value || 0);
                        } else {
                          valSeries.push(0);
                        }
                     });

                     return (
                       <ErrorBoundary key={f.id}>
                         <MultiSeriesChart 
                           title={f.name}
                           type={f.chartType === 'bar' ? 'bar' : 'line'}
                           categories={bNames}
                           series={[
                             { name: "Total", data: valSeries }
                           ]}
                           colors={["#10b981"]}
                         />
                       </ErrorBoundary>
                     );
                   }
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
