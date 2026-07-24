import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/config/supabase';

interface ReviewChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval: any;
}

// Human-readable labels for every field, organized by module+tab
const FIELD_LABELS: Record<string, string> = {
  // Demographics (population_stats)
  male_count: 'Total Population (M)',
  female_count: 'Total Population (F)',
  total_population: 'Total Population',
  total_households: 'Total Households',
  household_heads_total: 'Total Households',
  household_heads_m: 'Household Heads (M)',
  household_heads_f: 'Household Heads (F)',
  solo_parents_m: 'Solo Parents (M)',
  solo_parents_f: 'Solo Parents (F)',
  // Social Welfare (population_stats)
  pwd_m: 'PWD (M)',
  pwd_f: 'PWD (F)',
  four_ps_m: '4Ps Beneficiaries (M)',
  four_ps_f: '4Ps Beneficiaries (F)',
  four_ps_children_m: '4Ps Children in Education (M)',
  four_ps_children_f: '4Ps Children in Education (F)',
  senior_citizens_m: 'Senior Citizens (M)',
  senior_citizens_f: 'Senior Citizens (F)',
  // Education (social_dev_stats)
  student_enrollment_m: 'Student Enrollment (M)',
  student_enrollment_f: 'Student Enrollment (F)',
  drop_out_m: 'School Drop-out (M)',
  drop_out_f: 'School Drop-out (F)',
  osy_m: 'Out-of-School Youth (M)',
  osy_f: 'Out-of-School Youth (F)',
  // Health (social_dev_stats)
  malnourished_m: 'Malnourished (M)',
  malnourished_f: 'Malnourished (F)',
  teenage_pregnancy: 'Teenage Pregnancy',
  maternal_mortality: 'Maternal Mortality',
  // Economic Development
  employed_m: 'Employed (M)',
  employed_f: 'Employed (F)',
  unemployed_m: 'Unemployed (M)',
  unemployed_f: 'Unemployed (F)',
  farmers_m: 'Farmers (M)',
  farmers_f: 'Farmers (F)',
  fisherfolks_m: 'Fisherfolks (M)',
  fisherfolks_f: 'Fisherfolks (F)',
  business_owners_m: 'Business Owners (M)',
  business_owners_f: 'Business Owners (F)',
  ambulant_vendors_m: 'Ambulant Vendors (M)',
  ambulant_vendors_f: 'Ambulant Vendors (F)',
  // Infrastructure
  safe_water_m: 'Safe Water (M-Led)',
  safe_water_f: 'Safe Water (F-Led)',
  sanitary_toilet_m: 'Sanitary Toilet (M-Led)',
  sanitary_toilet_f: 'Sanitary Toilet (F-Led)',
  informal_settlers_m: 'Informal Settlers (M-Led)',
  informal_settlers_f: 'Informal Settlers (F-Led)',
  // Governance
  elected_officials_m: 'Elected Officials (M)',
  elected_officials_f: 'Elected Officials (F)',
  appointed_heads_m: 'Appointed Heads (M)',
  appointed_heads_f: 'Appointed Heads (F)',
  cicl_m: 'CICL (M)',
  cicl_f: 'CICL (F)',
  sexual_assault_m: 'Sexual Assault (M)',
  sexual_assault_f: 'Sexual Assault (F)',
  vawc_cases_reported: 'VAWC Cases',
  // GAD
  total_lgu_budget: 'Total LGU Budget',
  gad_allocated_amount: 'GAD Allocated',
  gad_utilized_amount: 'GAD Utilized',
  number_of_gad_trainings: 'GAD Trainings',
  participants_trained: 'Participants Trained',
};

