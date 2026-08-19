import { supabase } from "@/config/supabase";
import { INITIAL_DAYCARE_CENTERS } from "@/config/daycareCenters";

export function toAgeUuid(age: number): string {
  const hex = Math.min(Math.max(0, age), 9999).toString(16).padStart(12, '0');
  return `a9e00000-0000-4000-8000-${hex}`;
}

export function toBracketUuid(bracketId: string): string {
  let hash = 0;
  for (let i = 0; i < bracketId.length; i++) {
    hash = ((hash << 5) - hash) + bracketId.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `a9e00000-b8ac-4000-8000-${hex.slice(-12)}`;
}

export function getSingleYearAgeEntities() {
  const list = [];
  // Age 0 (Infants)
  list.push({
    id: toAgeUuid(0),
    name: 'Age 0 (<1 Year)',
    age: 0,
    bracket: 'Infants (<1y)',
    bracketKey: 'infants',
    district: 'Age-SingleYear'
  });

  // Age 1 to 99
  for (let i = 1; i <= 99; i++) {
    let bracket = 'Working-Age (25–59y)';
    let bracketKey = 'working_age';

    if (i <= 4) {
      bracket = 'Toddlers (1–4y)';
      bracketKey = 'toddlers';
    } else if (i <= 14) {
      bracket = 'Children (5–14y)';
      bracketKey = 'children';
    } else if (i <= 24) {
      bracket = 'Youth (15–24y)';
      bracketKey = 'youth';
    } else if (i >= 60) {
      bracket = 'Senior Citizens (60–99y)';
      bracketKey = 'seniors';
    }

    list.push({
      id: toAgeUuid(i),
      name: `Age ${i}`,
      age: i,
      bracket,
      bracketKey,
      district: 'Age-SingleYear'
    });
  }

  // Age 100+ (Centenarians)
  list.push({
    id: toAgeUuid(100),
    name: 'Age 100+ (Centenarians)',
    age: 100,
    bracket: 'Centenarians (100+y)',
    bracketKey: 'centenarians',
    district: 'Age-SingleYear'
  });

  return list;
}

export function getAgeBracketEntities() {
  return [
    { id: toBracketUuid('bracket_0_4'), name: '0–4 years (Infants & Toddlers)', range: [0, 4], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_5_9'), name: '5–9 years (Primary School Age)', range: [5, 9], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_10_14'), name: '10–14 years (Junior High Age)', range: [10, 14], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_15_19'), name: '15–19 years (Senior High / Youth)', range: [15, 19], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_20_24'), name: '20–24 years (College / Young Adults)', range: [20, 24], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_25_29'), name: '25–29 years', range: [25, 29], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_30_34'), name: '30–34 years', range: [30, 34], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_35_39'), name: '35–39 years', range: [35, 39], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_40_44'), name: '40–44 years', range: [40, 44], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_45_49'), name: '45–49 years', range: [45, 49], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_50_54'), name: '50–54 years', range: [50, 54], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_55_59'), name: '55–59 years', range: [55, 59], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_60_64'), name: '60–64 years (Young Seniors)', range: [60, 64], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_65_69'), name: '65–69 years', range: [65, 69], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_70_74'), name: '70–74 years', range: [70, 74], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_75_79'), name: '75–79 years', range: [75, 79], district: 'Age-Bracket' },
    { id: toBracketUuid('bracket_80_plus'), name: '80+ years (Oldest Old & Centenarians)', range: [80, 120], district: 'Age-Bracket' }
  ];
}

export async function fetchBarangays() {
  const { data, error } = await supabase.from('barangays')
    .select('*')
    .order('name');
  if (error) throw error;
  
  // Return only the genuine 18 local government barangays (filter out schools, daycare, age rows)
  return (data || []).filter(b => {
    const d = (b.district || '').toLowerCase();
    if (d.startsWith('school') || d.startsWith('daycare') || d.startsWith('eccd') || d.startsWith('cdc') || d.startsWith('age')) {
      return false;
    }
    const lower = b.name.toLowerCase().trim();
    if (
      lower.includes('development center') || 
      lower.includes('daycare') || 
      lower.includes('elementary school') || 
      lower.includes('high school') ||
      lower.includes('national high') ||
      lower.startsWith('age ') ||
      lower.startsWith('age_')
    ) {
      return false;
    }
    return true;
  });
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
    .filter(b => {
      const d = (b.district || '').toLowerCase();
      if (d.startsWith('school') || d.startsWith('daycare') || d.startsWith('eccd') || d.startsWith('cdc')) {
        return false;
      }
      const lower = b.name.toLowerCase().trim();
      if (
        lower.includes('development center') || 
        lower.includes('daycare') || 
        lower.includes('elementary school') || 
        lower.includes('high school') ||
        lower.includes('national high')
      ) {
        return false;
      }
      return true;
    })
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
