import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import { supabase } from '../../config/supabase';
import { formatDate } from '../../lib/utils';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: any;
  new_data: any;
  changed_at: string;
  user_profiles: {
    full_name: string;
    email: string;
    department: string | null;
  } | null;
}

interface ApprovalLog {
  id: string;
  module: string;
  tab: string;
  year: number;
  status: string;
  comments: string | null;
  changes?: any;
  created_at: string;
  updated_at: string;
  user_profiles: {
    full_name: string;
    email: string;
  } | null;
}

const parseDevice = (ua: string) => {
  if (!ua) return 'Unknown Device';
  const uaLower = ua.toLowerCase();
  let os = 'Unknown OS';
  if (uaLower.includes('windows')) os = 'Windows';
  else if (uaLower.includes('mac')) os = 'Mac';
  else if (uaLower.includes('linux')) os = 'Linux';
  else if (uaLower.includes('android')) os = 'Android';
  else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS';
  
  let browser = '';
  if (uaLower.includes('edg/')) browser = 'Edge';
  else if (uaLower.includes('chrome/')) browser = 'Chrome';
  else if (uaLower.includes('firefox/')) browser = 'Firefox';
  else if (uaLower.includes('safari/') && !uaLower.includes('chrome/')) browser = 'Safari';
  
  if (browser) return `${os} (${browser})`;
  return os !== 'Unknown OS' ? os : (ua.split(' ')[0] || 'Unknown Device');
};

const getTableLabel = (tableName: string) => {
  switch (tableName) {
    case 'population_stats': return 'Demographics & Population';
    case 'social_dev_stats': return 'Social Development';
    case 'econ_dev_stats': return 'Economic Development';
    case 'infra_stats': return 'Infrastructure';
    case 'governance_stats': return 'Local Governance';
    case 'justice_stats': return 'Justice & Safety';
    case 'gad_stats': return 'Institutional GAD';
    case 'dynamic_data': return 'Dynamic Tables';
    case 'user_profiles': return 'User Management';
    case 'data_approvals': return 'Data Approvals';
    case 'notifications': return 'Notifications';
    case 'auth.users': return 'System Auth';
    default: return tableName || 'System';
  }
};

