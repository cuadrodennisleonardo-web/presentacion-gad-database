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

        const c = extractStatField(g, 'cicl');
        const a = extractStatField(g, 'sexual_assault');

        tVawc += g.vawc_cases_reported || 0;
        tCicl += c.total;
        tAssault += a.total;

        vawc.push(g.vawc_cases_reported || 0);
        cicl.push(c.total);
        assault.push(a.total);
      });

      return {
        vawc: tVawc, cicl: tCicl, assault: tAssault,
        barangays: bNames,
        vawc_series: vawc, cicl_series: cicl, assault_series: assault,
      };
    }
  });
}
