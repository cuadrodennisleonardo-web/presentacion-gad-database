import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import { supabase } from '../../config/supabase';
import type { Database } from '../../types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

const ROLES = ['superadmin', 'senior_viewer', 'dept_admin', 'dept_viewer', 'viewer'] as const;
const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  senior_viewer: 'Senior Viewer',
  dept_admin: 'Department Admin',
  dept_viewer: 'Department Viewer',
  viewer: 'Viewer',
};
const DEPARTMENTS = ['Social Development', 'Economic Development', 'Infrastructure', 'Local Governance', 'Institutional GAD', 'Demographics & Population', 'Justice & Safety'];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (id: string, newRole: string) => {
    setUsers((prev) => 
      prev.map(u => u.id === id ? { ...u, role: newRole } : u)
    );
  };

  const handleDeptChange = (id: string, newDept: string) => {
    setUsers((prev) => 
      prev.map(u => u.id === id ? { ...u, department: newDept } : u)
    );
  };

  const handleSave = async (user: UserProfile) => {
    setUpdatingId(user.id);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          role: user.role,
          department: user.department || null
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`${user.full_name}'s permissions updated!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
      fetchUsers();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    const newStatus = !user.is_active;
    setUpdatingId(user.id);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
      toast.success(`${user.full_name} has been ${newStatus ? 'activated' : 'deactivated'}.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateUser = async (data: { email: string; password: string; full_name: string; role: string; department: string | null }) => {
    try {
      const { error } = await supabase.rpc('create_app_user', {
        p_email: data.email,
        p_password: data.password,
        p_full_name: data.full_name,
        p_role: data.role,
        p_department: data.department,
      });

      if (error) throw error;

      toast.success(`User "${data.full_name}" created successfully!`);
      setShowCreateModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  return (
    <>
      <PageMeta title="User Management" description="Manage user roles and permissions" />
      <PageBreadcrumb pageTitle="User Management" rootLabel="Administration" rootPath={null} />
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
         <div className="mb-6 flex items-center justify-between">
           <div>
             <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
               System Users
             </h3>
             <p className="text-sm text-gray-500">Manage access levels and department assignments for staff.</p>
           </div>
           <button
             onClick={() => setShowCreateModal(true)}
             className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 shadow-sm"
           >
             <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
               <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
             </svg>
             Create User
           </button>
         </div>

         {loading ? (
           <div className="py-10 text-center text-sm text-gray-500">Loading users...</div>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
               <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                 <tr>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Name</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Email</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Role</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Department</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                   <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                 {users.map((user) => (
                   <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!user.is_active ? 'opacity-50' : ''}`}>
                     <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                       {user.full_name}
                     </td>
                     <td className="whitespace-nowrap px-4 py-3">
                       {user.email}
                     </td>
                     <td className="px-4 py-3">
                       <select 
                         value={user.role} 
                         onChange={(e) => handleRoleChange(user.id, e.target.value)}
                         className="rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                       >
                         {ROLES.map(r => (
                           <option key={r} value={r} className="dark:bg-gray-900">{ROLE_LABELS[r]}</option>
                         ))}
                       </select>
                     </td>
                     <td className="px-4 py-3">
                       <select 
                         value={user.department || ''} 
                         onChange={(e) => handleDeptChange(user.id, e.target.value)}
                         className="rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                         disabled={user.role === 'superadmin' || user.role === 'senior_viewer'}
                       >
                         <option value="" className="dark:bg-gray-900">-- None --</option>
                         {DEPARTMENTS.map(d => (
                           <option key={d} value={d} className="dark:bg-gray-900">{d}</option>
                         ))}
                       </select>
                     </td>
                     <td className="px-4 py-3">
                       <button
                         onClick={() => handleToggleActive(user)}
                         disabled={updatingId === user.id}
                         className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                           user.is_active
                             ? 'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400'
                             : 'bg-error-50 text-error-700 hover:bg-error-100 dark:bg-error-900/20 dark:text-error-400'
                         }`}
                       >
                         <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-success-500' : 'bg-error-500'}`} />
                         {user.is_active ? 'Active' : 'Inactive'}
                       </button>
                     </td>
                     <td className="px-4 py-3 text-right">
                       <button
                         onClick={() => handleSave(user)}
                         disabled={updatingId === user.id}
                         className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                       >
                         {updatingId === user.id ? 'Saving...' : 'Save'}
                       </button>
                     </td>
                   </tr>
                 ))}
                 {users.length === 0 && (
                   <tr>
                     <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                       No users found.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}
    </>
  );
}

// ─── Create User Modal ──────────────────────────────────────
interface CreateUserModalProps {
  onClose: () => void;
  onSubmit: (data: { email: string; password: string; full_name: string; role: string; department: string | null }) => Promise<void>;
}

function CreateUserModal({ onClose, onSubmit }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('viewer');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const needsDepartment = role === 'dept_admin' || role === 'dept_viewer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (needsDepartment && !department) {
      toast.error('Please select a department for this role');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        email,
        password,
        full_name: fullName,
        role,
        department: needsDepartment ? department : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Create New User</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a new staff member to the system.</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="create-fullname" className={labelClass}>Full Name</label>
              <input id="create-fullname" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="e.g., Juan Dela Cruz" required />
            </div>

            <div>
              <label htmlFor="create-email" className={labelClass}>Email Address</label>
              <input id="create-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="e.g., juan@presentacion.gov.ph" required />
            </div>

            <div>
              <label htmlFor="create-password" className={labelClass}>Temporary Password</label>
              <div className="relative">
                <input
                  id="create-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + " pr-10"}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">The user should change this after their first login.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="create-role" className={labelClass}>Role</label>
                <select
                  id="create-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r} className="dark:bg-gray-900">{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="create-department" className={labelClass}>Department</label>
                <select
                  id="create-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={inputClass}
                  disabled={!needsDepartment}
                >
                  <option value="" className="dark:bg-gray-900">{needsDepartment ? '-- Select --' : 'N/A'}</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d} className="dark:bg-gray-900">{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Creating...
                  </span>
                ) : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
