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
      const wM: number[] = [], wF: number[] = [], wTot: number[] = [];
      const tM: number[] = [], tF: number[] = [], tTot: number[] = [];
      const inM: number[] = [], inF: number[] = [], inTot: number[] = [];
      let waterHasTotalOnly = false;
      let toiletHasTotalOnly = false;
      let informalHasTotalOnly = false;

      bData.forEach(b => {
        bNames.push(b.name);
        
        const i = iMap.get(b.id) || {};

        const water = extractStatField(i, 'safe_water');
        const toilet = extractStatField(i, 'sanitary_toilet');
        const inf = extractStatField(i, 'informal_settlers');

        if (water.isTotalOnly) waterHasTotalOnly = true;
        if (toilet.isTotalOnly) toiletHasTotalOnly = true;
        if (inf.isTotalOnly) informalHasTotalOnly = true;

        tWater += water.total;
        tToilet += toilet.total;
        tInformal += inf.total;

        wM.push(water.m);
        wF.push(water.f);
        wTot.push(water.total);

        tM.push(toilet.m);
        tF.push(toilet.f);
        tTot.push(toilet.total);

        inM.push(inf.m);
        inF.push(inf.f);
        inTot.push(inf.total);
      });

      return {
        safeWater: tWater, sanitaryToilet: tToilet, informalSettlers: tInformal,
        barangays: bNames,
        waterHasTotalOnly,
        waterSeries: waterHasTotalOnly 
          ? [{ name: "Total Safe Water", data: wTot }] 
          : [{ name: "Male Headed", data: wM }, { name: "Female Headed", data: wF }],
        toiletHasTotalOnly,
        toiletSeries: toiletHasTotalOnly 
          ? [{ name: "Total Sanitary Toilet", data: tTot }] 
          : [{ name: "Male Headed", data: tM }, { name: "Female Headed", data: tF }],
        informalHasTotalOnly,
        informalSeries: informalHasTotalOnly
          ? [{ name: "Total Informal Settlers", data: inTot }]
          : [{ name: "Male-Led HH", data: inM }, { name: "Female-Led HH", data: inF }],
        waterM_series: wM, waterF_series: wF,
        toiletM_series: tM, toiletF_series: tF,
        informalM_series: inM, informalF_series: inF
      };
    }
  });
}
