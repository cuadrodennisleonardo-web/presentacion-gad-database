import React, { useState } from 'react';
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
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('all');
  const [showTable, setShowTable] = useState(false);
  const { data: schemaData, isLoading } = useDynamicSchemaData(schema.id, year);
  
  const sData = schema.schema as any;
  const isPercentage = sData?.isPercentage || sData?.tableType === 'percentage';
  const percentageGroups = (sData?.groups || []) as { id: string; totalTitle: string; fields: { id: string; name: string }[] }[];
  const fields = (Array.isArray(sData) ? sData : (sData?.fields || [])) as FieldDef[];
  
  const statFields = fields.filter(f => f.chartType === 'stat_card');
  const chartFields = fields.filter(f => f.chartType === 'bar' || f.chartType === 'pie');
  
  const data = schemaData || [];
  const bNames = barangays.map(b => b.name);

  // Flatten all subfields for percentage tables
  const allPercentageIndicators = percentageGroups.flatMap(g => 
    g.fields.map(f => ({
      groupId: g.id,
      groupTitle: g.totalTitle,
      fieldId: f.id,
      fieldName: f.name,
      fullTitle: `${f.name} (${g.totalTitle})`
    }))
  );

  return (
    <div className="mb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">{schema.tab_name} Metrics</h3>
          {isPercentage && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Barangay coverage ratios & automatic percentage indicators</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isPercentage && (
            <button
              onClick={() => setShowTable(!showTable)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {showTable ? 'Hide Table View' : 'Show Summary Table'}
            </button>
          )}
          <YearSelector year={year} setYear={setYear} scopeKey={`${department}_${schema.tab_key}`} />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <svg className="h-6 w-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      ) : isPercentage ? (
        /* Percentage Table Visualizer */
        <div className="space-y-6">
          {/* Municipal Overview Progress Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allPercentageIndicators.map(ind => {
              let totalSum = 0;
              let countSum = 0;

              data.forEach(d => {
                const gObj = d.data?.[ind.groupId] || {};
                totalSum += Number(gObj.total || 0);
                countSum += Number(gObj[ind.fieldId] || 0);
              });

              const overallPct = totalSum > 0 ? (countSum / totalSum) * 100 : 0;

              return (
                <div key={`${ind.groupId}_${ind.fieldId}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{ind.fieldName}</p>
                    <span className="text-xs font-medium text-gray-400">vs {ind.groupTitle}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{overallPct.toFixed(1)}%</p>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{countSum.toLocaleString()} / {totalSum.toLocaleString()}</p>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div 
                      className="h-full rounded-full bg-brand-500 transition-all duration-500" 
                      style={{ width: `${Math.min(overallPct, 100)}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicator Selector Tabs */}
          {allPercentageIndicators.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-2">Filter Chart View:</span>
              <button
                onClick={() => setSelectedIndicatorId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedIndicatorId === 'all'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                All Indicators (Comparison)
              </button>
              {allPercentageIndicators.map(ind => {
                const key = `${ind.groupId}_${ind.fieldId}`;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedIndicatorId(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedIndicatorId === key
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {ind.fieldName} (%)
                  </button>
                );
              })}
            </div>
          )}

          {/* Bar Chart Visualization */}
          <div className="grid grid-cols-1 gap-6">
            {(() => {
              const activeIndicators = selectedIndicatorId === 'all'
                ? allPercentageIndicators
                : allPercentageIndicators.filter(ind => `${ind.groupId}_${ind.fieldId}` === selectedIndicatorId);

              const colorVals = Object.values(CHART_COLORS).flat() as string[];
              
              const series = activeIndicators.map((ind) => {
                const pctData = barangays.map(b => {
                  const bd = data.find(d => d.barangay_id === b.id);
                  const gObj = bd?.data?.[ind.groupId] || {};
                  const tot = Number(gObj.total || 0);
                  const val = Number(gObj[ind.fieldId] || 0);
                  return tot > 0 ? Number(((val / tot) * 100).toFixed(1)) : 0;
                });

                return {
                  name: `${ind.fieldName} (%)`,
                  data: pctData
                };
              });

              const chartColors = activeIndicators.map((_, i) => colorVals[i % colorVals.length]);

              return (
                <MultiSeriesChart
                  title={selectedIndicatorId === 'all' ? "Barangay Indicator Comparison (%)" : `${activeIndicators[0]?.fieldName} Percentage by Barangay`}
                  type="bar"
                  categories={bNames}
                  series={series}
                  colors={chartColors}
                />
              );
            })()}
          </div>

          {/* Detailed Summary Breakdown Table (Expandable) */}
          {showTable && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-x-auto">
              <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Complete Multi-Column Breakdown</h4>
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-3 py-2 font-bold">Barangay</th>
                    {percentageGroups.map(g => (
                      <React.Fragment key={g.id}>
                        <th className="px-3 py-2 text-center font-bold bg-gray-100 dark:bg-gray-800">{g.totalTitle}</th>
                        {g.fields.map(sf => (
                          <React.Fragment key={sf.id}>
                            <th className="px-3 py-2 text-center font-semibold">{sf.name}</th>
                            <th className="px-3 py-2 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40">% {sf.name}</th>
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {barangays.map(b => {
                    const bd = data.find(d => d.barangay_id === b.id);
                    const bData = bd?.data || {};

                    return (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{b.name}</td>
                        {percentageGroups.map(g => {
                          const gData = bData[g.id] || {};
                          const totalVal = Number(gData.total || 0);

                          return (
                            <React.Fragment key={g.id}>
                              <td className="px-3 py-2 text-center font-semibold bg-gray-50/50 dark:bg-gray-900/20">{totalVal.toLocaleString()}</td>
                              {g.fields.map(sf => {
                                const val = gData[sf.id] !== undefined && gData[sf.id] !== null ? Number(gData[sf.id]) : null;
                                const pct = totalVal > 0 && val !== null ? ((val / totalVal) * 100).toFixed(1) : null;

                                return (
                                  <React.Fragment key={sf.id}>
                                    <td className="px-3 py-2 text-center">{val !== null ? val.toLocaleString() : '--'}</td>
                                    <td className="px-3 py-2 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-50/30 dark:bg-amber-950/20">
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
          )}
        </div>
      ) : (
        /* Standard Table Visualizer */
        <>
          {statFields.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statFields.map(f => {
                let total = 0;
                if (f.type === 'gender_split') {
                  data.forEach(d => {
                    const fData = d.data[f.id] || {};
                    const m = Number(fData.m || 0);
                    const fVal = Number(fData.f || 0);
                    const rawTot = fData.total;
                    if (m > 0 || fVal > 0) {
                      total += m + fVal;
                    } else if (rawTot !== null && rawTot !== undefined && rawTot > 0) {
                      total += Number(rawTot);
                    }
                  });
                } else {
                  data.forEach(d => {
                    total += Number(d.data[f.id]?.value || 0);
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
              
              let series: any[] = [];
              let chartColors = [colorVals[i % colorVals.length], colorVals[(i + 1) % colorVals.length]];

              if (f.type === 'gender_split') {
                let hasTotalOnly = false;
                const mData: number[] = [];
                const fData: number[] = [];
                const totData: number[] = [];

                barangays.forEach(b => {
                  const bd = data.find(d => d.barangay_id === b.id);
                  const fObj = bd?.data[f.id] || {};
                  const m = Number(fObj.m || 0);
                  const fVal = Number(fObj.f || 0);
                  const rawTot = fObj.total;
                  const isTot = rawTot !== null && rawTot !== undefined && rawTot > 0 && !m && !fVal;

                  if (isTot) hasTotalOnly = true;

                  mData.push(m);
                  fData.push(fVal);
                  totData.push(isTot || (rawTot > 0 && m + fVal === 0) ? Number(rawTot) : m + fVal);
                });

                if (hasTotalOnly) {
                  series = [{ name: "Total", data: totData }];
                  chartColors = ["#3b82f6"];
                } else {
                  series = [
                    { name: "Male", data: mData },
                    { name: "Female", data: fData }
                  ];
                }
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
                  colors={chartColors}
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
