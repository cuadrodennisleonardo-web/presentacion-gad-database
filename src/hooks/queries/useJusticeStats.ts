import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";

export function useJusticeStats(year: number) {
  return useQuery({
    queryKey: ['justice_stats', year],
    queryFn: async () => {
      const [bData, gData] = await Promise.all([
        fetchBarangays(),
        fetchStats("justice_stats", year)
      ]);

      const gMap = new Map(gData.map(d => [d.barangay_id, d]));

      let tVawc = 0, tCicl = 0, tAssault = 0;

      const bNames: string[] = [];
      const vawc: number[] = [];
      const cicl: number[] = [];
      const assault: number[] = [];

      bData.forEach(b => {
        bNames.push(b.name);
        
        const g = gMap.get(b.id) || {};

        tVawc += g.vawc_cases_reported || 0;
        tCicl += (g.cicl_m || 0) + (g.cicl_f || 0);
        tAssault += (g.sexual_assault_m || 0) + (g.sexual_assault_f || 0);

        vawc.push(g.vawc_cases_reported || 0);
        cicl.push((g.cicl_m || 0) + (g.cicl_f || 0));
        assault.push((g.sexual_assault_m || 0) + (g.sexual_assault_f || 0));
      });

      return {
        vawc: tVawc, cicl: tCicl, assault: tAssault,
        barangays: bNames,
        vawc_series: vawc, cicl_series: cicl, assault_series: assault,
      };
    }
  });
}