// Define the exact field order for each module+tab to match data entry layout
const FIELD_ORDER: Record<string, string[]> = {
  'Social Development|Demographics': ['male_count', 'female_count', 'total_population', 'total_households', 'household_heads_total', 'solo_parents_m', 'solo_parents_f'],
  'Social Development|Education': ['student_enrollment_m', 'student_enrollment_f', 'drop_out_m', 'drop_out_f', 'osy_m', 'osy_f'],
  'Social Development|Health & Nutrition': ['malnourished_m', 'malnourished_f', 'teenage_pregnancy', 'maternal_mortality'],
  'Social Development|Social Welfare': ['pwd_m', 'pwd_f', 'four_ps_m', 'four_ps_f', 'four_ps_children_m', 'four_ps_children_f', 'senior_citizens_m', 'senior_citizens_f', 'solo_parents_m', 'solo_parents_f'],
  'Economic Development|Labor Force': ['employed_m', 'employed_f', 'unemployed_m', 'unemployed_f'],
  'Economic Development|Agriculture & Fisheries': ['farmers_m', 'farmers_f', 'fisherfolks_m', 'fisherfolks_f'],
  'Economic Development|Commerce & Trade': ['business_owners_m', 'business_owners_f', 'ambulant_vendors_m', 'ambulant_vendors_f'],
  'Infrastructure|Basic Utilities & Housing': ['safe_water_m', 'safe_water_f', 'sanitary_toilet_m', 'sanitary_toilet_f', 'informal_settlers_m', 'informal_settlers_f'],
  'Governance|Leadership & Participation': ['elected_officials_m', 'elected_officials_f', 'appointed_heads_m', 'appointed_heads_f'],
  'Governance|Peace & Justice': ['vawc_cases_reported', 'cicl_m', 'cicl_f', 'sexual_assault_m', 'sexual_assault_f'],
  'Institutional GAD|Municipal Data': ['total_lgu_budget', 'gad_allocated_amount', 'gad_utilized_amount', 'number_of_gad_trainings', 'participants_trained'],
};

