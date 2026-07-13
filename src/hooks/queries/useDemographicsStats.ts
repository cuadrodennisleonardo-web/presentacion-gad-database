import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";

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

        totalPop += p.total_population || 0;
        totalHouseholds += (p.household_heads_m || 0) + (p.household_heads_f || 0);
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
