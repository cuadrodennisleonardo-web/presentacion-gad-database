import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";
import { getDepartmentDefaultYear } from "@/utils/yearUtils";
import { supabase } from "@/config/supabase";

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

function extractDynamicValue(fieldObj: any): { m: number; f: number; total: number } {
  if (!fieldObj) return { m: 0, f: 0, total: 0 };
  if (typeof fieldObj === 'number') {
    return { m: 0, f: 0, total: fieldObj };
  }
  if (typeof fieldObj === 'object') {
    if ('m' in fieldObj || 'f' in fieldObj) {
      const m = Number(fieldObj.m || 0);
      const f = Number(fieldObj.f || 0);
      const rawTot = fieldObj.total;
      const total = (rawTot !== null && rawTot !== undefined && rawTot > 0 && !m && !f) ? Number(rawTot) : (m + f);
      return { m, f, total };
    }
    if ('value' in fieldObj) {
      const v = Number(fieldObj.value || 0);
      return { m: 0, f: 0, total: isNaN(v) ? 0 : v };
    }
    if ('total' in fieldObj) {
      const t = Number(fieldObj.total || 0);
      return { m: 0, f: 0, total: isNaN(t) ? 0 : t };
    }
  }
  return { m: 0, f: 0, total: 0 };
}

async function fetchStatsWithFallback(table: string, primaryYear: number) {
  try {
    let stats = await fetchStats(table, primaryYear);
    let year = primaryYear;

    if (!stats || stats.length === 0) {
      const { data } = await supabase
        .from(table)
        .select('*')
        .order('year', { ascending: false });
      
      if (data && data.length > 0) {
        const latestYear = data[0].year;
        stats = data.filter(d => d.year === latestYear);
        year = latestYear;
      }
    }

    return { stats: stats || [], year };
  } catch {
    return { stats: [], year: primaryYear };
  }
}

