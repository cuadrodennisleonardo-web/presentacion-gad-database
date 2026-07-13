import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";

export function useInfrastructureStats(year: number) {
  return useQuery({
    queryKey: ['infra_stats', year],
    queryFn: async () => {
      const [bData, iData] = await Promise.all([
        fetchBarangays(),
        fetchStats("infra_stats", year)
      ]);

      const iMap = new Map(iData.map(d => [d.barangay_id, d]));

      let tWater = 0, tToilet = 0, tInformal = 0;

      const bNames: string[] = [];
      const wM: number[] = [], wF: number[] = [];
      const tM: number[] = [], tF: number[] = [];
      const inM: number[] = [], inF: number[] = [];

      bData.forEach(b => {
        bNames.push(b.name);
        
        const i = iMap.get(b.id) || {};

        tWater += (i.safe_water_m || 0) + (i.safe_water_f || 0);
        tToilet += (i.sanitary_toilet_m || 0) + (i.sanitary_toilet_f || 0);
        tInformal += (i.informal_settlers_m || 0) + (i.informal_settlers_f || 0);

        wM.push(i.safe_water_m || 0);
        wF.push(i.safe_water_f || 0);
        tM.push(i.sanitary_toilet_m || 0);
        tF.push(i.sanitary_toilet_f || 0);
        inM.push(i.informal_settlers_m || 0);
        inF.push(i.informal_settlers_f || 0);
      });

      return {
        safeWater: tWater, sanitaryToilet: tToilet, informalSettlers: tInformal,
        barangays: bNames,
        waterM_series: wM, waterF_series: wF,
        toiletM_series: tM, toiletF_series: tF,
        informalM_series: inM, informalF_series: inF
      };
    }
  });
}
