import { supabase } from "@/config/supabase";
import type { Database } from "@/types/database";
import { BARANGAYS } from "@/lib/constants";

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

  // Filter out school entries so only official barangays are displayed in the directory
  const validBarangayNames = new Set(BARANGAYS.map(b => b.toLowerCase()));
  const realBarangays = barangays.filter(brgy => {
    const lowerName = brgy.name.toLowerCase().trim();
    if (lowerName.includes("school") || lowerName.includes("elementary") || lowerName.includes("high school")) {
      return false;
    }
    return validBarangayNames.has(lowerName) || BARANGAYS.some(b => b.toLowerCase() === lowerName || lowerName.startsWith(b.toLowerCase()));
  });

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

  const enriched: BarangayWithStats[] = realBarangays.map(brgy => {
    const s = statsMap[brgy.id];
    return {
      ...brgy,
      population_count: s?.total_population || ((s?.male_count || 0) + (s?.female_count || 0)),
      household_count: s?.household_heads_total || ((s?.household_heads_m || 0) + (s?.household_heads_f || 0)),
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
      population_count: stats?.total_population || ((stats?.male_count || 0) + (stats?.female_count || 0)),
      household_count: stats?.household_heads_total || ((stats?.household_heads_m || 0) + (stats?.household_heads_f || 0)),
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

  const validBarangayNames = new Set(BARANGAYS.map(b => b.toLowerCase()));
  return (data ?? []).filter(brgy => {
    const lowerName = brgy.name.toLowerCase().trim();
    if (lowerName.includes("school") || lowerName.includes("elementary") || lowerName.includes("high school")) {
      return false;
    }
    return validBarangayNames.has(lowerName) || BARANGAYS.some(b => b.toLowerCase() === lowerName || lowerName.startsWith(b.toLowerCase()));
  });
}
