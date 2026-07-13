import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";

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
      const unM: number[] = [];
      const unF: number[] = [];
      const rFarmers: number[] = [];
      const rFisherfolks: number[] = [];
      const rBusiness: number[] = [];
      const rAmbulantVendors: number[] = [];

      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        
        const e = eMap.get(b.id) || {};

        tEmployed += (e.employed_m || 0) + (e.employed_f || 0);
        tUnemployed += (e.unemployed_m || 0) + (e.unemployed_f || 0);
        tFarmers += (e.farmers_m || 0) + (e.farmers_f || 0);
        tFisherfolks += (e.fisherfolks_m || 0) + (e.fisherfolks_f || 0);
        tBusiness += (e.business_owners_m || 0) + (e.business_owners_f || 0);
        tAmbulantVendors += (e.ambulant_vendors_m || 0) + (e.ambulant_vendors_f || 0);

        rFarmers.push((e.farmers_m || 0) + (e.farmers_f || 0));
        rFisherfolks.push((e.fisherfolks_m || 0) + (e.fisherfolks_f || 0));
        rBusiness.push((e.business_owners_m || 0) + (e.business_owners_f || 0));
        rAmbulantVendors.push((e.ambulant_vendors_m || 0) + (e.ambulant_vendors_f || 0));

        empM.push(e.employed_m || 0);
        empF.push(e.employed_f || 0);
        unM.push(e.unemployed_m || 0);
        unF.push(e.unemployed_f || 0);
      });

      return {
        employed: tEmployed, unemployed: tUnemployed,
        farmers: tFarmers, fisherfolks: tFisherfolks, business: tBusiness, ambulantVendors: tAmbulantVendors,
        barangays: bNames,
        barangayIds: bIds,
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