export function useMainDashboardStats() {
  return useQuery({
    queryKey: ['main_dashboard_stats'],
    queryFn: async () => {
      const popDefaultYear = getDepartmentDefaultYear([
        "SocialDevelopment_Dashboard",
        "Demographics_Dashboard",
        "Social Development",
        "Demographics"
      ]);

      const [
        barangays,
        { data: dynamicSchemas = [] },
        { data: allDynamicData = [] },
        popRes,
        socRes,
        econRes,
        justiceRes,
        infraRes,
        govRes
      ] = await Promise.all([
        fetchBarangays(),
        supabase.from('dynamic_schemas').select('*'),
        supabase.from('dynamic_data').select('*').order('year', { ascending: false }),
        fetchStatsWithFallback("population_stats", popDefaultYear),
        fetchStatsWithFallback("social_dev_stats", popDefaultYear),
        fetchStatsWithFallback("econ_dev_stats", popDefaultYear),
        fetchStatsWithFallback("justice_stats", popDefaultYear),
        fetchStatsWithFallback("infra_stats", popDefaultYear),
        fetchStatsWithFallback("governance_stats", popDefaultYear)
      ]);

      // 1. POPULATION & DEMOGRAPHICS FROM NATIVE POPULATION_STATS (PRIMARY) OR DYNAMIC TABLES (FALLBACK)
      const demoSchemas = (dynamicSchemas || []).filter(s => {
        const sub = (s.subsector || '').toLowerCase();
        const tab = (s.tab_name || '').toLowerCase();
        return sub === 'demography' || tab.includes('population') || tab.includes('demograph');
      });
      const demoSchemaIds = new Set(demoSchemas.map(s => s.id));
      const demoDynamicRows = (allDynamicData || []).filter(d => demoSchemaIds.has(d.schema_id));
      const latestDemoYear = demoDynamicRows[0]?.year;
      const currentYearDemoRows = latestDemoYear ? demoDynamicRows.filter(d => d.year === latestDemoYear) : [];
      const dynamicDemoMap = new Map(currentYearDemoRows.map(d => [d.barangay_id, d.data || {}]));

      const popStatsMap = new Map(popRes.stats.map(s => [s.barangay_id, s]));

      let totalPop = 0;
      let totalHouseholds = 0;
      let totalMale = 0;
      let totalFemale = 0;
      const barangayPopMap = new Map<string, number>();

      barangays.forEach(b => {
        const p = popStatsMap.get(b.id);
        const dataObj = dynamicDemoMap.get(b.id);

        let bPop = 0;
        let bMale = 0;
        let bFemale = 0;
        let bHh = 0;

        const hasPopStats = p && (
          (p.total_population !== null && p.total_population !== undefined && p.total_population > 0) ||
          (p.male_count !== null && p.male_count !== undefined && p.male_count > 0) ||
          (p.female_count !== null && p.female_count !== undefined && p.female_count > 0) ||
          (p.total_households !== null && p.total_households !== undefined && p.total_households > 0) ||
          (p.household_heads_total !== null && p.household_heads_total !== undefined && p.household_heads_total > 0) ||
          (p.household_heads_m !== null && p.household_heads_m !== undefined && p.household_heads_m > 0) ||
          (p.household_heads_f !== null && p.household_heads_f !== undefined && p.household_heads_f > 0)
        );

        if (hasPopStats && p) {
          const hh = extractStatField(p, 'household_heads');
          bPop = p.total_population || ((p.male_count || 0) + (p.female_count || 0));
          bMale = p.male_count || 0;
          bFemale = p.female_count || 0;
          bHh = p.total_households ?? p.household_heads_total ?? (hh.total > 0 ? hh.total : ((p.household_heads_m || 0) + (p.household_heads_f || 0)));
        } else if (dataObj) {
          const popVal = extractDynamicValue(dataObj.total_pop || dataObj.population || dataObj.household_population);
          const hhVal = extractDynamicValue(dataObj.hh_heads || dataObj.households || dataObj.total_households);
          bPop = popVal.total;
          bMale = popVal.m;
          bFemale = popVal.f;
          bHh = hhVal.total;
        } else if (p) {
          const hh = extractStatField(p, 'household_heads');
          bPop = p.total_population || ((p.male_count || 0) + (p.female_count || 0));
          bMale = p.male_count || 0;
          bFemale = p.female_count || 0;
          bHh = p.total_households ?? p.household_heads_total ?? hh.total;
        }

        totalPop += bPop;
        totalMale += bMale;
        totalFemale += bFemale;
        totalHouseholds += bHh;

        if (bPop > 0) {
          barangayPopMap.set(b.name, bPop);
        }
      });

      const barangayPopArray = Array.from(barangayPopMap.entries()).map(([barangay_name, count]) => ({
        barangay_name,
        count
      })).sort((a, b) => b.count - a.count);

      // 2. PWDS & 4PS FROM DYNAMIC TABLES OR NATIVE
      let totalPWDs = 0;
      let total4Ps = 0;
      
      const socProtSchemas = (dynamicSchemas || []).filter(s => {
        const sub = (s.subsector || '').toLowerCase();
        const tab = (s.tab_name || '').toLowerCase();
        return sub === 'social-protection' || sub === 'demography' || tab.includes('pwd') || tab.includes('4ps') || tab.includes('social protection') || tab.includes('welfare');
      });
      const socProtSchemaIds = new Set(socProtSchemas.map(s => s.id));
      const socProtDynamicRows = (allDynamicData || []).filter(d => socProtSchemaIds.has(d.schema_id));

      if (socProtDynamicRows.length > 0) {
        socProtDynamicRows.forEach(row => {
          const dObj = row.data || {};
          const pwdVal = extractDynamicValue(dObj.pwd_residents || dObj.pwd_registered || dObj.pwd);
          const fourPsVal = extractDynamicValue(dObj.fourps_beneficiaries || dObj.four_ps || dObj.fourps);
          totalPWDs += pwdVal.total;
          total4Ps += fourPsVal.total;
        });
      }

      if (totalPWDs === 0 && total4Ps === 0 && socProtDynamicRows.length === 0 && socRes.stats.length > 0) {
        socRes.stats.forEach(s => {
          totalPWDs += extractStatField(s, 'pwd').total;
          total4Ps += extractStatField(s, 'four_ps').total;
        });
      }

      // 3. LIVELIHOOD & ECONOMIC
      let totalFarmers = 0, totalFisherfolks = 0, totalBusiness = 0, totalAmbulantVendors = 0;
      const econSchemas = (dynamicSchemas || []).filter(s => (s.department || '').toLowerCase().includes('economic'));
      const econSchemaIds = new Set(econSchemas.map(s => s.id));
      const econDynamicRows = (allDynamicData || []).filter(d => econSchemaIds.has(d.schema_id));

      if (econDynamicRows.length > 0) {
        econDynamicRows.forEach(row => {
          const dObj = row.data || {};
          totalFarmers += extractDynamicValue(dObj.registered_farmers || dObj.farm_workers || dObj.farmers).total;
          totalFisherfolks += extractDynamicValue(dObj.registered_fisherfolk || dObj.motorized_boat_owners || dObj.aquaculture_operators || dObj.fisherfolk || dObj.fisherfolks).total;
          totalBusiness += extractDynamicValue(dObj.micro_enterprises || dObj.msme_registered_count || dObj.msme_owners || dObj.business_owners || dObj.women_led_coops).total;
          totalAmbulantVendors += extractDynamicValue(dObj.market_stallholders || dObj.ambulant_vendors || dObj.informal_vendors).total;
        });
      }

      if (totalFarmers === 0 && totalFisherfolks === 0 && totalBusiness === 0 && econDynamicRows.length === 0 && econRes.stats.length > 0) {
        econRes.stats.forEach(e => {
          totalFarmers += extractStatField(e, 'farmers').total;
          totalFisherfolks += extractStatField(e, 'fisherfolks').total;
          totalBusiness += extractStatField(e, 'business_owners').total;
          totalAmbulantVendors += extractStatField(e, 'ambulant_vendors').total;
        });
      }

      // 4. GBV & JUSTICE
      let tVawc = 0, tCicl = 0, tAssault = 0;
      const gbvSchemas = (dynamicSchemas || []).filter(s => {
        const sub = (s.subsector || '').toLowerCase();
        const tab = (s.tab_name || '').toLowerCase();
        return sub === 'gbv' || sub === 'protection-from-violence' || tab.includes('violence') || tab.includes('vawc');
      });
      const gbvSchemaIds = new Set(gbvSchemas.map(s => s.id));
      const gbvDynamicRows = (allDynamicData || []).filter(d => gbvSchemaIds.has(d.schema_id));

      if (gbvDynamicRows.length > 0) {
        gbvDynamicRows.forEach(row => {
          const dObj = row.data || {};
          tVawc += extractDynamicValue(dObj.vawc_physical).total + 
                   extractDynamicValue(dObj.vawc_sexual).total + 
                   extractDynamicValue(dObj.vawc_psychological).total + 
                   extractDynamicValue(dObj.vawc_economic).total +
                   extractDynamicValue(dObj.bpo_issued).total;
          tCicl += extractDynamicValue(dObj.cicl_cases || dObj.cicl).total;
          tAssault += extractDynamicValue(dObj.vawc_sexual || dObj.sexual_assault || dObj.trafficking_survivors).total;
        });
      }

      if (tVawc === 0 && tCicl === 0 && gbvDynamicRows.length === 0 && justiceRes.stats.length > 0) {
        justiceRes.stats.forEach(j => {
          tVawc += j.vawc_cases_reported || 0;
          tCicl += extractStatField(j, 'cicl').total;
          tAssault += extractStatField(j, 'sexual_assault').total;
        });
      }

      // 5. INFRASTRUCTURE
      let tWater = 0, tToilet = 0, tSettlers = 0;
      const infraSchemas = (dynamicSchemas || []).filter(s => (s.department || '').toLowerCase().includes('infrastructure') || (s.subsector || '') === 'solid-waste' || (s.subsector || '') === 'shelter');
      const infraSchemaIds = new Set(infraSchemas.map(s => s.id));
      const infraDynamicRows = (allDynamicData || []).filter(d => infraSchemaIds.has(d.schema_id));

      if (infraDynamicRows.length > 0) {
        infraDynamicRows.forEach(row => {
          const dObj = row.data || {};
          tWater += extractDynamicValue(dObj.level3_water_hh || dObj.level2_water_hh || dObj.level1_water_hh || dObj.safe_drinking_water_access || dObj.safe_water).total;
          tToilet += extractDynamicValue(dObj.sanitary_toilet_hh || dObj.w2 || dObj.sanitary_toilet_access || dObj.sanitary_toilet).total;
          tSettlers += extractDynamicValue(dObj.informal_settler_hh || dObj.danger_zone_families || dObj.informal_settlers).total;
        });
      }

      if (tWater === 0 && tToilet === 0 && tSettlers === 0 && infraDynamicRows.length === 0 && infraRes.stats.length > 0) {
        infraRes.stats.forEach(i => {
          tWater += extractStatField(i, 'safe_water').total;
          tToilet += extractStatField(i, 'sanitary_toilet').total;
          tSettlers += extractStatField(i, 'informal_settlers').total;
        });
      }

      // 6. GOVERNANCE / INSTITUTIONAL
      let tElected = 0, tAppointed = 0;
      const instSchemas = (dynamicSchemas || []).filter(s => (s.department || '').toLowerCase().includes('institutional'));
      const instSchemaIds = new Set(instSchemas.map(s => s.id));
      const instDynamicRows = (allDynamicData || []).filter(d => instSchemaIds.has(d.schema_id));

      if (instDynamicRows.length > 0) {
        instDynamicRows.forEach(row => {
          const dObj = row.data || {};
          tElected += extractDynamicValue(dObj.elected_officials || dObj.sk_officials || dObj.barangay_officials).total;
          tAppointed += extractDynamicValue(dObj.lupon_members || dObj.gst_trained_officials || dObj.bdc_members || dObj.cso_reps || dObj.appointed_heads || dObj.appointed_officials).total;
        });
      }

      if (tElected === 0 && tAppointed === 0 && instDynamicRows.length === 0 && govRes.stats.length > 0) {
        govRes.stats.forEach(g => {
          tElected += extractStatField(g, 'elected_officials').total;
          tAppointed += extractStatField(g, 'appointed_heads').total;
        });
      }

      return {
        years: {
          demographics: popRes.stats.length > 0 ? popRes.year : (demoDynamicRows[0]?.year || popRes.year),
          socialDev: socProtDynamicRows[0]?.year || socRes.year,
          econDev: econDynamicRows[0]?.year || econRes.year,
          justice: gbvDynamicRows[0]?.year || justiceRes.year,
          infrastructure: infraDynamicRows[0]?.year || infraRes.year,
          governance: instDynamicRows[0]?.year || govRes.year
        },
        residents: totalPop,
        households: totalHouseholds,
        pwds: totalPWDs,
        fourPs: total4Ps,
        sexDist: { male: totalMale, female: totalFemale },
        barangayPop: barangayPopArray,
        livelihood: { farmers: totalFarmers, fisherfolks: totalFisherfolks, business: totalBusiness, ambulantVendors: totalAmbulantVendors },
        justice: { vawc: tVawc, cicl: tCicl, assault: tAssault },
        infrastructure: { safeWater: tWater, sanitaryToilet: tToilet, informalSettlers: tSettlers },
        governance: { elected: tElected, appointed: tAppointed }
      };
    }
  });
}
