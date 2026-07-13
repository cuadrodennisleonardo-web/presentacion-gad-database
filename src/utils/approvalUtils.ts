import { supabase } from '@/config/supabase';

export async function submitForApproval(
  moduleName: string,
  tabName: string,
  year: number,
  changes: Record<string, any>,
  userId: string
) {
  if (Object.keys(changes).length === 0) {
    throw new Error("No changes detected.");
  }

  // Insert data_approvals row
  const { data: approval, error } = await supabase.from('data_approvals').insert({
    module: moduleName,
    tab: tabName,
    year,
    changes,
    submitted_by: userId,
    status: 'pending'
  }).select('id').single();

  if (error) throw error;
  
  // Create notifications for all superadmins
  const { data: admins } = await supabase.from('user_profiles').select('id').eq('role', 'superadmin');
  
  if (admins && admins.length > 0) {
    const notifications = admins.map(a => ({
      user_id: a.id,
      title: 'New Data Approval Request',
      message: `New data submitted for ${moduleName} (${tabName}) requires your approval.`,
      type: 'approval_request',
      reference_id: approval.id
    }));
    const { error: notifError } = await supabase.from('notifications').insert(notifications);
    if (notifError) {
      console.error("Failed to insert approval request notifications:", notifError);
    }
  }
}

/**
 * Notify all OTHER superadmins when a superadmin directly saves data.
 * This ensures the bell icon shows updates for all superadmins.
 */
export async function notifySuperAdminsOfDirectSave(
  moduleName: string,
  tabName: string,
  year: number,
  currentUserId: string
) {
  try {
    // Get current user's name for the notification message
    const { data: currentUser } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', currentUserId)
      .single();

    const userName = currentUser?.full_name || 'A superadmin';

    // Get all OTHER superadmins (exclude the one making the change)
    const { data: admins } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'superadmin')
      .neq('id', currentUserId);

    if (admins && admins.length > 0) {
      const notifications = admins.map(a => ({
        user_id: a.id,
        title: 'Data Updated Directly',
        message: `${userName} directly saved data for ${moduleName} (${tabName}, ${year}).`,
        type: 'direct_save',
      }));
      await supabase.from('notifications').insert(notifications);
    }
  } catch (err) {
    // Non-critical — don't break the save flow if notifications fail
    console.warn('Failed to send direct-save notifications:', err);
  }
}

export async function checkPendingApproval(moduleName: string, tabName: string, year: number): Promise<boolean> {
  const { count, error } = await supabase
    .from('data_approvals')
    .select('*', { count: 'exact', head: true })
    .eq('module', moduleName)
    .eq('tab', tabName)
    .eq('year', year)
    .eq('status', 'pending');
    
  if (error) {
    console.error("Error checking pending approvals:", error);
    return false;
  }
  
  return count ? count > 0 : false;
}

export async function getLatestApproval(moduleName: string, tabName: string, year: number) {
  const { data, error } = await supabase
    .from('data_approvals')
    .select('*')
    .eq('module', moduleName)
    .eq('tab', tabName)
    .eq('year', year)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (error) {
    console.error("Error getting latest approval:", error);
    return null;
  }
  
  return data;
}
