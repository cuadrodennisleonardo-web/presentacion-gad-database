import { supabase } from "@/config/supabase";
import type { Database } from "@/types/database";

type Barangay = Database['public']['Tables']['barangays']['Row'];
type PopStat = Database['public']['Tables']['population_stats']['Row'];

export interface BarangayWithStats extends Barangay {
  population_count: number;
  household_count: number;
}

export async function getBarangays(year?: number): Promise<{
  data: BarangayWithStats[];
  error: string | null;
}> {
  const currentYear = year || new Date().getFullYear();
  
  const { data: barangays, error: bError } = await supabase
    .from("barangays")
    .select("*")
    .order("name");

  if (bError || !barangays) {
    return { data: [], error: bError?.message ?? "Unknown error" };
  }

  const { data: stats, error: sError } = await supabase
    .from("population_stats")
    .select("*")
    .eq("year", currentYear);
    
  if (sError) {
    console.error("Error fetching stats:", sError);
  }
  
  const statsMap: Record<string, PopStat> = {};
  stats?.forEach(s => {
    statsMap[s.barangay_id] = s;
  });

  const enriched: BarangayWithStats[] = barangays.map(brgy => {
    const s = statsMap[brgy.id];
    return {
      ...brgy,
      population_count: s?.total_population || 0,
      household_count: (s?.household_heads_m || 0) + (s?.household_heads_f || 0),
    };
  });

  return { data: enriched, error: null };
}

export async function getBarangayById(id: string, year?: number): Promise<{ data: BarangayWithStats | null; error: string | null }> {
  const currentYear = year || new Date().getFullYear();
  const { data: brgy, error } = await supabase
    .from("barangays")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !brgy) {
    return { data: null, error: error?.message ?? "Not found" };
  }

  const { data: stats } = await supabase
    .from("population_stats")
    .select("*")
    .eq("barangay_id", brgy.id)
    .eq("year", currentYear)
    .single();

  return {
    data: {
      ...brgy,
      population_count: stats?.total_population || 0,
      household_count: (stats?.household_heads_m || 0) + (stats?.household_heads_f || 0),
    },
    error: null,
  };
}

export async function getBarangayOptions(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("barangays")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching barangay options:", error);
    return [];
  }
  return data ?? [];
}
