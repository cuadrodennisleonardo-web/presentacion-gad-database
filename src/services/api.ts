import { supabase } from "@/config/supabase";

export async function fetchBarangays() {
  const { data, error } = await supabase.from('barangays')
    .select('*')
    .order('name');
  if (error) throw error;
  
  // Filter out schools in javascript to avoid PostgREST syntax errors with nulls
  return (data || []).filter(b => !b.district || !b.district.startsWith('School-'));
}

export async function fetchSchools() {
  const { data, error } = await supabase.from('barangays')
    .select('*')
    .order('district', { ascending: true })
    .order('name');
  if (error) throw error;
  
  const rawSchools = (data || []).filter(b => b.district && b.district.startsWith('School-'));
  
  const schools = rawSchools.map(b => {
    let district = b.district;
    if (b.name.includes('Holy Angel')) district = 'School-Primary';
    if (b.name.includes('Moises D. Fernandez')) district = 'School-Secondary';
    return { ...b, district };
  });

  return schools.sort((a, b) => {
    if (a.district !== b.district) {
      return a.district.localeCompare(b.district);
    }
    return a.name.localeCompare(b.name);
  });
}

export async function fetchBarangayOptions() {
  const { data, error } = await supabase.from('barangays')
    .select('id, name, district')
    .order('name');
  if (error) throw error;
  
  return (data || [])
    .filter(b => !b.district || !b.district.startsWith('School-'))
    .map(b => ({ id: b.id, name: b.name }));
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
