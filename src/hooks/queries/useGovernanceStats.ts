import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";

export function useGovernanceStats(year: number) {
  return useQuery({
    queryKey: ['governance_stats', year],
    queryFn: async () => {
      const [bData, gData] = await Promise.all([
        fetchBarangays(),
        fetchStats("governance_stats", year)
      ]);

      const gMap = new Map(gData.map(d => [d.barangay_id, d]));

      let tElectedM = 0, tElectedF = 0;
      let tAppointedM = 0, tAppointedF = 0;

      const bNames: string[] = [];
      const bIds: string[] = [];
      const rElectedM: number[] = [];
      const rElectedF: number[] = [];
      const rAppointedM: number[] = [];
      const rAppointedF: number[] = [];

      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        
        const g = gMap.get(b.id) || {};

        tElectedM += g.elected_officials_m || 0;
        tElectedF += g.elected_officials_f || 0;
        tAppointedM += g.appointed_heads_m || 0;
        tAppointedF += g.appointed_heads_f || 0;

        rElectedM.push(g.elected_officials_m || 0);
        rElectedF.push(g.elected_officials_f || 0);
        rAppointedM.push(g.appointed_heads_m || 0);
        rAppointedF.push(g.appointed_heads_f || 0);
      });

      return {
        elected: tElectedM + tElectedF,
        barangays: bNames,
        barangayIds: bIds,
        electedM: tElectedM, electedF: tElectedF,
        appointedM: tAppointedM, appointedF: tAppointedF,
        rawElectedM: rElectedM, rawElectedF: rElectedF,
        rawAppointedM: rAppointedM, rawAppointedF: rAppointedF,
      };
    }
  });
}
