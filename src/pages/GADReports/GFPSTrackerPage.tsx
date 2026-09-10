import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useRole } from '@/hooks/useRole';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import YearSelector from '@/components/common/YearSelector';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import type { Database } from '@/types/database';

type GFPSMember = Database['public']['Tables']['gfps_members']['Row'];

export default function GFPSTrackerPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { canWrite, isSuperAdmin } = useRole();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<GFPSMember>>({
    name: '',
    position: '',
    office: '',
    role_in_gfps: 'excom',
    committee: 'Executive Committee',
    contact_number: '',
    email: '',
    is_active: true,
  });

  const { data: members = [], isLoading } = useQuery<GFPSMember[]>({
    queryKey: ['gfps_members', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gfps_members')
        .select('*')
        .eq('year', year)
        .order('role_in_gfps', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newMember: Partial<GFPSMember>) => {
      const { data, error } = await supabase.from('gfps_members').insert([
        {
          name: newMember.name || '',
          position: newMember.position || '',
          office: newMember.office || '',
          role_in_gfps: newMember.role_in_gfps || 'excom',
          committee: newMember.committee || 'Executive Committee',
          contact_number: newMember.contact_number || '',
          email: newMember.email || '',
          year,
          is_active: true,
        },
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gfps_members', year] });
      toast.success('GFPS Member added');
      setShowAddModal(false);
      setFormData({
        name: '',
        position: '',
        office: '',
        role_in_gfps: 'excom',
        committee: 'Executive Committee',
        contact_number: '',
        email: '',
        is_active: true,
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add member');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gfps_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gfps_members', year] });
      toast.success('Member removed');
    },
  });

  const excomMembers = members.filter((m) => m.role_in_gfps === 'chairperson' || m.role_in_gfps === 'vice_chair' || m.role_in_gfps === 'excom');
  const twgMembers = members.filter((m) => m.role_in_gfps === 'twg' || m.role_in_gfps === 'secretariat');

  return (
    <div className="space-y-6 pb-12">
      <PageMeta
        title="GAD Focal Point System (GFPS)"
        description="Municipal GFPS institutional mechanism & composition tracker"
      />
      <PageBreadcrumb pageTitle="GFPS Directory" hideNav={false} />

      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-gray-800/90 p-6 sm:p-7 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
            JMC 2013-01 Section 4.1.4
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">GAD Focal Point System (GFPS)</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            Institutional mechanism established to catalyze and accelerate gender mainstreaming in the municipality (Executive Committee, TWG, and Secretariat).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <YearSelector year={year} setYear={setYear} scopeKey="gfps" />
          {canWrite && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add GFPS Member
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total GFPS Members</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{members.length}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Constituted for {year}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Executive Committee</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{excomMembers.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">LCE, MPDO, and Department Heads</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Technical Working Group</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{twgMembers.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">TWG officers & Secretariat</p>
        </div>
      </div>

      {/* Members Directory */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">GFPS Plantilla & Roster (FY {year})</h2>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No GFPS members recorded for {year}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click "Add GFPS Member" to populate the municipal directory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3 min-w-[160px]">Full Name</th>
                  <th className="p-3 min-w-[140px]">Position / Designation</th>
                  <th className="p-3 min-w-[130px]">Office / Department</th>
                  <th className="p-3 min-w-[120px]">GFPS Role</th>
                  <th className="p-3 min-w-[120px]">Cluster / Committee</th>
                  <th className="p-3 min-w-[120px]">Contact Info</th>
                  {isSuperAdmin && <th className="p-3 w-16 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-gray-800 dark:text-gray-200">
                {members.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{m.name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{m.position || '-'}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{m.office || '-'}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-200/50">
                        {m.role_in_gfps.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{m.committee || '-'}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{m.contact_number || m.email || '-'}</td>
                    {isSuperAdmin && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => deleteMutation.mutate(m.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Add GFPS Member</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Record official member details for FY {year}.</p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Hon. Maria Santos"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Position / Title</label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Municipal Mayor"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Office</label>
                  <input
                    type="text"
                    value={formData.office || ''}
                    onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                    placeholder="e.g. Mayor's Office"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Role in GFPS</label>
                  <select
                    value={formData.role_in_gfps || 'excom'}
                    onChange={(e) => setFormData({ ...formData, role_in_gfps: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="chairperson">Chairperson (LCE)</option>
                    <option value="vice_chair">Vice-Chairperson</option>
                    <option value="excom">ExCom Member</option>
                    <option value="twg">TWG Member</option>
                    <option value="secretariat">Secretariat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Committee</label>
                  <input
                    type="text"
                    value={formData.committee || ''}
                    onChange={(e) => setFormData({ ...formData, committee: e.target.value })}
                    placeholder="e.g. Executive Committee"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Contact Number / Email</label>
                <input
                  type="text"
                  value={formData.contact_number || ''}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="e.g. 0917-xxx-xxxx / email@presentacion.gov.ph"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!formData.name || createMutation.isPending}
                onClick={() => createMutation.mutate(formData)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