export default function ReviewChangesModal({ isOpen, onClose, approval }: ReviewChangesModalProps) {
  const [barangayMap, setBarangayMap] = useState<Record<string, string>>({});
  const [dynamicFieldLabels, setDynamicFieldLabels] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (isOpen) {
      const fetchBarangays = async () => {
        const { data } = await supabase.from('barangays').select('id, name');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(b => map[b.id] = b.name);
          setBarangayMap(map);
        }
      };

      const fetchDynamicSchemas = async () => {
        const { data } = await supabase.from('dynamic_schemas').select('schema');
        if (data) {
          const labels: Record<string, string> = {};
          data.forEach(row => {
            const sData = row.schema as any;
            if (Array.isArray(sData)) {
              sData.forEach((field: any) => {
                if (field.id && field.name) {
                  labels[field.id.toLowerCase()] = field.name;
                }
              });
            } else if (sData) {
              if (sData.isPercentage || sData.tableType === 'percentage') {
                (sData.groups || []).forEach((g: any) => {
                  if (g.id && g.totalTitle) {
                    labels[g.id.toLowerCase()] = g.totalTitle;
                  }
                  (g.fields || []).forEach((sf: any) => {
                    if (sf.id && sf.name) {
                      labels[sf.id.toLowerCase()] = sf.name;
                    }
                  });
                });
              } else if (Array.isArray(sData.fields)) {
                sData.fields.forEach((field: any) => {
                  if (field.id && field.name) {
                    labels[field.id.toLowerCase()] = field.name;
                  }
                });
              }
            }
          });
          setDynamicFieldLabels(labels);
        }
      };

      fetchBarangays();
      fetchDynamicSchemas();
    }
  }, [isOpen]);

  if (!isOpen || !approval) return null;

  const rawChanges = approval.changes as Record<string, Record<string, { old: any, new: any }>>;
  const changes: Record<string, Record<string, { old: any, new: any }>> = {};

  // First, identify all fields that should be split (gender_split) by checking all barangays
  const splitFields = new Set<string>();
  Object.keys(rawChanges).forEach(bId => {
    Object.keys(rawChanges[bId]).forEach(field => {
      const cellData = rawChanges[bId][field];
      const oldIsObj = cellData.old && typeof cellData.old === 'object';
      const newIsObj = cellData.new && typeof cellData.new === 'object';
      
      if (
        (oldIsObj && ('m' in cellData.old || 'f' in cellData.old)) ||
        (newIsObj && ('m' in cellData.new || 'f' in cellData.new))
      ) {
        splitFields.add(field);
      }
    });
  });

  Object.keys(rawChanges).forEach(bId => {
    changes[bId] = {};
    Object.keys(rawChanges[bId]).forEach(field => {
      const cellData = rawChanges[bId][field];

      if (splitFields.has(field)) {
        changes[bId][`${field}_m`] = {
          old: cellData.old?.m,
          new: cellData.new?.m,
        };
        changes[bId][`${field}_f`] = {
          old: cellData.old?.f,
          new: cellData.new?.f,
        };
      } else {
        changes[bId][field] = cellData;
      }
    });
  });
  
  // Get ordered fields from our mapping, falling back to whatever is in the data
  const orderKey = `${approval.module}|${approval.tab}`;
  const definedOrder = FIELD_ORDER[orderKey];
  
  // Extract all unique fields that were changed across all barangays
  const allFields = new Set<string>();
  Object.keys(changes).forEach(bId => {
    Object.keys(changes[bId]).forEach(field => {
      allFields.add(field);
    });
  });

  // Use ordered fields first, then append any extras that aren't in the defined order
  let fields: string[];
  if (definedOrder) {
    fields = definedOrder.filter(f => allFields.has(f));
    // Add any remaining fields not in the order map
    allFields.forEach(f => {
      if (!fields.includes(f)) fields.push(f);
    });
  } else {
    fields = Array.from(allFields);
  }

  const getLabel = (field: string) => {
    const baseField = field.replace(/_m$/, '').replace(/_f$/, '').toLowerCase();
    if (dynamicFieldLabels[baseField]) {
      if (field.endsWith('_m')) return `${dynamicFieldLabels[baseField]} (M)`;
      if (field.endsWith('_f')) return `${dynamicFieldLabels[baseField]} (F)`;
      return dynamicFieldLabels[baseField];
    }
    return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCellClasses = (oldVal: any, newVal: any) => {
    const isOldEmpty = oldVal === 0 || oldVal === '' || oldVal === null || oldVal === undefined;
    const isNewEmpty = newVal === 0 || newVal === '' || newVal === null || newVal === undefined;
    
    if (isOldEmpty && !isNewEmpty) {
      // New data added in empty cell
      return 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300';
    } else if (oldVal !== newVal) {
      // Data updated/changed
      return 'bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-200';
    }
    return '';
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transform transition-all max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Changes</h2>
            <p className="text-sm text-gray-500 mt-1">
              {approval.module} — {approval.tab} ({approval.year})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-6 text-xs">
          <span className="font-medium text-gray-500 dark:text-gray-400">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-success-100 dark:bg-success-900/30 border border-success-200 dark:border-success-800"></span>
            <span className="text-gray-600 dark:text-gray-400">New data (was empty)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-warning-100 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-800"></span>
            <span className="text-gray-600 dark:text-gray-400">Updated value</span>
          </span>
        </div>

        {/* Table */}
        <div className="p-6 flex-1 flex flex-col min-h-0">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-auto flex-1">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium border-b dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10">Barangay</th>
                  {fields.map(f => (
                    <th key={f} className="px-4 py-3 font-medium border-b dark:border-gray-700 border-l dark:border-gray-700 whitespace-nowrap text-center">
                      {getLabel(f)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {Object.keys(changes).map(bId => {
                  const isMunicipal = bId === 'municipal';
                  const label = isMunicipal ? 'Municipal Wide' : (barangayMap[bId] || 'Unknown Barangay');
                  
                  return (
                    <tr key={bId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900 z-10">
                        {label}
                      </td>
                      {fields.map(f => {
                        const cellData = changes[bId][f];
                        if (!cellData) {
                          return <td key={f} className="px-4 py-3 border-l dark:border-gray-800 text-center text-gray-300 dark:text-gray-600">—</td>;
                        }

                        const { old: oldVal, new: newVal } = cellData;
                        const hasChanged = oldVal !== newVal;
                        const isOldEmpty = oldVal === 0 || oldVal === '' || oldVal === null || oldVal === undefined;
                        
                        const renderValue = (val: any) => {
                          if (val === null || val === undefined || val === '') return '';
                          if (typeof val === 'object') {
                            const parts = [];
                            if ('m' in val) parts.push(`M: ${val.m}`);
                            if ('f' in val) parts.push(`F: ${val.f}`);
                            if (parts.length > 0) return parts.join(', ');
                            if ('value' in val) return String(val.value);
                            return JSON.stringify(val);
                          }
                          return String(val);
                        };

                        return (
                          <td key={f} className={`px-4 py-3 border-l dark:border-gray-800 text-center ${hasChanged ? getCellClasses(oldVal, newVal) : ''}`}>
                            {hasChanged ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-semibold text-sm break-all">{renderValue(newVal)}</span>
                                {!isOldEmpty && (
                                  <span className="text-[10px] line-through opacity-60 break-all">{renderValue(oldVal)}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 break-all">{renderValue(newVal)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {Object.keys(changes).length} barangay{Object.keys(changes).length !== 1 ? 's' : ''} modified · {fields.length} field{fields.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-brand-500 hover:bg-brand-600 px-6 py-2 text-sm font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
