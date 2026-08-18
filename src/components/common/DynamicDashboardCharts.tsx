import React, { useState } from 'react';
import MultiSeriesChart from '@/components/charts/MultiSeriesChart';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { CHART_COLORS } from '@/config/chartColors';
import { useDynamicDashboardSchemas, useDynamicSchemaData } from '@/hooks/queries/useDynamicDashboardSchemas';
import YearSelector from '@/components/common/YearSelector';
import { getDefaultYear } from '@/utils/yearUtils';
import { getSchemaSubSector } from '@/utils/subSectorUtils';

interface FieldDef {
  id: string;
  name: string;
  type: 'gender_split' | 'single_value';
  chartType: 'bar' | 'pie' | 'stat_card' | 'hidden';
}

interface DynamicDashboardChartsProps {
  department: string;
  subSector?: string;
}

function DynamicSchemaSection({ schema, barangays, schools = [], daycareCenters = [], department }: { schema: any, barangays: any[], schools?: any[], daycareCenters?: any[], department: string }) {
  const [year, setYear] = useState(() => getDefaultYear(`${department}_${schema.tab_key}`));
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('all');
  const [showTable, setShowTable] = useState(false);
  const { data: schemaData, isLoading } = useDynamicSchemaData(schema.id, year);
  
  const sData = schema.schema as any;
  const targetEntity = sData?.targetEntity || (schema.tab_key === "education" ? "all_schools" : "barangays");

  let entitiesToDisplay = barangays.filter((b: any) => {
    const d = (b.district || '').toLowerCase();
    if (d.startsWith('school') || d.startsWith('daycare') || d.startsWith('eccd') || d.startsWith('cdc')) return false;
    const lower = (b.name || '').toLowerCase();
    if (lower.includes('development center') || lower.includes('daycare') || lower.includes('school')) return false;
    return true;
  });
  if (targetEntity === 'primary_schools') {
    entitiesToDisplay = schools.filter((s: any) => s.district === 'School-Primary' || s.district?.toLowerCase().includes('primary'));
  } else if (targetEntity === 'secondary_schools') {
    entitiesToDisplay = schools.filter((s: any) => s.district === 'School-Secondary' || s.district?.toLowerCase().includes('secondary'));
  } else if (targetEntity === 'all_schools') {
    entitiesToDisplay = schools;
  } else if (targetEntity === 'eccd_centers' || targetEntity === 'daycare_centers') {
    entitiesToDisplay = daycareCenters;
  }

  const isPercentage = sData?.isPercentage || sData?.tableType === 'percentage';
  const percentageGroups = (sData?.groups || []) as { id: string; groupTitle?: string; totalTitle: string; fields: { id: string; name: string }[] }[];
  const fields = (Array.isArray(sData) ? sData : (sData?.fields || [])) as FieldDef[];
  
  const statFields = fields.filter(f => f.chartType === 'stat_card');
  const chartFields = fields.filter(f => f.chartType === 'bar' || f.chartType === 'pie');
  
  const data = schemaData || [];
  const bNames = entitiesToDisplay.map(b => {
    const isPrivate = Boolean(
      b.isPrivate || 
      b.district === 'School-Private' || 
      b.name?.includes('Holy Angel') || 
      b.name?.includes('Moises D. Fernandez')
    );
    return isPrivate ? `${b.name} (Private)` : b.name;
  });

  // Flatten all subfields for percentage tables
  const allPercentageIndicators = percentageGroups.flatMap(g => 
    g.fields.map(f => ({
      groupId: g.id,
      groupTitle: g.groupTitle || g.totalTitle,
      totalTitle: g.totalTitle,
      fieldId: f.id,
      fieldName: f.name,
      fullTitle: `${f.name} (${g.groupTitle || g.totalTitle})`
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
          {/* Indicator filter selector for percentage tables */}
          {isPercentage && allPercentageIndicators.length > 0 && (
            <select
              value={selectedIndicatorId}
              onChange={e => setSelectedIndicatorId(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Indicators</option>
              {allPercentageIndicators.map(ind => (
                <option key={`${ind.groupId}_${ind.fieldId}`} value={`${ind.groupId}_${ind.fieldId}`}>
                  {ind.fullTitle}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowTable(!showTable)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
          >
            {showTable ? "Hide Data Table" : "View Data Table"}
          </button>
          
          <YearSelector 
            year={year} 
            setYear={setYear} 
            yearOptions={targetEntity && targetEntity !== 'barangays' ? Array.from({ length: 10 }, (_, i) => { const y = new Date().getFullYear() - 5 + i; return { value: y, label: `${y}-${y + 1}` }; }) : undefined}
            scopeKey={`${department}_${schema.tab_key}`} 
          />
        </div>
      </div>

      {showTable && (
        <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-4 py-2.5">{targetEntity.includes('school') ? 'School' : 'Barangay'}</th>
                {isPercentage ? (
                  allPercentageIndicators.map(ind => (
                    <th key={`${ind.groupId}_${ind.fieldId}`} className="px-4 py-2.5 text-center">
                      {ind.fieldName} (%)
                    </th>
                  ))
                ) : (
                  fields.map(f => (
                    <th key={f.id} className="px-4 py-2.5 text-center">
                      {f.name}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {entitiesToDisplay.map(b => {
                const bRow = data.find((d: any) => d.barangay_id === b.id)?.data || {};
                return (
                  <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{b.name}</td>
                    {isPercentage ? (
                      allPercentageIndicators.map(ind => {
                        const gData = bRow[ind.groupId] || {};
                        const totalVal = Number(gData.total || 0);
                        const countVal = Number(gData[ind.fieldId] || 0);
                        const pct = totalVal > 0 ? ((countVal / totalVal) * 100).toFixed(1) : '--';
                        return (
                          <td key={`${ind.groupId}_${ind.fieldId}`} className="px-4 py-2 text-center font-semibold text-amber-600 dark:text-amber-400">
                            {pct !== '--' ? `${pct}%` : '--'}
                          </td>
                        );
                      })
                    ) : (
                      fields.map(f => {
                        const fVal = bRow[f.id];
                        let disp = '--';
                        if (fVal) {
                          if (f.type === 'gender_split') {
                            disp = `M: ${fVal.m || 0} | F: ${fVal.f || 0}`;
                          } else {
                            disp = fVal.value !== undefined && fVal.value !== null ? String(fVal.value) : '--';
                          }
                        }
                        return (
                          <td key={f.id} className="px-4 py-2 text-center font-medium">
                            {disp}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
                const pctData = entitiesToDisplay.map(b => {
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

              let entityLabel = "Barangay";
              if (targetEntity.includes('school')) entityLabel = "School";
              else if (targetEntity.includes('eccd') || targetEntity.includes('daycare')) entityLabel = "Daycare Center";

              return (
                <MultiSeriesChart
                  title={selectedIndicatorId === 'all' ? `${entityLabel} Indicator Comparison (%)` : `${activeIndicators[0]?.fieldName} Percentage by ${entityLabel}`}
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
                    <th className="px-3 py-2 font-bold">{targetEntity.includes('school') ? 'School' : (targetEntity.includes('eccd') || targetEntity.includes('daycare') ? 'Daycare Center' : 'Barangay')}</th>
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
                  {entitiesToDisplay.map(b => {
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
                    const rawVal = d.data[f.id];
                    const valNum = (rawVal && typeof rawVal === 'object' && 'value' in rawVal)
                      ? Number(rawVal.value || 0)
                      : (typeof rawVal === 'number' ? rawVal : Number(rawVal || 0));
                    total += isNaN(valNum) ? 0 : valNum;
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

                entitiesToDisplay.forEach(b => {
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
                const valData = entitiesToDisplay.map(b => {
                  const bd = data.find(d => d.barangay_id === b.id);
                  const rawVal = bd?.data[f.id];
                  const valNum = (rawVal && typeof rawVal === 'object' && 'value' in rawVal)
                    ? Number(rawVal.value || 0)
                    : (typeof rawVal === 'number' ? rawVal : Number(rawVal || 0));
                  return isNaN(valNum) ? 0 : valNum;
                });
                series = [{ name: f.name, data: valData }];
              }

              let entityLabel = "Barangay";
              if (targetEntity.includes('school')) entityLabel = "School";
              else if (targetEntity.includes('eccd') || targetEntity.includes('daycare')) entityLabel = "Daycare Center";

              const chartTitle = f.name.toLowerCase().includes('by') 
                ? f.name 
                : `${f.name} by ${entityLabel}`;

              return (
                <MultiSeriesChart
                  key={f.id}
                  title={chartTitle}
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

export default function DynamicDashboardCharts({ department, subSector }: DynamicDashboardChartsProps) {
  const { data: dashboardData, isLoading } = useDynamicDashboardSchemas(department);

  if (isLoading) {
    return null;
  }

  const schemas = (dashboardData?.schemas || []).filter(s => {
    const sData = s.schema as any;
    if (sData && !Array.isArray(sData) && sData.isBudget) return false;

    if (subSector && subSector !== 'all') {
      const sSub = getSchemaSubSector(s);
      if (sSub !== subSector) return false;
    }
    return true;
  });
  const barangays = dashboardData?.barangays || [];
  const schools = dashboardData?.schools || [];
  const daycareCenters = dashboardData?.daycareCenters || [];

  if (schemas.length === 0) {
    return (
      <div className="mt-8 p-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-500 flex items-center justify-center font-bold text-lg">
          +
        </div>
        <p className="font-semibold text-gray-800 dark:text-white">No dynamic charts configured for {department} yet.</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Create custom dynamic tables in <span className="font-semibold text-brand-600 dark:text-brand-400">Settings &gt; Dynamic Tables Manager</span> to view dashboard charts for this sector.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {schemas.map(schema => (
        <ErrorBoundary key={schema.id}>
          <DynamicSchemaSection schema={schema} barangays={barangays} schools={schools} daycareCenters={daycareCenters} department={department} />
        </ErrorBoundary>
      ))}
    </div>
  );
}
