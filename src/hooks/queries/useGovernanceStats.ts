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

export function useGovernanceStats(year: number) {
  return useQuery({
    queryKey: ['governance_stats', year],
    queryFn: async () => {
      const [bData, gData] = await Promise.all([
        fetchBarangays(),
        fetchStats("governance_stats", year)
      ]);

      const gMap = new Map(gData.map(d => [d.barangay_id, d]));

      let tElectedM = 0, tElectedF = 0, tElectedTot = 0;
      let tAppointedM = 0, tAppointedF = 0, tAppointedTot = 0;

      const bNames: string[] = [];
      const bIds: string[] = [];
      const rElectedM: number[] = [];
      const rElectedF: number[] = [];
      const rElectedTot: number[] = [];
      const rAppointedM: number[] = [];
      const rAppointedF: number[] = [];
      const rAppointedTot: number[] = [];

      let electedHasTotalOnly = false;

      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        
        const g = gMap.get(b.id) || {};

        const el = extractStatField(g, 'elected_officials');
        const ap = extractStatField(g, 'appointed_heads');

        if (el.isTotalOnly) electedHasTotalOnly = true;

        tElectedM += el.m;
        tElectedF += el.f;
        tElectedTot += el.total;

        tAppointedM += ap.m;
        tAppointedF += ap.f;
        tAppointedTot += ap.total;

        rElectedM.push(el.m);
        rElectedF.push(el.f);
        rElectedTot.push(el.total);

        rAppointedM.push(ap.m);
        rAppointedF.push(ap.f);
        rAppointedTot.push(ap.total);
      });

      return {
        elected: tElectedTot,
        appointedTotal: tAppointedTot,
        barangays: bNames,
        barangayIds: bIds,
        electedM: tElectedM, electedF: tElectedF,
        appointedM: tAppointedM, appointedF: tAppointedF,
        rawElectedM: rElectedM, rawElectedF: rElectedF, rawElectedTot: rElectedTot,
        rawAppointedM: rAppointedM, rawAppointedF: rAppointedF, rawAppointedTot: rAppointedTot,
        electedHasTotalOnly,
        electedSeries: electedHasTotalOnly 
          ? [{ name: "Total Elected Officials", data: rElectedTot }] 
          : [{ name: "Male Officials", data: rElectedM }, { name: "Female Officials", data: rElectedF }]
      };
    }
  });
}
