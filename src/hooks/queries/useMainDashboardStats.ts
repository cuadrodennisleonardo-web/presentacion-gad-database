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
        const pop = stat.total_population || ((stat.male_count || 0) + (stat.female_count || 0));
        const hh = extractStatField(stat, 'household_heads');
        totalPop += pop;
        totalHouseholds += stat.total_households ?? stat.household_heads_total ?? hh.total;
        totalMale += stat.male_count || 0;
        totalFemale += stat.female_count || 0;

        if (pop > 0) {
          barangayPopArray.push({
            barangay_name: barangayMap.get(stat.barangay_id) || "Unknown",
            count: pop,
          });
        }
      });

      let totalPWDs = 0;
      let total4Ps = 0;
      socStats.forEach(s => {
        totalPWDs += extractStatField(s, 'pwd').total;
        total4Ps += extractStatField(s, 'four_ps').total;
      });

      let totalFarmers = 0, totalFisherfolks = 0, totalBusiness = 0, totalAmbulantVendors = 0;
      econStats.forEach(e => {
        totalFarmers += extractStatField(e, 'farmers').total;
        totalFisherfolks += extractStatField(e, 'fisherfolks').total;
        totalBusiness += extractStatField(e, 'business_owners').total;
        totalAmbulantVendors += extractStatField(e, 'ambulant_vendors').total;
      });

      let tVawc = 0, tCicl = 0, tAssault = 0;
      justiceStats.forEach(j => {
        tVawc += j.vawc_cases_reported || 0;
        tCicl += extractStatField(j, 'cicl').total;
        tAssault += extractStatField(j, 'sexual_assault').total;
      });

      let tWater = 0, tToilet = 0, tSettlers = 0;
      infraStats.forEach(i => {
        tWater += extractStatField(i, 'safe_water').total;
        tToilet += extractStatField(i, 'sanitary_toilet').total;
        tSettlers += extractStatField(i, 'informal_settlers').total;
      });

      let tElected = 0, tAppointed = 0;
      govStats.forEach(g => {
        tElected += extractStatField(g, 'elected_officials').total;
        tAppointed += extractStatField(g, 'appointed_heads').total;
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
