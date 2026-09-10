import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";
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

export function useDemographicsStats(year: number) {
  return useQuery({
    queryKey: ['demographics_stats', year],
    queryFn: async () => {
      const [bData, popData, { data: dynamicSchemas = [] }] = await Promise.all([
        fetchBarangays(),
        fetchStats("population_stats", year),
        supabase.from('dynamic_schemas').select('*').in('department', ['Social Development', 'Demographics'])
      ]);

      const demoSchemas = (dynamicSchemas || []).filter(s => {
        const sub = (s.subsector || '').toLowerCase();
        const tab = (s.tab_name || '').toLowerCase();
        return sub === 'demography' || tab.includes('population') || tab.includes('demograph');
      });
      const demoSchemaIds = demoSchemas.map(s => s.id);

      let dynamicRows: any[] = [];
      if (demoSchemaIds.length > 0) {
        const { data: dData } = await supabase
          .from('dynamic_data')
          .select('*')
          .eq('year', year)
          .in('schema_id', demoSchemaIds);
        dynamicRows = dData || [];
      }

      const dynamicMap = new Map(dynamicRows.map(d => [d.barangay_id, d.data || {}]));
      const popMap = new Map(popData.map(d => [d.barangay_id, d]));

      let totalPop = 0;
      let totalHouseholds = 0;
      let totalMale = 0;
      let totalFemale = 0;

      const bNames: string[] = [];
      const bIds: string[] = [];
      const barangayPopArray: { barangay_name: string; count: number }[] = [];

      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        
        const dynObj = dynamicMap.get(b.id);
        const p = popMap.get(b.id);
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
        } else if (dynObj) {
          const popVal = extractDynamicValue(dynObj.total_pop || dynObj.population || dynObj.household_population);
          const hhVal = extractDynamicValue(dynObj.hh_heads || dynObj.households || dynObj.total_households);
          
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
          barangayPopArray.push({
            barangay_name: b.name,
            count: bPop,
          });
        }
      });
      
      const sortedBarangayPop = barangayPopArray.sort((a, b) => b.count - a.count);

      return {
        residents: totalPop,
        households: totalHouseholds,
        sexDist: { male: totalMale, female: totalFemale },
        barangayPop: sortedBarangayPop,
        
        barangays: bNames,
        barangayIds: bIds,
      };
    }
  });
}
