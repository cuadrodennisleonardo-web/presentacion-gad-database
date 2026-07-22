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

export function useEconomicDevStats(year: number) {
  return useQuery({
    queryKey: ['econ_dev_stats', year],
    queryFn: async () => {
      const [bData, eData] = await Promise.all([
        fetchBarangays(),
        fetchStats("econ_dev_stats", year)
      ]);

      const eMap = new Map(eData.map(d => [d.barangay_id, d]));

      let tEmployed = 0, tUnemployed = 0;
      let tFarmers = 0, tFisherfolks = 0, tBusiness = 0, tAmbulantVendors = 0;

      const bNames: string[] = [];
      const bIds: string[] = [];
      const empM: number[] = [];
      const empF: number[] = [];
      const empTot: number[] = [];
      const unM: number[] = [];
      const unF: number[] = [];
      const unTot: number[] = [];
      const rFarmers: number[] = [];
      const rFisherfolks: number[] = [];
      const rBusiness: number[] = [];
      const rAmbulantVendors: number[] = [];
      let empHasTotalOnly = false;
      let unempHasTotalOnly = false;

      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        
        const e = eMap.get(b.id) || {};

        const emp = extractStatField(e, 'employed');
        const unemp = extractStatField(e, 'unemployed');
        const farm = extractStatField(e, 'farmers');
        const fish = extractStatField(e, 'fisherfolks');
        const biz = extractStatField(e, 'business_owners');
        const amb = extractStatField(e, 'ambulant_vendors');

        if (emp.isTotalOnly) empHasTotalOnly = true;
        if (unemp.isTotalOnly) unempHasTotalOnly = true;

        tEmployed += emp.total;
        tUnemployed += unemp.total;
        tFarmers += farm.total;
        tFisherfolks += fish.total;
        tBusiness += biz.total;
        tAmbulantVendors += amb.total;

        rFarmers.push(farm.total);
        rFisherfolks.push(fish.total);
        rBusiness.push(biz.total);
        rAmbulantVendors.push(amb.total);

        empM.push(emp.m);
        empF.push(emp.f);
        empTot.push(emp.total);
        unM.push(unemp.m);
        unF.push(unemp.f);
        unTot.push(unemp.total);
      });

      return {
        employed: tEmployed, unemployed: tUnemployed,
        farmers: tFarmers, fisherfolks: tFisherfolks, business: tBusiness, ambulantVendors: tAmbulantVendors,
        barangays: bNames,
        barangayIds: bIds,
        empHasTotalOnly,
        employedSeries: empHasTotalOnly 
          ? [{ name: "Total Employed", data: empTot }]
          : [{ name: "Male", data: empM }, { name: "Female", data: empF }],
        unempHasTotalOnly,
        unemployedSeries: unempHasTotalOnly
          ? [{ name: "Total Unemployed", data: unTot }]
          : [{ name: "Male", data: unM }, { name: "Female", data: unF }],
        employedM_series: empM, employedF_series: empF,
        unemployedM_series: unM, unemployedF_series: unF,
        rawFarmers: rFarmers,
        rawFisherfolks: rFisherfolks,
        rawBusiness: rBusiness,
        rawAmbulantVendors: rAmbulantVendors,
      };
    }
  });
}
