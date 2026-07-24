import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { toast } from 'react-hot-toast';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import PageMeta from '@/components/common/PageMeta';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import type { Database } from '@/types/database';

type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];

interface FieldDef {
  id: string;
  name: string;
  type: 'gender_split' | 'single_value';
  chartType: 'bar' | 'pie' | 'stat_card' | 'hidden';
}

export interface PercentageSubField {
  id: string;
  name: string;
}

export interface PercentageGroupDef {
  id: string;
  totalTitle: string;
  fields: PercentageSubField[];
}

const DEPARTMENTS = [
  'Demographics & Population',
  'Social Development',
  'Economic Development',
  'Infrastructure',
  'Local Governance',
  'Justice & Safety',
  'Institutional GAD'
];

export default function DynamicTablesPage() {
  const [schemas, setSchemas] = useState<DynamicSchema[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState<DynamicSchema | null>(null);
  
  // Form state
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [tabName, setTabName] = useState('');
  const [description, setDescription] = useState('');
  const [isBudget, setIsBudget] = useState(false);
  const [isPercentage, setIsPercentage] = useState(false);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [percentageGroups, setPercentageGroups] = useState<PercentageGroupDef[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState<'standard' | 'budget' | 'percentage'>('standard');

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('dynamic_schemas').select('*').order('department').order('tab_name');
    if (error) {
      toast.error('Failed to load dynamic tables');
    } else {
      setSchemas(data || []);
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingSchema(null);
    setDepartment(DEPARTMENTS[0]);
    setTabName('');
    setDescription('');
    setIsBudget(activeTab === 'budget');
    setIsPercentage(activeTab === 'percentage');
    setFields([]);
    setPercentageGroups([
      {
        id: crypto.randomUUID(),
        totalTitle: 'Total Households',
        fields: [{ id: crypto.randomUUID(), name: '' }]
      }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schema: DynamicSchema) => {
    setEditingSchema(schema);
    setDepartment(schema.department);
    setTabName(schema.tab_name);
    
    const sData = schema.schema as any;
    if (Array.isArray(sData)) {
       setDescription('');
       setIsBudget(false);
       setIsPercentage(false);
       setFields(sData as unknown as FieldDef[]);
       setPercentageGroups([]);
    } else {
       setDescription(sData?.description || '');
       const isB = sData?.isBudget || false;
       const isP = sData?.isPercentage || sData?.tableType === 'percentage' || false;
       setIsBudget(isB);
       setIsPercentage(isP);
       setFields(sData?.fields || []);
       setPercentageGroups(sData?.groups || []);
    }
    
    setIsModalOpen(true);
  };

  const addField = () => {
    setFields([...fields, { id: crypto.randomUUID(), name: '', type: isBudget ? 'single_value' : 'gender_split', chartType: 'bar' }]);
  };

  const updateField = (index: number, key: keyof FieldDef, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  // Percentage Group Management
  const addPercentageGroup = () => {
    setPercentageGroups([
      ...percentageGroups,
      {
        id: crypto.randomUUID(),
        totalTitle: '',
        fields: [{ id: crypto.randomUUID(), name: '' }]
      }
    ]);
  };

  const removePercentageGroup = (gIdx: number) => {
    const updated = [...percentageGroups];
    updated.splice(gIdx, 1);
    setPercentageGroups(updated);
  };

  const updatePercentageGroupTitle = (gIdx: number, title: string) => {
    const updated = [...percentageGroups];
    updated[gIdx] = { ...updated[gIdx], totalTitle: title };
    setPercentageGroups(updated);
  };

  const addPercentageSubField = (gIdx: number) => {
    const updated = [...percentageGroups];
    updated[gIdx] = {
      ...updated[gIdx],
      fields: [...updated[gIdx].fields, { id: crypto.randomUUID(), name: '' }]
    };
    setPercentageGroups(updated);
  };

  const updatePercentageSubField = (gIdx: number, fIdx: number, name: string) => {
    const updated = [...percentageGroups];
    const fieldsCopy = [...updated[gIdx].fields];
    fieldsCopy[fIdx] = { ...fieldsCopy[fIdx], name };
    updated[gIdx] = { ...updated[gIdx], fields: fieldsCopy };
    setPercentageGroups(updated);
  };

  const removePercentageSubField = (gIdx: number, fIdx: number) => {
    const updated = [...percentageGroups];
    const fieldsCopy = [...updated[gIdx].fields];
    fieldsCopy.splice(fIdx, 1);
    updated[gIdx] = { ...updated[gIdx], fields: fieldsCopy };
    setPercentageGroups(updated);
  };

  const handleSave = async () => {
    if (!tabName.trim()) {
      toast.error('Tab name is required');
      return;
    }

    if (isPercentage) {
      if (percentageGroups.length === 0) {
        toast.error('At least one Total Group is required');
        return;
      }
      for (const g of percentageGroups) {
        if (!g.totalTitle.trim()) {
          toast.error('Total Title is required for all groups (e.g. Total Households)');
          return;
        }
        if (g.fields.length === 0) {
          toast.error(`At least one data field is required for ${g.totalTitle}`);
          return;
        }
        for (const sf of g.fields) {
          if (!sf.name.trim()) {
            toast.error('All data field names must be filled out');
            return;
          }
        }
      }
    } else {
      for (const f of fields) {
        if (!f.name.trim()) {
          toast.error('All fields must have a name');
          return;
        }
      }
    }

    const payload = {
      department,
      tab_name: tabName,
      schema: isPercentage 
        ? ({ description, isPercentage: true, tableType: 'percentage', groups: percentageGroups } as any)
        : ({ description, isBudget, fields } as any)
    };

    try {
      if (editingSchema) {
        const { error } = await supabase.from('dynamic_schemas').update(payload).eq('id', editingSchema.id);
        if (error) throw error;
        toast.success('Table updated successfully');
      } else {
        const { error } = await supabase.from('dynamic_schemas').insert([payload]);
        if (error) throw error;
        toast.success('Table created successfully');
      }
      setIsModalOpen(false);
      fetchSchemas();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save table');
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase.from('dynamic_schemas').delete().eq('id', deletingId);
      if (error) throw error;
      toast.success('Table deleted successfully');
      setDeleteModalOpen(false);
      fetchSchemas();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete table');
    }
  };

  const isSchemaMatchTab = (s: DynamicSchema, tab: 'standard' | 'budget' | 'percentage') => {
    const sData = s.schema as any;
    if (!sData || Array.isArray(sData)) {
      return tab === 'standard';
    }
    const isB = sData.isBudget;
    const isP = sData.isPercentage || sData.tableType === 'percentage';
    if (tab === 'percentage') return !!isP;
    if (tab === 'budget') return !!isB && !isP;
    return !isB && !isP;
  };

  return (
    <div>
      <PageMeta title="Dynamic Tables | Presentacion" description="Manage custom data tables" />
      <PageBreadcrumb pageTitle="Dynamic Tables" />
      
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Dynamic Schema Builder</h2>
          <p className="text-sm text-gray-500 mt-1">Create custom data tables and dashboard metrics for departments.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 shadow-sm transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New {activeTab === 'budget' ? 'Budget Table' : activeTab === 'percentage' ? 'Percentage Table' : 'Standard Table'}
        </button>
      </div>

      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('standard')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'standard' 
              ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Standard Data Tables
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'budget' 
              ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Budget Tables
        </button>
        <button
          onClick={() => setActiveTab('percentage')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'percentage' 
              ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Percentage / Ratio Tables
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Tab Name</th>
                <th className="px-6 py-4 font-semibold">Fields Configured</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>
              ) : schemas.filter(s => isSchemaMatchTab(s, activeTab)).length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center">No dynamic tables created yet in this category.</td></tr>
              ) : (
                schemas.filter(s => isSchemaMatchTab(s, activeTab)).map((schema) => {
                  const sData = schema.schema as any;
                  const isP = sData?.isPercentage || sData?.tableType === 'percentage';
                  
                  return (
                    <tr key={schema.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 text-gray-800 dark:text-white/90 font-medium">
                        {schema.department}
                      </td>
                      <td className="px-6 py-4 font-medium text-brand-600 dark:text-brand-400">
                        {schema.tab_name}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {isP ? (
                            (sData?.groups || []).map((g: PercentageGroupDef) => (
                              <span key={g.id} className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-md text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 font-medium">
                                {g.totalTitle} ({g.fields.map(f => f.name).join(', ')})
                              </span>
                            ))
                          ) : (
                            ((Array.isArray(sData) ? sData : sData?.fields) || []).map((f: FieldDef) => (
                              <span key={f.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                {f.name} ({f.type === 'gender_split' ? 'M/F' : 'Single'})
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenEdit(schema)} className="text-brand-500 hover:text-brand-600 font-medium mr-4">Edit</button>
                        <button onClick={() => { setDeletingId(schema.id); setDeleteModalOpen(true); }} className="text-error-500 hover:text-error-600 font-medium">Delete</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {editingSchema ? "Edit Dynamic Table" : isPercentage ? "Create Percentage & Ratio Table" : isBudget ? "Create Budget Table" : "Create Dynamic Table"}
              </h2>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tab Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Health & Nutrition"
                      value={tabName}
                      onChange={e => setTabName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Manage custom household sanitation ratios."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Percentage Table Builder Modal Form */}
                {isPercentage ? (
                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Data Field Groups</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Configure your Total input title and indicator fields to calculate percentage automatically.</p>
                      </div>
                      <button 
                        onClick={addPercentageGroup} 
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800/50"
                      >
                        + Add Total Group
                      </button>
                    </div>

                    {percentageGroups.map((group, gIdx) => (
                      <div key={group.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              Name of Total (Denominator)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Total Households"
                              value={group.totalTitle}
                              onChange={e => updatePercentageGroupTitle(gIdx, e.target.value)}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>
                          {percentageGroups.length > 1 && (
                            <button
                              onClick={() => removePercentageGroup(gIdx)}
                              className="text-xs text-error-500 hover:text-error-600 font-medium pt-5"
                            >
                              Remove Group
                            </button>
                          )}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-gray-200/80 dark:border-gray-700/60">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Indicator Data Fields (Counts to compare against Total)
                            </label>
                            <button
                              onClick={() => addPercentageSubField(gIdx)}
                              className="text-xs font-medium text-brand-500 hover:text-brand-600"
                            >
                              + Add Field
                            </button>
                          </div>

                          {group.fields.map((sf, fIdx) => (
                            <div key={sf.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Field Name (e.g. Household w/ ST)"
                                value={sf.name}
                                onChange={e => updatePercentageSubField(gIdx, fIdx, e.target.value)}
                                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              />
                              <span className="text-xs px-2 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded font-medium">
                                Fixed Auto %
                              </span>
                              {group.fields.length > 1 && (
                                <button
                                  onClick={() => removePercentageSubField(gIdx, fIdx)}
                                  className="p-1 text-gray-400 hover:text-error-500 rounded-md"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Standard / Budget Modal Form */
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Data Fields</h3>
                      <button onClick={addField} className="text-xs font-medium text-brand-500 hover:text-brand-600">+ Add Field</button>
                    </div>
                    
                    {fields.length === 0 ? (
                      <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500">
                        No fields added yet. Click "+ Add Field" to start building your table.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fields.map((field, idx) => (
                          <div key={field.id} className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Field Name (e.g. Total Schools)"
                                value={field.name}
                                onChange={e => updateField(idx, 'name', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="w-full sm:w-32">
                              <select
                                value={field.type}
                                onChange={e => updateField(idx, 'type', e.target.value)}
                                disabled={isBudget}
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-white"
                              >
                                {!isBudget && <option value="gender_split">Male/Female</option>}
                                <option value="single_value">{isBudget ? 'Currency' : 'Single Value'}</option>
                              </select>
                            </div>
                            <div className="w-full sm:w-36">
                              <select
                                value={field.chartType}
                                onChange={e => updateField(idx, 'chartType', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              >
                                <option value="bar">Bar Chart</option>
                                <option value="pie">{isBudget ? 'Line Graph' : 'Line/Area Graph'}</option>
                                <option value="stat_card">Total Summary Card</option>
                                <option value="hidden">Hidden from Dash</option>
                              </select>
                            </div>
                            <button onClick={() => removeField(idx)} className="p-1.5 text-gray-400 hover:text-error-500 rounded-md">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Save Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Dynamic Table"
        message="Are you sure you want to delete this table? All associated data entries for this table will be permanently deleted across all barangays."
        isDestructive={true}
      />
    </div>
  );
}
