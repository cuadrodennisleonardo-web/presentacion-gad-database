import { supabase } from "@/config/supabase";
import { INITIAL_DAYCARE_CENTERS } from "@/config/daycareCenters";

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
    const isPrivate = Boolean(
      b.is_private || 
      b.district === 'School-Private' || 
      b.name.includes('Holy Angel') || 
      b.name.includes('Moises D. Fernandez')
    );
    return { ...b, district, isPrivate };
  });

  return schools.sort((a, b) => {
    if (a.district !== b.district) {
      return a.district.localeCompare(b.district);
    }
    return a.name.localeCompare(b.name);
  });
}

export async function fetchDaycareCenters() {
  try {
    const { data, error } = await supabase.from('barangays')
      .select('*')
      .order('name');
    
    if (!error && data) {
      const dbCenters = data.filter(b => b.district && (b.district.startsWith('Daycare') || b.district.startsWith('ECCD') || b.district.startsWith('CDC')));
      if (dbCenters.length > 0) {
        return dbCenters.map(c => ({
          id: c.id,
          name: c.name,
          barangay: c.barangay,
          district: c.district || 'Daycare'
        }));
      }
    }
  } catch (err) {
    console.error("Error fetching daycare centers from database:", err);
  }

  return INITIAL_DAYCARE_CENTERS;
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
  const depts = (department === 'Demographics' || department === 'Demographics & Population')
    ? ['Demographics', 'Demographics & Population']
    : [department];
  const { data, error } = await supabase.from('dynamic_schemas').select('*').in('department', depts);
  if (error) throw error;
  return data || [];
}
