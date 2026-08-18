import { supabase } from "@/config/supabase";
import type { Database } from "@/types/database";
import { BARANGAYS } from "@/lib/constants";
import { getDepartmentDefaultYear } from "@/utils/yearUtils";

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
  const targetYear = year || getDepartmentDefaultYear([
    "Demographics_main",
    "Demographics_Dashboard",
    "Demographics"
  ]);
  
  const { data: barangays, error: bError } = await supabase
    .from("barangays")
    .select("*")
    .order("name");

  if (bError || !barangays) {
    return { data: [], error: bError?.message ?? "Unknown error" };
  }

  // Filter out school and daycare entries so only official 18 barangays are displayed
  const validBarangayNames = new Set(BARANGAYS.map(b => b.toLowerCase()));
  const realBarangays = barangays.filter(brgy => {
    const d = (brgy.district || '').toLowerCase();
    if (d.startsWith('school') || d.startsWith('daycare') || d.startsWith('eccd') || d.startsWith('cdc')) {
      return false;
    }
    const lowerName = brgy.name.toLowerCase().trim();
    if (
      lowerName.includes("school") || 
      lowerName.includes("elementary") || 
      lowerName.includes("high school") ||
      lowerName.includes("development center") ||
      lowerName.includes("daycare") ||
      lowerName.includes("cdc")
    ) {
      return false;
    }
    return validBarangayNames.has(lowerName) || BARANGAYS.some(b => b.toLowerCase() === lowerName);
  });

  let { data: stats, error: sError } = await supabase
    .from("population_stats")
    .select("*")
    .eq("year", targetYear);
    
  if (sError) {
    console.error("Error fetching stats:", sError);
  }

  // Fallback: If no stats found for targetYear, query latest year available in population_stats
  if (!stats || stats.length === 0) {
    const { data: latestStats } = await supabase
      .from("population_stats")
      .select("*")
      .order("year", { ascending: false });

    if (latestStats && latestStats.length > 0) {
      const topYear = latestStats[0].year;
      stats = latestStats.filter(s => s.year === topYear);
    }
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
      household_count: s?.total_households || s?.household_heads_total || ((s?.household_heads_m || 0) + (s?.household_heads_f || 0)),
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
      household_count: stats?.total_households || stats?.household_heads_total || ((stats?.household_heads_m || 0) + (stats?.household_heads_f || 0)),
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
