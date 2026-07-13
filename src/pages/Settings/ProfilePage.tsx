import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { ROLE_LABELS } from '../../lib/constants';

export default function ProfilePage() {
  const { user, initialize } = useAuth();
  
  const [fullName, setFullName] = useState(user?.profile?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success('Profile updated successfully!');
      await initialize(); // Refresh user context
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      toast.success('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <PageMeta title="My Profile" description="Manage your account settings" />
      <PageBreadcrumb pageTitle="My Profile" />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Info Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            Account Information
          </h3>
          
          <div className="mb-6 space-y-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
              <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">System Role</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user?.profile?.role ? ROLE_LABELS[user.profile.role as keyof typeof ROLE_LABELS] : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user?.profile?.department || 'N/A (System Wide)'}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Security Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            Change Password
          </h3>
          
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                placeholder="Confirm password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
