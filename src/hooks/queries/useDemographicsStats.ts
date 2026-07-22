import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";

function extractStatField(st: any, prefix: string) {
  const m = Number(st?.[`${prefix}_m`] || 0);
  const f = Number(st?.[`${prefix}_f`] || 0);
  const rawTotal = st?.[`${prefix}_total`];
  
  const isTotalOnly = rawTotal !== null && rawTotal !== undefined && rawTotal > 0 && !st?.[`${prefix}_m`] && !st?.[`${prefix}_f`];
  
  let total = m + f;
  if (isTotalOnly || (rawTotal !== null && rawTotal !== undefined && rawTotal > 0 && (m + f) === 0)) {
    total = Number(rawTotal);
  }
  return { m, f, total, isTotalOnly };
}

export function useDemographicsStats(year: number) {
  return useQuery({
    queryKey: ['demographics_stats', year],
    queryFn: async () => {
      const [bData, popData] = await Promise.all([
        fetchBarangays(),
        fetchStats("population_stats", year)
      ]);

      const popMap = new Map(popData.map(d => [d.barangay_id, d]));

      let totalPop = 0;
      let totalHouseholds = 0;
      let totalMale = 0;
      let totalFemale = 0;

      const bNames: string[] = [];
      const bIds: string[] = [];
      
      const barangayPopArray: { barangay_name: string; count: number }[] = [];

      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        
        const p = popMap.get(b.id) || {};
        const hh = extractStatField(p, 'household_heads');

        totalPop += p.total_population || 0;
        totalHouseholds += hh.total;
        totalMale += p.male_count || 0;
        totalFemale += p.female_count || 0;
        
        if (p.total_population && p.total_population > 0) {
          barangayPopArray.push({
            barangay_name: b.name,
            count: p.total_population,
          });
        }
      });
      
      const sortedBarangayPop = barangayPopArray.sort((a, b) => b.count - a.count);

      return {
        residents: totalPop,
        households: totalHouseholds,
        sexDist: { male: totalMale, female: totalFemale },
        barangayPop: sortedBarangayPop,
        
        barangays: bNames,
        barangayIds: bIds,
      };
    }
  });
}