const getTableReadableName = (tableName: string) => {
  switch (tableName) {
    case 'population_stats': return 'Population Stats';
    case 'social_dev_stats': return 'Social Dev Stats';
    case 'econ_dev_stats': return 'Economic Dev Stats';
    case 'infra_stats': return 'Infrastructure Stats';
    case 'governance_stats': return 'Governance Stats';
    case 'justice_stats': return 'Justice & Safety Stats';
    case 'gad_stats': return 'GAD Stats';
    case 'dynamic_data': return 'Dynamic Table Data';
    case 'dynamic_schemas': return 'Dynamic Table Schema';
    case 'user_profiles': return 'User Profiles';
    case 'data_approvals': return 'Data Approvals';
    case 'notifications': return 'Notifications';
    default: return tableName || 'Unknown Table';
  }
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'data' | 'auth' | 'approvals'>('all');
  const [dynamicSchemas, setDynamicSchemas] = useState<any[]>([]);

  useEffect(() => {
    const fetchSchemas = async () => {
      const { data } = await supabase.from('dynamic_schemas').select('id, tab_name');
      if (data) setDynamicSchemas(data);
    };
    fetchSchemas();
  }, []);

  const inferSubTableInfo = (log: any) => {
    if (log.table_name === 'dynamic_data') {
      const schemaId = log.new_data?.schema_id || log.old_data?.schema_id;
      const schema = dynamicSchemas.find(s => s.id === schemaId);
      return {
        mainTable: 'Dynamic Tables',
        subTable: schema ? schema.tab_name : 'Dynamic Table Data'
      };
    }

    const oldData = log.old_data || {};
    const newData = log.new_data || {};
    const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
    const changedKeys = allKeys.filter(k => 
      !['id', 'updated_at', 'created_at', 'month_updated', 'year', 'barangay_id'].includes(k) &&
      oldData[k] !== newData[k]
    );

    if (log.table_name === 'population_stats') {
      const mainTable = 'Population Stats';
      const hasPop = changedKeys.some(k => k.includes('male_count') || k.includes('female_count') || k === 'total_population');
      const hasHH = changedKeys.some(k => k.startsWith('household_heads') || k.includes('households'));
      if (hasPop && hasHH) return { mainTable, subTable: 'Total Population & Households' };
      if (hasHH) return { mainTable, subTable: 'Total Households' };
      return { mainTable, subTable: 'Total Population' };
    }

    if (log.table_name === 'social_dev_stats') {
      const mainTable = 'Social Dev Stats';
      if (changedKeys.some(k => k.includes('student_enrollment'))) return { mainTable, subTable: 'Student Enrollment' };
      if (changedKeys.some(k => k.includes('drop_out'))) return { mainTable, subTable: 'School Drop-outs' };
      if (changedKeys.some(k => k.includes('osy'))) return { mainTable, subTable: 'Out-of-School Youth' };
      if (changedKeys.some(k => k.includes('malnourished'))) return { mainTable, subTable: 'Malnourished Children' };
      if (changedKeys.some(k => k.includes('teenage_pregnancy') || k.includes('maternal_mortality'))) return { mainTable, subTable: 'Teen Pregnancy & Maternal Mortality' };
      if (changedKeys.some(k => k.includes('pwd'))) return { mainTable, subTable: 'Persons with Disabilities (PWDs)' };
      if (changedKeys.some(k => k.includes('four_ps'))) return { mainTable, subTable: '4Ps Beneficiaries' };
      if (changedKeys.some(k => k.includes('senior_citizens'))) return { mainTable, subTable: 'Senior Citizens' };
      if (changedKeys.some(k => k.includes('solo_parents'))) return { mainTable, subTable: 'Solo Parents' };
      return { mainTable, subTable: 'Social Development Data' };
    }

    if (log.table_name === 'econ_dev_stats') {
      const mainTable = 'Economic Dev Stats';
      if (changedKeys.some(k => k.includes('employed') && !k.includes('unemployed'))) return { mainTable, subTable: 'Employed Population' };
      if (changedKeys.some(k => k.includes('unemployed'))) return { mainTable, subTable: 'Unemployed Population' };
      if (changedKeys.some(k => k.includes('farmers'))) return { mainTable, subTable: 'Farmers' };
      if (changedKeys.some(k => k.includes('fisherfolks'))) return { mainTable, subTable: 'Fisherfolks' };
      if (changedKeys.some(k => k.includes('business_owners'))) return { mainTable, subTable: 'Business Owners' };
      if (changedKeys.some(k => k.includes('ambulant_vendors'))) return { mainTable, subTable: 'Ambulant Vendors' };
      return { mainTable, subTable: 'Economic Development Data' };
    }

    if (log.table_name === 'infra_stats') {
      const mainTable = 'Infrastructure Stats';
      if (changedKeys.some(k => k.includes('safe_water'))) return { mainTable, subTable: 'Safe Water Access' };
      if (changedKeys.some(k => k.includes('sanitary_toilet'))) return { mainTable, subTable: 'Sanitary Toilets' };
      if (changedKeys.some(k => k.includes('informal_settlers'))) return { mainTable, subTable: 'Informal Settlers' };
      return { mainTable, subTable: 'Infrastructure Data' };
    }

    if (log.table_name === 'governance_stats') {
      const mainTable = 'Governance Stats';
      if (changedKeys.some(k => k.includes('elected_officials'))) return { mainTable, subTable: 'Elected Officials' };
      if (changedKeys.some(k => k.includes('appointed_heads'))) return { mainTable, subTable: 'Appointed Department Heads' };
      return { mainTable, subTable: 'Governance Data' };
    }

    if (log.table_name === 'justice_stats') {
      const mainTable = 'Justice Stats';
      if (changedKeys.some(k => k.includes('vawc'))) return { mainTable, subTable: 'Reported VAWC Cases' };
      if (changedKeys.some(k => k.includes('cicl'))) return { mainTable, subTable: 'Children in Conflict with Law' };
      if (changedKeys.some(k => k.includes('sexual_assault'))) return { mainTable, subTable: 'Sexual Assault Cases' };
      return { mainTable, subTable: 'Justice Data' };
    }

    if (log.table_name === 'gad_stats') {
      const mainTable = 'GAD Stats';
      if (changedKeys.some(k => k.includes('budget') || k.includes('amount'))) return { mainTable, subTable: 'GAD Budget & Allocations' };
      if (changedKeys.some(k => k.includes('trainings') || k.includes('participants'))) return { mainTable, subTable: 'GAD Trainings' };
      return { mainTable, subTable: 'Institutional GAD Data' };
    }

    return {
      mainTable: getTableReadableName(log.table_name),
      subTable: 'General Record'
    };
  };

  const inferApprovalSubTable = (log: ApprovalLog) => {
    const changes = log.changes || {};
    const firstKey = Object.keys(changes)[0];
    const rowChanges = firstKey ? changes[firstKey] : {};
    const keys = Object.keys(rowChanges || {});

    if (keys.some(k => k.startsWith('household_heads') || k.includes('households'))) return 'Total Households';
    if (keys.some(k => k.includes('male_count') || k.includes('female_count') || k === 'total_population')) return 'Total Population';
    if (keys.some(k => k.includes('student_enrollment'))) return 'Student Enrollment';
    if (keys.some(k => k.includes('drop_out'))) return 'School Drop-outs';
    if (keys.some(k => k.includes('osy'))) return 'Out-of-School Youth';
    if (keys.some(k => k.includes('malnourished'))) return 'Malnourished Children';
    if (keys.some(k => k.includes('teenage_pregnancy') || k.includes('maternal_mortality'))) return 'Teen Pregnancy & Maternal Mortality';
    if (keys.some(k => k.includes('pwd'))) return 'Persons with Disabilities';
    if (keys.some(k => k.includes('four_ps'))) return '4Ps Beneficiaries';
    if (keys.some(k => k.includes('senior_citizens'))) return 'Senior Citizens';
    if (keys.some(k => k.includes('solo_parents'))) return 'Solo Parents';
    if (keys.some(k => k.includes('employed') && !k.includes('unemployed'))) return 'Employed Population';
    if (keys.some(k => k.includes('unemployed'))) return 'Unemployed Population';
    if (keys.some(k => k.includes('farmers'))) return 'Farmers';
    if (keys.some(k => k.includes('fisherfolks'))) return 'Fisherfolks';
    if (keys.some(k => k.includes('business_owners'))) return 'Business Owners';
    if (keys.some(k => k.includes('ambulant_vendors'))) return 'Ambulant Vendors';
    if (keys.some(k => k.includes('safe_water'))) return 'Safe Water Access';
    if (keys.some(k => k.includes('sanitary_toilet'))) return 'Sanitary Toilets';
    if (keys.some(k => k.includes('informal_settlers'))) return 'Informal Settlers';
    if (keys.some(k => k.includes('elected_officials'))) return 'Elected Officials';
    if (keys.some(k => k.includes('appointed_heads'))) return 'Appointed Department Heads';
    if (keys.some(k => k.includes('vawc'))) return 'Reported VAWC Cases';
    if (keys.some(k => k.includes('cicl'))) return 'Children in Conflict with Law';
    if (keys.some(k => k.includes('sexual_assault'))) return 'Sexual Assault Cases';

    return null;
  };

  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchApprovalLogs();
    } else {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(200);

      if (activeTab === 'data') {
        query = query.in('action', ['INSERT', 'UPDATE', 'DELETE']);
      } else if (activeTab === 'auth') {
        query = query.in('action', ['LOGIN', 'LOGOUT']);
      }

      const { data: logsData, error: logsError } = await query;

      if (logsError) throw logsError;

      // Fetch corresponding user profiles
      const uniqueUserIds = Array.from(new Set(logsData.map(log => log.changed_by).filter(Boolean)));
      
      let profilesMap: Record<string, any> = {};
      
      if (uniqueUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, department')
          .in('id', uniqueUserIds);
          
        if (!profilesError && profilesData) {
           profilesData.forEach(p => {
             profilesMap[p.id] = { full_name: p.full_name, email: p.email, department: p.department };
           });
        }
      }

      const mergedLogs = logsData.map(log => ({
        ...log,
        user_profiles: log.changed_by ? profilesMap[log.changed_by] || null : null
      }));

      setLogs(mergedLogs as unknown as AuditLog[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_approvals')
        .select(`*, user_profiles!submitted_by(full_name, email)`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setApprovalLogs((data || []) as unknown as ApprovalLog[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch approval logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'approvals') {
      fetchApprovalLogs();
    } else {
      fetchLogs();
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400';
      case 'UPDATE': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400';
      case 'DELETE': return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400';
      case 'LOGIN': return 'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400';
      case 'rejected': return 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400';
      case 'pending': return 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
      case 'rejected':
        return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
      case 'pending':
        return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default: return null;
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'All Events' },
    { key: 'data' as const, label: 'Data Changes' },
    { key: 'auth' as const, label: 'Authentication' },
    { key: 'approvals' as const, label: 'Approvals' },
  ];

  const getTargetColumnHeader = () => {
    switch (activeTab) {
      case 'data': return 'Table / Sub-Table';
      case 'auth': return 'Device / Platform';
      case 'approvals': return 'Module / Tab / Sub-Table';
      default: return 'Table / Device / Platform';
    }
  };

  return (
    <>
      <PageMeta title="System Audit Logs" description="Track system changes and activity" />
      <PageBreadcrumb pageTitle="System Audit Logs" rootLabel="Administration" rootPath={null} />
      
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
         <div className="p-5 lg:p-6 border-b border-gray-200 dark:border-gray-800">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
               <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Activity Log
               </h3>
               <p className="text-sm text-gray-500">Recent system changes, data entry, logins, and approval decisions (Last 200 events).</p>
             </div>
             <button 
               onClick={handleRefresh}
               className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 shrink-0 transition"
             >
               <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
               Refresh
             </button>
           </div>
           
           {/* Tabs */}
           <div className="mt-6 flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
             {tabs.map(t => (
               <button
                 key={t.key}
                 onClick={() => setActiveTab(t.key)}
                 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                   activeTab === t.key 
                     ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400' 
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                 }`}
               >
                 {t.label}
               </button>
             ))}
           </div>
         </div>

         {loading ? (
           <div className="flex justify-center py-12"><LoadingSpinner /></div>
         ) : activeTab === 'approvals' ? (
           /* Approvals Tab */
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
               <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                 <tr>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Date</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Submitted By</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Module / Tab / Sub-Table</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Year</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Comments</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                 {approvalLogs.map((log) => {
                   const subTableLabel = inferApprovalSubTable(log);
                   return (
                     <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                       <td className="whitespace-nowrap px-4 py-3 text-xs">
                         {formatDate(log.created_at, { hour: 'numeric', minute: 'numeric' })}
                       </td>
                       <td className="whitespace-nowrap px-4 py-3">
                         <div className="flex flex-col">
                           <span className="font-medium text-gray-900 dark:text-white">
                             {log.user_profiles?.full_name || 'Unknown'}
                           </span>
                           <span className="text-xs text-gray-500">
                             {log.user_profiles?.email || 'N/A'}
                           </span>
                         </div>
                       </td>
                       <td className="whitespace-nowrap px-4 py-3">
                         <div className="flex flex-col">
                           <span className="font-medium text-gray-900 dark:text-white">{log.module}</span>
                           <span className="text-xs text-gray-500">
                             {log.tab}{subTableLabel ? ` › ${subTableLabel}` : ''}
                           </span>
                         </div>
                       </td>
                       <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">{log.year}</td>
                       <td className="whitespace-nowrap px-4 py-3">
                         <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(log.status)}`}>
                           {getStatusIcon(log.status)}
                           {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={log.comments || ''}>
                         {log.comments || '—'}
                       </td>
                     </tr>
                   );
                 })}
                 {approvalLogs.length === 0 && (
                   <tr>
                     <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                       No approval records found.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         ) : (
           /* Regular Audit Log */
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
               <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                 <tr>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Timestamp</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">User</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Action</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">{getTargetColumnHeader()}</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Department</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                 {logs.map((log) => {
                   const { mainTable, subTable } = inferSubTableInfo(log);
                   const isAuthAction = ['LOGIN', 'LOGOUT'].includes(log.action);

                   return (
                     <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                       <td className="whitespace-nowrap px-4 py-3 text-xs">
                         {formatDate(log.changed_at, { hour: 'numeric', minute: 'numeric' })}
                       </td>
                       <td className="whitespace-nowrap px-4 py-3">
                         <div className="flex flex-col">
                           <span className="font-medium text-gray-900 dark:text-white">
                             {log.user_profiles?.full_name || 'System / Unknown'}
                           </span>
                           <span className="text-xs text-gray-500">
                             {log.user_profiles?.email || 'N/A'}
                           </span>
                         </div>
                       </td>
                       <td className="whitespace-nowrap px-4 py-3">
                         <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}>
                           {log.action}
                         </span>
                       </td>
                       <td className="whitespace-nowrap px-4 py-3 text-xs">
                         {isAuthAction ? (
                           <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-medium text-gray-700 dark:text-gray-300">
                             {parseDevice(log.new_data?.user_agent)}
                           </span>
                         ) : (
                           <div className="flex flex-col">
                             <span className="font-medium text-gray-900 dark:text-white">{mainTable}</span>
                             <span className="text-xs text-gray-500">{subTable}</span>
                           </div>
                         )}
                       </td>
                       <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                         {isAuthAction 
                           ? (log.user_profiles?.department || 'System Auth')
                           : getTableLabel(log.table_name)
                         }
                       </td>
                     </tr>
                   );
                 })}
                 {logs.length === 0 && (
                   <tr>
                     <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                       No audit logs found.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         )}
      </div>
    </>
  );
}
