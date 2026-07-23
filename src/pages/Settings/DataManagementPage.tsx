import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import { createPortal } from 'react-dom';

interface NativeSubTable {
  key: string;
  label: string;
  columns: string[];
}

const NATIVE_SUB_TABLES: Record<string, NativeSubTable[]> = {
  'Demographics & Population': [
    {
      key: 'total_population',
      label: 'Native: Total Population',
      columns: ['male_count', 'female_count', 'total_population']
    },
    {
      key: 'household_heads',
      label: 'Native: Total Households',
      columns: ['total_households', 'household_heads_total', 'household_heads_m', 'household_heads_f']
    }
  ],
  'Social Development': [
    {
      key: 'student_enrollment',
      label: 'Native: Student Enrollment',
      columns: ['student_enrollment_m', 'student_enrollment_f', 'student_enrollment_total']
    },
    {
      key: 'drop_outs',
      label: 'Native: School Drop-outs',
      columns: ['drop_out_m', 'drop_out_f', 'drop_out_total']
    },
    {
      key: 'osy',
      label: 'Native: Out-of-School Youth (OSY)',
      columns: ['osy_m', 'osy_f', 'osy_total']
    },
    {
      key: 'malnourished',
      label: 'Native: Malnourished Children',
      columns: ['malnourished_m', 'malnourished_f', 'malnourished_total']
    },
    {
      key: 'teen_maternal',
      label: 'Native: Teen Pregnancy & Maternal Mortality',
      columns: ['teenage_pregnancy', 'maternal_mortality']
    },
    {
      key: 'pwds',
      label: 'Native: Persons with Disabilities (PWDs)',
      columns: ['pwd_m', 'pwd_f', 'pwd_total']
    },
    {
      key: 'four_ps',
      label: 'Native: 4Ps Beneficiaries',
      columns: ['four_ps_m', 'four_ps_f', 'four_ps_total']
    },
    {
      key: 'senior_citizens',
      label: 'Native: Senior Citizens',
      columns: ['senior_citizens_m', 'senior_citizens_f', 'senior_citizens_total']
    },
    {
      key: 'solo_parents',
      label: 'Native: Solo Parents',
      columns: ['solo_parents_m', 'solo_parents_f', 'solo_parents_total']
    }
  ],
  'Economic Development': [
    {
      key: 'employed',
      label: 'Native: Employed Population',
      columns: ['employed_m', 'employed_f', 'employed_total']
    },
    {
      key: 'unemployed',
      label: 'Native: Unemployed Population',
      columns: ['unemployed_m', 'unemployed_f', 'unemployed_total']
    },
    {
      key: 'farmers',
      label: 'Native: Farmers',
      columns: ['farmers_m', 'farmers_f', 'farmers_total']
    },
    {
      key: 'fisherfolks',
      label: 'Native: Fisherfolks',
      columns: ['fisherfolks_m', 'fisherfolks_f', 'fisherfolks_total']
    },
    {
      key: 'business_owners',
      label: 'Native: Business Owners',
      columns: ['business_owners_m', 'business_owners_f', 'business_owners_total']
    },
    {
      key: 'ambulant_vendors',
      label: 'Native: Ambulant Vendors',
      columns: ['ambulant_vendors_m', 'ambulant_vendors_f', 'ambulant_vendors_total']
    }
  ],
  'Infrastructure': [
    {
      key: 'safe_water',
      label: 'Native: Safe Water Access',
      columns: ['safe_water_m', 'safe_water_f', 'safe_water_total']
    },
    {
      key: 'sanitary_toilet',
      label: 'Native: Sanitary Toilets',
      columns: ['sanitary_toilet_m', 'sanitary_toilet_f', 'sanitary_toilet_total']
    },
    {
      key: 'informal_settlers',
      label: 'Native: Informal Settlers',
      columns: ['informal_settlers_m', 'informal_settlers_f', 'informal_settlers_total']
    }
  ],
  'Local Governance': [
    {
      key: 'elected_officials',
      label: 'Native: Elected Officials',
      columns: ['elected_officials_m', 'elected_officials_f', 'elected_officials_total']
    },
    {
      key: 'appointed_heads',
      label: 'Native: Appointed Department Heads',
      columns: ['appointed_heads_m', 'appointed_heads_f', 'appointed_heads_total']
    }
  ],
  'Justice & Safety': [
    {
      key: 'vawc',
      label: 'Native: Reported VAWC Cases',
      columns: ['vawc_cases_reported']
    },
    {
      key: 'cicl',
      label: 'Native: Children in Conflict with Law (CICL)',
      columns: ['cicl_m', 'cicl_f', 'cicl_total']
    },
    {
      key: 'sexual_assault',
      label: 'Native: Sexual Assault Cases',
      columns: ['sexual_assault_m', 'sexual_assault_f', 'sexual_assault_total']
    }
  ],
  'Institutional GAD': [
    {
      key: 'gad_budget',
      label: 'Native: GAD Budget & Allocations',
      columns: ['total_lgu_budget', 'gad_allocated_amount', 'gad_utilized_amount']
    },
    {
      key: 'gad_trainings',
      label: 'Native: GAD Trainings & Participants',
      columns: ['number_of_gad_trainings', 'participants_trained']
    }
  ]
};

