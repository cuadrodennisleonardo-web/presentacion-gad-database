import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";

export function useMainDashboardStats() {
  return useQuery({
    queryKey: ['main_dashboard_stats'],
    queryFn: async () => {
      const year = new Date().getFullYear();
      
      const [
        barangays,
        popStats,
        socStats,
        econStats,
        justiceStats,
        infraStats,
        govStats
      ] = await Promise.all([
        fetchBarangays(),
        fetchStats("population_stats", year),
        fetchStats("social_dev_stats", year),
        fetchStats("econ_dev_stats", year),
        fetchStats("justice_stats", year),
        fetchStats("infra_stats", year),
        fetchStats("governance_stats", year)
      ]);

      let totalPop = 0;
      let totalHouseholds = 0;
      let totalMale = 0;
      let totalFemale = 0;

      const barangayMap = new Map(barangays.map(b => [b.id, b.name]));
      const barangayPopArray: { barangay_name: string; count: number }[] = [];

      popStats.forEach(stat => {
        totalPop += stat.total_population || 0;
        totalHouseholds += (stat.household_heads_m || 0) + (stat.household_heads_f || 0);
        totalMale += stat.male_count || 0;
        totalFemale += stat.female_count || 0;

        if (stat.total_population && stat.total_population > 0) {
          barangayPopArray.push({
            barangay_name: barangayMap.get(stat.barangay_id) || "Unknown",
            count: stat.total_population,
          });
        }
      });

      let totalPWDs = 0;
      let total4Ps = 0;
      socStats.forEach(s => {
        totalPWDs += (s.pwd_m || 0) + (s.pwd_f || 0);
        total4Ps += (s.four_ps_m || 0) + (s.four_ps_f || 0);
      });

      let totalFarmers = 0, totalFisherfolks = 0, totalBusiness = 0, totalAmbulantVendors = 0;
      econStats.forEach(e => {
        totalFarmers += (e.farmers_m || 0) + (e.farmers_f || 0);
        totalFisherfolks += (e.fisherfolks_m || 0) + (e.fisherfolks_f || 0);
        totalBusiness += (e.business_owners_m || 0) + (e.business_owners_f || 0);
        totalAmbulantVendors += (e.ambulant_vendors_m || 0) + (e.ambulant_vendors_f || 0);
      });

      let tVawc = 0, tCicl = 0, tAssault = 0;
      justiceStats.forEach(j => {
        tVawc += j.vawc_cases_reported || 0;
        tCicl += (j.cicl_m || 0) + (j.cicl_f || 0);
        tAssault += (j.sexual_assault_m || 0) + (j.sexual_assault_f || 0);
      });

      let tWater = 0, tToilet = 0, tSettlers = 0;
      infraStats.forEach(i => {
        tWater += (i.safe_water_m || 0) + (i.safe_water_f || 0);
        tToilet += (i.sanitary_toilet_m || 0) + (i.sanitary_toilet_f || 0);
        tSettlers += (i.informal_settlers_m || 0) + (i.informal_settlers_f || 0);
      });

      let tElected = 0, tAppointed = 0;
      govStats.forEach(g => {
        tElected += (g.elected_officials_m || 0) + (g.elected_officials_f || 0);
        tAppointed += (g.appointed_heads_m || 0) + (g.appointed_heads_f || 0);
      });

      const sortedBarangayPop = barangayPopArray.sort((a, b) => b.count - a.count);

      return {
        residents: totalPop,
        households: totalHouseholds,
        pwds: totalPWDs,
        fourPs: total4Ps,
        sexDist: { male: totalMale, female: totalFemale },
        barangayPop: sortedBarangayPop,
        livelihood: { farmers: totalFarmers, fisherfolks: totalFisherfolks, business: totalBusiness, ambulantVendors: totalAmbulantVendors },
        justice: { vawc: tVawc, cicl: tCicl, assault: tAssault },
        infrastructure: { safeWater: tWater, sanitaryToilet: tToilet, informalSettlers: tSettlers },
        governance: { elected: tElected, appointed: tAppointed }
      };
    }
  });
}
