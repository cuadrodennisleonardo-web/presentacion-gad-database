import { useState } from 'react';
import MultiSeriesChart from '@/components/charts/MultiSeriesChart';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { CHART_COLORS } from '@/config/chartColors';
import { useDynamicDashboardSchemas, useDynamicSchemaData } from '@/hooks/queries/useDynamicDashboardSchemas';
import YearSelector from '@/components/common/YearSelector';
import { getDefaultYear } from '@/utils/yearUtils';

interface FieldDef {
  id: string;
  name: string;
  type: 'gender_split' | 'single_value';
  chartType: 'bar' | 'pie' | 'stat_card' | 'hidden';
}

interface DynamicDashboardChartsProps {
  department: string;
}

function DynamicSchemaSection({ schema, barangays, department }: { schema: any, barangays: any[], department: string }) {
  const [year, setYear] = useState(() => getDefaultYear(`${department}_${schema.tab_key}`));
  const { data: schemaData, isLoading } = useDynamicSchemaData(schema.id, year);
  
  const sData = schema.schema as any;
  const fields = (Array.isArray(sData) ? sData : (sData?.fields || [])) as FieldDef[];
  
  const statFields = fields.filter(f => f.chartType === 'stat_card');
  const chartFields = fields.filter(f => f.chartType === 'bar' || f.chartType === 'pie');
  
  const data = schemaData || [];
  const bNames = barangays.map(b => b.name);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">{schema.tab_name} Dynamic Metrics</h3>
        <YearSelector year={year} setYear={setYear} scopeKey={`${department}_${schema.tab_key}`} />
      </div>
      
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <svg className="h-6 w-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      ) : (
        <>
          {statFields.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statFields.map(f => {
                let total = 0;
                if (f.type === 'gender_split') {
                  data.forEach(d => {
                    total += (d.data[f.id]?.m || 0) + (d.data[f.id]?.f || 0);
                  });
                } else {
                  data.forEach(d => {
                    total += d.data[f.id]?.value || 0;
                  });
                }
                return (
                  <div key={f.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{f.name}</p>
                    <p className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">{total.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {chartFields.map((f, i) => {
              const colorVals = Object.values(CHART_COLORS).flat() as string[];
              const colors = [colorVals[i % colorVals.length], colorVals[(i + 1) % colorVals.length]];
              
              let series: any[] = [];
              if (f.type === 'gender_split') {
                const mData = barangays.map(b => {
                  const bd = data.find(d => d.barangay_id === b.id);
                  return bd?.data[f.id]?.m || 0;
                });
                const fData = barangays.map(b => {
                  const bd = data.find(d => d.barangay_id === b.id);
                  return bd?.data[f.id]?.f || 0;
                });
                series = [
                  { name: "Male", data: mData },
                  { name: "Female", data: fData }
                ];
              } else {
                const valData = barangays.map(b => {
                  const bd = data.find(d => d.barangay_id === b.id);
                  return bd?.data[f.id]?.value || 0;
                });
                series = [{ name: f.name, data: valData }];
              }

              return (
                <MultiSeriesChart
                  key={f.id}
                  title={`${f.name} by Barangay`}
                  type={f.chartType as any}
                  categories={bNames}
                  series={series}
                  colors={colors}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function DynamicDashboardCharts({ department }: DynamicDashboardChartsProps) {
  const { data: dashboardData, isLoading } = useDynamicDashboardSchemas(department);

  if (isLoading) {
    return null;
  }

  const schemas = (dashboardData?.schemas || []).filter(s => {
    const sData = s.schema as any;
    return !(sData && !Array.isArray(sData) && sData.isBudget);
  });
  const barangays = dashboardData?.barangays || [];
  const schools = dashboardData?.schools || [];

  if (schemas.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      {schemas.map(schema => (
        <ErrorBoundary key={schema.id}>
          <DynamicSchemaSection schema={schema} barangays={schema.tab_key === "education" ? schools : barangays} department={department} />
        </ErrorBoundary>
      ))}
    </div>
  );
}