export default function DataManagementPage() {
  const queryClient = useQueryClient();
  const [department, setDepartment] = useState('');
  const [tableSelection, setTableSelection] = useState('all');
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const DEPARTMENTS = [
    'Demographics & Population',
    'Social Development',
    'Economic Development',
    'Infrastructure',
    'Local Governance',
    'Justice & Safety',
    'Institutional GAD'
  ];

  const getNativeTableName = (dept: string) => {
    switch (dept) {
      case 'Demographics & Population': return 'population_stats';
      case 'Social Development': return 'social_dev_stats';
      case 'Economic Development': return 'econ_dev_stats';
      case 'Infrastructure': return 'infra_stats';
      case 'Local Governance': return 'governance_stats';
      case 'Justice & Safety': return 'justice_stats';
      case 'Institutional GAD': return 'gad_stats';
      default: return '';
    }
  };

  const { data: dynamicSchemas = [] } = useQuery({
    queryKey: ['dynamic_schemas', department],
    queryFn: async () => {
      if (!department) return [];
      const { data } = await supabase.from('dynamic_schemas').select('*').eq('department', department);
      return data || [];
    },
    enabled: !!department
  });

  const getSelectedTableName = () => {
    if (tableSelection === 'all') return 'All Tables';
    if (tableSelection === 'native_all') return `All Native Tables (${getNativeTableName(department)})`;
    if (tableSelection.startsWith('native:')) {
      const subKey = tableSelection.replace('native:', '');
      const sub = (NATIVE_SUB_TABLES[department] || []).find(s => s.key === subKey);
      return sub ? sub.label : 'Native Sub-Table';
    }
    const schema = dynamicSchemas.find(s => s.id === tableSelection);
    if (schema) return `Dynamic: ${schema.tab_name}`;
    return 'Data';
  };

  const expectedConfirmText = `delete ${getSelectedTableName().toLowerCase()}`;

  const mutation = useMutation({
    mutationFn: async () => {
      const nativeTable = getNativeTableName(department);

      if (tableSelection === 'all') {
        // Delete all native data for this department and year
        if (nativeTable) {
          const { error } = await supabase.from(nativeTable).delete().eq('year', year);
          if (error) throw error;
        }
        // Delete all dynamic data for this department and year
        const targetSchemas = dynamicSchemas.map(s => s.id);
        if (targetSchemas.length > 0) {
          const { error } = await supabase.rpc('delete_dynamic_data_by_year', {
            p_year: year,
            p_schema_ids: targetSchemas
          });
          if (error) throw error;
        }
      } else if (tableSelection === 'native_all') {
        // Delete entire native table records for this year
        if (nativeTable) {
          const { error } = await supabase.from(nativeTable).delete().eq('year', year);
          if (error) throw error;
        }
      } else if (tableSelection.startsWith('native:')) {
        // Reset specific columns of a native sub-table for this year
        const subKey = tableSelection.replace('native:', '');
        const sub = (NATIVE_SUB_TABLES[department] || []).find(s => s.key === subKey);
        if (nativeTable && sub) {
          const resetObj: Record<string, any> = {};
          sub.columns.forEach(col => {
            if (col.endsWith('_total') || col === 'total_population') {
              resetObj[col] = null;
            } else {
              resetObj[col] = 0;
            }
          });
          const { error } = await supabase.from(nativeTable).update(resetObj).eq('year', year);
          if (error) throw error;
        }
      } else {
        // Delete dynamic data for a specific dynamic table schema
        const { error } = await supabase.rpc('delete_dynamic_data_by_year', {
          p_year: year,
          p_schema_ids: [tableSelection]
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Data deleted successfully.');
      setShowConfirm(false);
      setConfirmText('');

      // Invalidate all related caches so dashboards and data entry reflect the change
      queryClient.invalidateQueries({ queryKey: ['main_dashboard_stats'] });
      queryClient.invalidateQueries({ queryKey: ['demographics_stats'] });
      queryClient.invalidateQueries({ queryKey: ['social_dev_stats'] });
      queryClient.invalidateQueries({ queryKey: ['econ_dev_stats'] });
      queryClient.invalidateQueries({ queryKey: ['infra_stats'] });
      queryClient.invalidateQueries({ queryKey: ['governance_stats'] });
      queryClient.invalidateQueries({ queryKey: ['justice_stats'] });
      queryClient.invalidateQueries({ queryKey: ['gad_stats'] });
      queryClient.invalidateQueries({ queryKey: ['native_data'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic_dashboard_data'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete data');
    }
  });

  const handleDeleteClick = () => {
    if (!department) {
      toast.error("Please select a department first");
      return;
    }
    setShowConfirm(true);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <PageMeta title="Data Management | Settings" />
      <PageBreadcrumb pageTitle="Data Management" items={[{ label: "Settings", path: "/settings" }, { label: "Data Management" }]} />

      <div className="mt-6 max-w-4xl flex flex-col gap-6">
        
        {/* Header / Info Banner */}
        <div className="bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/10 dark:to-red-900/5 border border-red-200 dark:border-red-800/30 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-full shrink-0 mt-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Caution: Destructive Actions</h2>
            <p className="text-red-700/80 dark:text-red-400/80 text-sm leading-relaxed max-w-2xl">
              This module allows you to permanently delete records for a specific table or sub-table for a selected year. 
              <strong> This action cannot be undone.</strong> Please review your selection carefully before proceeding.
            </p>
          </div>
        </div>

        {/* Selection Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-theme-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Target Data Selection
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setTableSelection('all');
                }}
                className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow p-3 shadow-sm"
              >
                <option value="">-- Choose Department --</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1 ml-1">Select the department whose data you wish to delete.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2000"
                max="2100"
                className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow p-3 shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">The specific year of the records to be deleted.</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Target Table / Sub-Table
              </label>
              <select
                value={tableSelection}
                onChange={(e) => setTableSelection(e.target.value)}
                disabled={!department}
                className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow p-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-500 dark:disabled:text-white"
              >
                <option value="all">All Tables (Native + Dynamic)</option>
                {department && (
                  <>
                    <option value="native_all">All Native Tables ({getNativeTableName(department)})</option>
                    {(NATIVE_SUB_TABLES[department] || []).map(sub => (
                      <option key={sub.key} value={`native:${sub.key}`}>
                        {sub.label}
                      </option>
                    ))}
                  </>
                )}
                {dynamicSchemas.map((schema: any) => (
                  <option key={schema.id} value={schema.id}>
                    Dynamic: {schema.tab_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
            <button
              onClick={handleDeleteClick}
              disabled={!department}
              className="group relative flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-semibold shadow-md transition-all hover:shadow-lg disabled:shadow-none"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Initiate Deletion
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Confirm Data Deletion
              </h3>
              <button onClick={() => { setShowConfirm(false); setConfirmText(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
                <p className="leading-relaxed">
                  You are about to permanently delete records from <strong>{getSelectedTableName()}</strong> for the year <strong>{year}</strong> under <strong>{department}</strong>.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 font-medium">
                  To proceed, please type the following confirmation exactly: <br/>
                  <span className="inline-block mt-2 font-mono bg-white dark:bg-black px-2 py-1 rounded text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-700 shadow-sm">{expectedConfirmText}</span>
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 p-2.5 font-mono text-sm"
                  placeholder={expectedConfirmText}
                  autoComplete="off"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={confirmText !== expectedConfirmText || mutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:dark:bg-red-900/50 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm font-medium"
                >
                  {mutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Confirm Deletion'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
