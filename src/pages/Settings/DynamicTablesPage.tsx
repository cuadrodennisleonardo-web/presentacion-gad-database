import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { toast } from 'react-hot-toast';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import PageMeta from '@/components/common/PageMeta';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import type { Database } from '@/types/database';

type DynamicSchema = Database['public']['Tables']['dynamic_schemas']['Row'];

export type DynamicTableCategory = 'standard' | 'budget' | 'percentage' | 'project_tracker' | 'geo_registry' | 'time_series';

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
  groupTitle?: string;
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

interface TablePreset {
  id: string;
  department: string;
  tabName: string;
  description: string;
  category: DynamicTableCategory;
  fields?: FieldDef[];
  groups?: PercentageGroupDef[];
  isBudget?: boolean;
  isPercentage?: boolean;
}

const PRESET_TABLE_SUGGESTIONS: TablePreset[] = [
  {
    id: 'preset-age-brackets',
    department: 'Demographics & Population',
    tabName: 'Age Distribution & Dependency',
    description: 'Track population breakdown across age brackets and calculate dependency ratios.',
    category: 'standard',
    fields: [
      { id: 'f1', name: 'Infants (0-11 months)', type: 'gender_split', chartType: 'bar' },
      { id: 'f2', name: 'Toddlers (1-4 years)', type: 'gender_split', chartType: 'bar' },
      { id: 'f3', name: 'School-Age Children (5-17 years)', type: 'gender_split', chartType: 'bar' },
      { id: 'f4', name: 'Working-Age Adults (18-59 years)', type: 'gender_split', chartType: 'stat_card' },
      { id: 'f5', name: 'Senior Citizens (60+ years)', type: 'gender_split', chartType: 'stat_card' }
    ]
  },
  {
    id: 'preset-civil-status',
    department: 'Demographics & Population',
    tabName: 'Civil Status Demographics',
    description: 'Record civil status distribution across male and female population.',
    category: 'standard',
    fields: [
      { id: 'cs1', name: 'Single Population', type: 'gender_split', chartType: 'bar' },
      { id: 'cs2', name: 'Married Population', type: 'gender_split', chartType: 'bar' },
      { id: 'cs3', name: 'Widowed Population', type: 'gender_split', chartType: 'stat_card' },
      { id: 'cs4', name: 'Separated / Annulled', type: 'gender_split', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-eccd-daycare',
    department: 'Social Development',
    tabName: 'ECCD & Daycare Operations',
    description: 'Monitor early childhood care centers, daycare enrollees, and accredited child workers.',
    category: 'standard',
    fields: [
      { id: 'eccd1', name: 'Daycare Center Enrollees', type: 'gender_split', chartType: 'stat_card' },
      { id: 'eccd2', name: 'Operating Daycare Centers', type: 'single_value', chartType: 'bar' },
      { id: 'eccd3', name: 'Accredited Child Development Workers', type: 'single_value', chartType: 'stat_card' }
    ]
  },
  {
    id: 'preset-health-immunization',
    department: 'Social Development',
    tabName: 'Health & Immunization Coverage',
    description: 'Track infant immunization, communicable diseases, and registered health cases.',
    category: 'standard',
    fields: [
      { id: 'h1', name: 'Fully Immunized Infants', type: 'gender_split', chartType: 'stat_card' },
      { id: 'h2', name: 'Tuberculosis (TB) Registered Patients', type: 'gender_split', chartType: 'bar' },
      { id: 'h3', name: 'Hypertension & Diabetes Patients', type: 'gender_split', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-monthly-dengue',
    department: 'Social Development',
    tabName: 'Monthly Dengue & Disease Outbreaks',
    description: 'Record monthly (Jan-Dec) disease cases to detect peak outbreak seasons.',
    category: 'time_series',
    fields: [
      { id: 'm1', name: 'Dengue Fever Cases', type: 'gender_split', chartType: 'bar' },
      { id: 'm2', name: 'Acute Gastroenteritis Cases', type: 'gender_split', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-agri-crops',
    department: 'Economic Development',
    tabName: 'Agriculture & Crop Production',
    description: 'Track registered crop farmers, RSBSA listings, and total land cultivated.',
    category: 'standard',
    fields: [
      { id: 'ag1', name: 'Rice Farmers', type: 'gender_split', chartType: 'bar' },
      { id: 'ag2', name: 'Corn & Coconut Farmers', type: 'gender_split', chartType: 'bar' },
      { id: 'ag3', name: 'RSBSA Registered Farmers', type: 'single_value', chartType: 'stat_card' },
      { id: 'ag4', name: 'Cultivated Agricultural Land (Hectares)', type: 'single_value', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-fisheries',
    department: 'Economic Development',
    tabName: 'Fisheries & Coastal Aquaculture',
    description: 'Record motorized/non-motorized boat owners, fishpond operators, and mangrove guardians.',
    category: 'standard',
    fields: [
      { id: 'fish1', name: 'Motorized Boat Operators', type: 'single_value', chartType: 'stat_card' },
      { id: 'fish2', name: 'Non-Motorized Boat Operators', type: 'single_value', chartType: 'bar' },
      { id: 'fish3', name: 'Fishpond & Seaweed Farmers', type: 'gender_split', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-quarterly-crops',
    department: 'Economic Development',
    tabName: 'Quarterly Harvest Yields (Metric Tons)',
    description: 'Monitor quarterly agricultural harvests to analyze seasonal crop productivity.',
    category: 'time_series',
    fields: [
      { id: 'q1', name: 'Palay (Rice) Yield (Metric Tons)', type: 'single_value', chartType: 'bar' },
      { id: 'q2', name: 'Corn Yield (Metric Tons)', type: 'single_value', chartType: 'bar' }
    ]
  },
  {
    id: 'preset-electrification',
    department: 'Infrastructure',
    tabName: 'Household Electrification Access',
    description: 'Monitor power grid connectivity, off-grid solar systems, and unserved households.',
    category: 'standard',
    fields: [
      { id: 'pwr1', name: 'Grid Electrified Households', type: 'single_value', chartType: 'stat_card' },
      { id: 'pwr2', name: 'Off-Grid Solar Powered Households', type: 'single_value', chartType: 'bar' },
      { id: 'pwr3', name: 'Unelectrified Households', type: 'single_value', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-infra-projects',
    department: 'Infrastructure',
    tabName: 'Barangay Capital & Infra Projects',
    description: 'Track municipal infrastructure projects, target budgets, start/end dates, and completion status.',
    category: 'project_tracker',
    fields: [
      { id: 'proj1', name: 'Farm-to-Market Concrete Road Paving', type: 'single_value', chartType: 'stat_card' },
      { id: 'proj2', name: 'Barangay Health Center Renovation', type: 'single_value', chartType: 'bar' },
      { id: 'proj3', name: 'Coastal Sea Defense Wall Construction', type: 'single_value', chartType: 'stat_card' }
    ]
  },
  {
    id: 'preset-evacuation-geo',
    department: 'Infrastructure',
    tabName: 'Evacuation Centers & Water Points GPS',
    description: 'Record evacuation facilities with GPS Coordinates (Lat/Lng), capacity, and operational status.',
    category: 'geo_registry',
    fields: [
      { id: 'geo1', name: 'Primary Evacuation Center', type: 'single_value', chartType: 'stat_card' },
      { id: 'geo2', name: 'Level III Potable Water Reservoir', type: 'single_value', chartType: 'bar' }
    ]
  },
  {
    id: 'preset-waste-sanitation',
    department: 'Infrastructure',
    tabName: 'Solid Waste & Sanitation Compliance',
    description: 'Percentage-based monitoring of household waste segregation and toilet sanitation.',
    category: 'percentage',
    isPercentage: true,
    groups: [
      {
        id: 'g1',
        groupTitle: 'Environmental Sanitation Ratios',
        totalTitle: 'Total Households',
        fields: [
          { id: 'w1', name: 'Households Segregating Waste' },
          { id: 'w2', name: 'Households with Sanitary Toilet' },
          { id: 'w3', name: 'Households Served by LGU Collection' }
        ]
      }
    ]
  },
  {
    id: 'preset-governance-bdc',
    department: 'Local Governance',
    tabName: 'Barangay Councils & Youth (SK)',
    description: 'Track active Barangay Development Council members and Sangguniang Kabataan officials.',
    category: 'standard',
    fields: [
      { id: 'gov1', name: 'Active BDC Members', type: 'gender_split', chartType: 'stat_card' },
      { id: 'gov2', name: 'Sangguniang Kabataan (SK) Officials', type: 'gender_split', chartType: 'bar' },
      { id: 'gov3', name: 'Accredited CSO & NGO Representatives', type: 'single_value', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-lupon-disputes',
    department: 'Justice & Safety',
    tabName: 'Katarungang Pambarangay Disputes',
    description: 'Record barangay disputes filed, settled amicably, and referred to court.',
    category: 'standard',
    fields: [
      { id: 'j1', name: 'Disputes Filed Total', type: 'single_value', chartType: 'stat_card' },
      { id: 'j2', name: 'Disputes Settled Amicably', type: 'single_value', chartType: 'bar' },
      { id: 'j3', name: 'Referred to Court (Cert. to File Action)', type: 'single_value', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-gad-budget-util',
    department: 'Institutional GAD',
    tabName: 'Barangay GAD Budget Utilization',
    description: 'Track mandatory 5% GAD budget allocation and actual project expenditure per barangay.',
    category: 'budget',
    isBudget: true,
    fields: [
      { id: 'gb1', name: 'Allocated Mandatory GAD Budget', type: 'single_value', chartType: 'stat_card' },
      { id: 'gb2', name: 'Actual GAD Project Expenditures', type: 'single_value', chartType: 'pie' }
    ]
  },
  {
    id: 'preset-gad-facilities',
    department: 'Institutional GAD',
    tabName: 'Gender-Responsive LGU Facilities',
    description: 'Monitor operational lactation stations, gender-neutral restrooms, and GST training graduates.',
    category: 'standard',
    fields: [
      { id: 'gf1', name: 'Operational Lactation / Breastfeeding Stations', type: 'single_value', chartType: 'stat_card' },
      { id: 'gf2', name: 'Gender-Neutral & PWD Restrooms Installed', type: 'single_value', chartType: 'bar' },
      { id: 'gf3', name: 'Gender Sensitivity Training (GST) Graduates', type: 'gender_split', chartType: 'stat_card' }
    ]
  }
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
  const [tableCategory, setTableCategory] = useState<DynamicTableCategory>('standard');
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [percentageGroups, setPercentageGroups] = useState<PercentageGroupDef[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState<DynamicTableCategory>('standard');
  const [showPresets, setShowPresets] = useState(true);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('All');

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
    setTableCategory(activeTab);
    setFields([]);
    setPercentageGroups([
      {
        id: crypto.randomUUID(),
        groupTitle: '',
        totalTitle: 'Total Households',
        fields: [{ id: crypto.randomUUID(), name: '' }]
      }
    ]);
    setIsModalOpen(true);
  };

  const applyPresetTemplate = (preset: TablePreset) => {
    setEditingSchema(null);
    setDepartment(preset.department);
    setTabName(preset.tabName);
    setDescription(preset.description);
    setTableCategory(preset.category);
    
    if (preset.category === 'percentage' && preset.groups) {
      const newGroups = preset.groups.map(g => ({
        ...g,
        id: crypto.randomUUID(),
        fields: g.fields.map(f => ({ ...f, id: crypto.randomUUID() }))
      }));
      setPercentageGroups(newGroups);
      setFields([]);
    } else if (preset.fields) {
      const newFields = preset.fields.map(f => ({ ...f, id: crypto.randomUUID() }));
      setFields(newFields);
      setPercentageGroups([]);
    }

    setActiveTab(preset.category);
    setIsModalOpen(true);
    toast.success(`Loaded preset template: "${preset.tabName}"!`);
  };

  const handleOpenEdit = (schema: DynamicSchema) => {
    setEditingSchema(schema);
    setDepartment(schema.department);
    setTabName(schema.tab_name);
    
    const sData = schema.schema as any;
    if (Array.isArray(sData)) {
       setDescription('');
       setTableCategory('standard');
       setFields(sData as unknown as FieldDef[]);
       setPercentageGroups([]);
    } else {
       setDescription(sData?.description || '');
       const category: DynamicTableCategory = sData?.tableCategory || (sData?.isPercentage ? 'percentage' : sData?.isBudget ? 'budget' : 'standard');
       setTableCategory(category);
       setFields(sData?.fields || []);
       setPercentageGroups(sData?.groups || []);
    }
    
    setIsModalOpen(true);
  };

  const addField = () => {
    setFields([...fields, { id: crypto.randomUUID(), name: '', type: tableCategory === 'budget' ? 'single_value' : 'gender_split', chartType: 'bar' }]);
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
        groupTitle: '',
        totalTitle: '',
        fields: [{ id: crypto.randomUUID(), name: '' }]
      }
    ]);
  };

  const updatePercentageGroupTitle = (groupIndex: number, totalTitle: string) => {
    const newGroups = [...percentageGroups];
    newGroups[groupIndex].totalTitle = totalTitle;
    setPercentageGroups(newGroups);
  };

  const updatePercentageSubTableTitle = (groupIndex: number, groupTitle: string) => {
    const newGroups = [...percentageGroups];
    newGroups[groupIndex].groupTitle = groupTitle;
    setPercentageGroups(newGroups);
  };

  const addPercentageSubField = (groupIndex: number) => {
    const newGroups = [...percentageGroups];
    newGroups[groupIndex].fields.push({ id: crypto.randomUUID(), name: '' });
    setPercentageGroups(newGroups);
  };

  const updatePercentageSubField = (groupIndex: number, fieldIndex: number, name: string) => {
    const newGroups = [...percentageGroups];
    newGroups[groupIndex].fields[fieldIndex].name = name;
    setPercentageGroups(newGroups);
  };

  const removePercentageSubField = (groupIndex: number, fieldIndex: number) => {
    const newGroups = [...percentageGroups];
    newGroups[groupIndex].fields.splice(fieldIndex, 1);
    setPercentageGroups(newGroups);
  };

  const removePercentageGroup = (groupIndex: number) => {
    const newGroups = [...percentageGroups];
    newGroups.splice(groupIndex, 1);
    setPercentageGroups(newGroups);
  };

  const handleSave = async () => {
    if (!tabName.trim()) {
      toast.error('Please enter a tab name');
      return;
    }

    if (tableCategory === 'percentage') {
      if (percentageGroups.length === 0) {
        toast.error('Please add at least one percentage group');
        return;
      }
      for (const g of percentageGroups) {
        if (!g.totalTitle.trim()) {
          toast.error('Please specify a title for Total Denominator in all groups');
          return;
        }
        if (g.fields.length === 0 || g.fields.some(f => !f.name.trim())) {
          toast.error('Please name all indicator fields in your percentage groups');
          return;
        }
      }
    } else {
      if (fields.length === 0) {
        toast.error('Please add at least one field');
        return;
      }
      if (fields.some(f => !f.name.trim())) {
        toast.error('Please enter a name for all fields');
        return;
      }
    }

    let schemaPayload: any = {};
    if (tableCategory === 'percentage') {
      schemaPayload = {
        description,
        tableCategory: 'percentage',
        isPercentage: true,
        tableType: 'percentage',
        groups: percentageGroups
      };
    } else {
      schemaPayload = {
        description,
        tableCategory,
        isBudget: tableCategory === 'budget',
        fields
      };
    }

    if (editingSchema) {
      const { error } = await supabase
        .from('dynamic_schemas')
        .update({
          department,
          tab_name: tabName,
          schema: schemaPayload
        })
        .eq('id', editingSchema.id);

      if (error) {
        toast.error('Failed to update table');
      } else {
        toast.success('Dynamic table updated successfully');
        setIsModalOpen(false);
        fetchSchemas();
      }
    } else {
      const { error } = await supabase
        .from('dynamic_schemas')
        .insert([{
          department,
          tab_name: tabName,
          schema: schemaPayload
        }]);

      if (error) {
        toast.error('Failed to create table');
      } else {
        toast.success('Dynamic table created successfully');
        setIsModalOpen(false);
        fetchSchemas();
      }
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase.from('dynamic_schemas').delete().eq('id', deletingId);
    if (error) {
      toast.error('Failed to delete table');
    } else {
      toast.success('Table deleted');
      fetchSchemas();
    }
    setDeleteModalOpen(false);
    setDeletingId(null);
  };

  const isSchemaMatchTab = (schema: DynamicSchema, tab: DynamicTableCategory) => {
    const sData = schema.schema as any;
    if (Array.isArray(sData)) {
      return tab === 'standard';
    }
    const category: DynamicTableCategory = sData?.tableCategory || (sData?.isPercentage ? 'percentage' : sData?.isBudget ? 'budget' : 'standard');
    return category === tab;
  };

  const filteredPresets = PRESET_TABLE_SUGGESTIONS.filter(p => {
    if (selectedDepartmentFilter === 'All') return true;
    return p.department === selectedDepartmentFilter;
  });

  return (
    <div>
      <PageMeta title="Dynamic Tables Management" description="Create custom data entry tables dynamically" />
      <PageBreadcrumb pageTitle="Dynamic Tables Manager" rootLabel="Settings" rootPath="/settings/dynamic-tables" />

      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dynamic Tables Manager</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Build custom data tables, budgets, project trackers, geo-registries, and monthly time-series without writing code.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
          >
            <span>{showPresets ? 'Hide Presets' : 'Show Suggested Templates'}</span>
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all cursor-pointer"
          >
            + Create New Table
          </button>
        </div>
      </div>

      {/* SUGGESTED PRESET TABLE TEMPLATES SECTION */}
      {showPresets && (
        <div className="mb-8 rounded-2xl border border-brand-200/80 dark:border-brand-500/30 bg-gradient-to-r from-brand-50/60 via-indigo-50/20 to-white dark:from-brand-950/30 dark:via-gray-900 dark:to-gray-900 p-6 shadow-sm">
          {/* Header Row */}
          <div className="flex flex-col gap-1.5 pb-4 border-b border-brand-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-[11px] font-bold text-brand-700 dark:text-brand-300 border border-brand-500/20">
                <span>Recommended LGU Presets</span>
              </span>
              <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
                • 1-Click Auto-Fill
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
              Suggested Dynamic Table Templates
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-3xl">
              Click any beneficial table template below to instantly load its pre-configured indicators, schema types, and chart settings without writing database code.
            </p>
          </div>

          {/* Department Filter Pills Bar */}
          <div className="pt-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 shrink-0 mr-1">
              Filter Sector:
            </span>
            {['All', ...DEPARTMENTS].map(dep => {
              const label = dep === 'Demographics & Population' ? 'Demographics' : dep;
              const isSelected = selectedDepartmentFilter === dep;
              return (
                <button
                  key={dep}
                  onClick={() => setSelectedDepartmentFilter(dep)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 ring-2 ring-brand-500/20'
                      : 'bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-700 border border-gray-200/80 dark:border-gray-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredPresets.map(preset => (
              <div
                key={preset.id}
                className="group flex flex-col justify-between rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs hover:shadow-md hover:border-brand-400 dark:hover:border-brand-500/50 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-500/20 truncate max-w-[170px]">
                      {preset.department}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      preset.category === 'budget' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                        : preset.category === 'percentage'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : preset.category === 'project_tracker'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                        : preset.category === 'geo_registry'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : preset.category === 'time_series'
                        ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}>
                      {preset.category.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {preset.tabName}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {preset.fields ? `${preset.fields.length} Fields` : `${preset.groups?.[0]?.fields.length || 0} Indicators`}
                  </span>
                  <button
                    onClick={() => applyPresetTemplate(preset)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    <span>Use Template</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Bar covering 6 Categories */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('standard')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'standard'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Standard Count
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'budget'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Budget Allocation
        </button>
        <button
          onClick={() => setActiveTab('percentage')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'percentage'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Percentage Ratios
        </button>
        <button
          onClick={() => setActiveTab('project_tracker')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'project_tracker'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Project Trackers
        </button>
        <button
          onClick={() => setActiveTab('geo_registry')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'geo_registry'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Geo-Spatial Assets
        </button>
        <button
          onClick={() => setActiveTab('time_series')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'time_series'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Monthly Time-Series
        </button>
      </div>

      {/* Tables List */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Tab Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Fields / Config</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading dynamic tables...
                  </td>
                </tr>
              ) : schemas.filter(s => isSchemaMatchTab(s, activeTab)).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No {activeTab.replace('_', ' ')} dynamic tables created yet. Click "+ Create New Table" or select a suggested preset template above.
                  </td>
                </tr>
              ) : (
                schemas.filter(s => isSchemaMatchTab(s, activeTab)).map((schema) => {
                  const sData = schema.schema as any;
                  const isP = sData?.isPercentage || sData?.tableType === 'percentage' || sData?.tableCategory === 'percentage';
                  const cat: DynamicTableCategory = sData?.tableCategory || (isP ? 'percentage' : sData?.isBudget ? 'budget' : 'standard');
                  
                  return (
                    <tr key={schema.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 text-gray-800 dark:text-white/90 font-medium">
                        {schema.department}
                      </td>
                      <td className="px-6 py-4 font-medium text-brand-600 dark:text-brand-400">
                        {schema.tab_name}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {cat.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {isP ? (
                            (sData?.groups || []).map((g: PercentageGroupDef) => (
                              <span key={g.id} className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-md text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 font-medium">
                                {g.groupTitle || g.totalTitle} ({g.fields.map(f => f.name).join(', ')})
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
                        <button onClick={() => handleOpenEdit(schema)} className="text-brand-500 hover:text-brand-600 font-medium mr-4 cursor-pointer">Edit</button>
                        <button onClick={() => { setDeletingId(schema.id); setDeleteModalOpen(true); }} className="text-error-500 hover:text-error-600 font-medium cursor-pointer">Delete</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT DYNAMIC TABLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingSchema ? "Edit Dynamic Table" : `Create ${tableCategory.replace('_', ' ').toUpperCase()} Table`}
                </h2>
                
                {/* Preset Dropdown inside Modal */}
                {!editingSchema && (
                  <select
                    onChange={(e) => {
                      const selected = PRESET_TABLE_SUGGESTIONS.find(p => p.id === e.target.value);
                      if (selected) applyPresetTemplate(selected);
                    }}
                    defaultValue=""
                    className="rounded-lg border border-brand-300 bg-brand-50/50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>Auto-Fill from Preset Template...</option>
                    {PRESET_TABLE_SUGGESTIONS.map(p => (
                      <option key={p.id} value={p.id}>[{p.department}] {p.tabName}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Table Type Category</label>
                    <select
                      value={tableCategory}
                      onChange={e => setTableCategory(e.target.value as DynamicTableCategory)}
                      className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                    >
                      <option value="standard">Standard Count</option>
                      <option value="budget">Budget Allocation</option>
                      <option value="percentage">Percentage & Ratio</option>
                      <option value="project_tracker">Project Milestone Tracker</option>
                      <option value="geo_registry">Geo-Spatial Asset Registry</option>
                      <option value="time_series">Monthly Time-Series</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Tab Name</label>
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
                    placeholder="e.g. Manage custom household sanitation ratios or project progress."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Percentage Table Builder Modal Form */}
                {tableCategory === 'percentage' ? (
                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Data Field Groups</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Configure your Total input title and indicator fields to calculate percentage automatically.</p>
                      </div>
                      <button 
                        onClick={addPercentageGroup} 
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800/50 cursor-pointer"
                      >
                        + Add Total Group
                      </button>
                    </div>

                    {percentageGroups.map((group, gIdx) => (
                      <div key={group.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                Sub-Table / Section Header Title
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Toilet Facility Status"
                                value={group.groupTitle || ''}
                                onChange={e => updatePercentageSubTableTitle(gIdx, e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
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
                          </div>
                          {percentageGroups.length > 1 && (
                            <button
                              onClick={() => removePercentageGroup(gIdx)}
                              className="text-xs text-error-500 hover:text-error-600 font-medium pt-7 cursor-pointer"
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
                              className="text-xs font-medium text-brand-500 hover:text-brand-600 cursor-pointer"
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
                                  className="p-1 text-gray-400 hover:text-error-500 rounded-md cursor-pointer"
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
                  /* Standard / Budget / Project / Geo / Time-Series Modal Form */
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Data Fields</h3>
                      <button onClick={addField} className="text-xs font-medium text-brand-500 hover:text-brand-600 cursor-pointer">+ Add Field</button>
                    </div>
                    
                    {fields.length === 0 ? (
                      <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500">
                        No fields added yet. Select a preset template above or click "+ Add Field" to start building.
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
                            <div className="w-full sm:w-36">
                              <select
                                value={field.type}
                                onChange={e => updateField(idx, 'type', e.target.value as any)}
                                disabled={tableCategory === 'budget' || tableCategory === 'project_tracker' || tableCategory === 'geo_registry'}
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-white"
                              >
                                {tableCategory !== 'budget' && tableCategory !== 'project_tracker' && tableCategory !== 'geo_registry' && <option value="gender_split">Male/Female</option>}
                                <option value="single_value">{tableCategory === 'budget' ? 'Currency (₱)' : 'Single Value'}</option>
                              </select>
                            </div>
                            <div className="w-full sm:w-36">
                              <select
                                value={field.chartType}
                                onChange={e => updateField(idx, 'chartType', e.target.value as any)}
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              >
                                <option value="bar">Bar Chart</option>
                                <option value="pie">{tableCategory === 'budget' ? 'Line Graph' : 'Line/Area Graph'}</option>
                                <option value="stat_card">Total Summary Card</option>
                                <option value="hidden">Hidden from Dash</option>
                              </select>
                            </div>
                            <button onClick={() => removeField(idx)} className="p-1.5 text-gray-400 hover:text-error-500 rounded-md cursor-pointer">
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
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 cursor-pointer"
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
