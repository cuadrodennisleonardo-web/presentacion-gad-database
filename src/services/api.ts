import { supabase } from "@/config/supabase";

export async function fetchBarangays() {
  const { data, error } = await supabase.from('barangays').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchBarangayOptions() {
  const { data, error } = await supabase.from('barangays').select('id, name').order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchStats(table: string, year: number) {
  const { data, error } = await supabase.from(table).select('*').eq('year', year);
  if (error) throw error;
  return data || [];
}

export async function fetchStatsMaybeSingle(table: string, year: number) {
  const { data, error } = await supabase.from(table).select('*').eq('year', year).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertStats(table: string, upsertData: any[]) {
  const { error } = await supabase.from(table).upsert(upsertData, { onConflict: 'barangay_id,year' });
  if (error) throw error;
  return true;
}

export async function fetchApprovalChanges(resubmitId: string) {
  const { data, error } = await supabase.from('data_approvals').select('changes').eq('id', resubmitId).single();
  if (error) throw error;
  return data?.changes;
}

export async function fetchDynamicSchemas(department: string) {
  const { data, error } = await supabase.from('dynamic_schemas').select('*').eq('department', department);
  if (error) throw error;
  return data || [];
}
