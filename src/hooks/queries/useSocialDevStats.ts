import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchSchools, fetchStats, fetchDynamicSchemas } from "@/services/api";
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

export function useSocialDevStats(year: number) {
  return useQuery({
    queryKey: ['social_dev_stats', year],
    queryFn: async () => {
      const [bData, sData, socData, dynamicSchemas] = await Promise.all([
        fetchBarangays(),
        fetchSchools(),
        fetchStats("social_dev_stats", year),
        fetchDynamicSchemas("Social Development")
      ]);

      const socSchemaIds = (dynamicSchemas || []).map(s => s.id);

      let allDynamicRows: any[] = [];
      if (socSchemaIds.length > 0) {
        const { data: dData } = await supabase
          .from('dynamic_data')
          .select('*')
          .eq('year', year)
          .in('schema_id', socSchemaIds);
        allDynamicRows = dData || [];
      }

      // Group dynamic data by barangay_id / school_id
      const dynamicEntityMap = new Map<string, Record<string, any>>();
      allDynamicRows.forEach(row => {
        const entityId = row.barangay_id;
        if (!entityId || !row.data) return;
        const current = dynamicEntityMap.get(entityId) || {};
        dynamicEntityMap.set(entityId, { ...current, ...row.data });
      });

      const socMap = new Map(socData.map(d => [d.barangay_id, d]));

      // Education Schemas & Rows
      const eduSchemas = (dynamicSchemas || []).filter(s => {
        const sub = (s.subsector || '').toLowerCase();
        const tab = (s.tab_name || '').toLowerCase();
        return sub === 'education' || tab.includes('education') || tab.includes('enrollment') || tab.includes('school');
      });
      const eduSchemaIds = new Set(eduSchemas.map(s => s.id));
      const eduDynamicRows = allDynamicRows.filter(r => eduSchemaIds.has(r.schema_id));

      let tEnrolledM = 0, tEnrolledF = 0, tEnrolledTotal = 0;
      let tDropOuts = 0, tOsy = 0;

      const schoolNames: string[] = [];
      const primarySchools: string[] = [];
      const primaryEM: number[] = [];
      const primaryEF: number[] = [];
      const primaryETot: number[] = [];
      let primaryHasTotalOnly = false;

      const secondarySchools: string[] = [];
      const secondaryEM: number[] = [];
      const secondaryEF: number[] = [];
      const secondaryETot: number[] = [];
      let secondaryHasTotalOnly = false;

      const eM: number[] = [];
      const eF: number[] = [];
      const eTot: number[] = [];
      let enrolledHasTotalOnly = false;

      if (eduDynamicRows.length > 0) {
        // Aggregate overall totals from dynamic data
        eduDynamicRows.forEach(row => {
          const d = row.data || {};
          const elem = extractDynamicValue(d.elem_enrollment || d.elementary || d.primary_enrollment);
          const jhs = extractDynamicValue(d.jhs_enrollment || d.junior_high);
          const shs = extractDynamicValue(d.shs_enrollment || d.senior_high || d.secondary_enrollment);
          const gen = extractDynamicValue(d.student_enrollment || d.enrollment || d.total_enrolled);
          const osy = extractDynamicValue(d.osy_count || d.osy || d.out_of_school_youth);
          const drp = extractDynamicValue(d.drop_out || d.drop_outs);

          const rowM = (elem.m + jhs.m + shs.m) || gen.m;
          const rowF = (elem.f + jhs.f + shs.f) || gen.f;
          const rowTot = (elem.total + jhs.total + shs.total) || gen.total || (rowM + rowF);

          tEnrolledM += rowM;
          tEnrolledF += rowF;
          tEnrolledTotal += rowTot;
          tOsy += osy.total || (osy.m + osy.f);
          tDropOuts += drp.total || (drp.m + drp.f);
        });

        // Determine if keyed by school or by barangay
        const isSchoolKeyed = eduDynamicRows.some(r => sData.some(s => s.id === r.barangay_id));

        if (isSchoolKeyed) {
          sData.forEach(s => {
            const isPrivate = s.name.includes('Holy Angel') || s.name.includes('Moises D. Fernandez') || s.district === 'School-Private';
            const displayName = isPrivate ? `${s.name} (Private)` : s.name;
            schoolNames.push(displayName);

            const row = eduDynamicRows.find(r => r.barangay_id === s.id);
            const d = row?.data || {};

            const elem = extractDynamicValue(d.elem_enrollment || d.elementary || d.student_enrollment || d.enrollment);
            const jhs = extractDynamicValue(d.jhs_enrollment || d.junior_high);
            const shs = extractDynamicValue(d.shs_enrollment || d.senior_high || d.secondary_enrollment);

            if (s.district === 'School-Secondary') {
              secondarySchools.push(displayName);
              const secM = (jhs.m + shs.m) || elem.m;
              const secF = (jhs.f + shs.f) || elem.f;
              const secTot = (jhs.total + shs.total) || elem.total || (secM + secF);
              if (secM === 0 && secF === 0 && secTot > 0) secondaryHasTotalOnly = true;
              secondaryEM.push(secM);
              secondaryEF.push(secF);
              secondaryETot.push(secTot);
            } else {
              primarySchools.push(displayName);
              if (elem.m === 0 && elem.f === 0 && elem.total > 0) primaryHasTotalOnly = true;
              primaryEM.push(elem.m);
              primaryEF.push(elem.f);
              primaryETot.push(elem.total);
            }
          });
        } else {
          // Keyed by Barangay
          bData.forEach(b => {
            const displayName = b.name;
            schoolNames.push(displayName);

            const row = eduDynamicRows.find(r => r.barangay_id === b.id);
            const d = row?.data || {};

            const elem = extractDynamicValue(d.elem_enrollment || d.elementary || d.primary_enrollment || d.student_enrollment || d.enrollment);
            const jhs = extractDynamicValue(d.jhs_enrollment || d.junior_high);
            const shs = extractDynamicValue(d.shs_enrollment || d.senior_high || d.secondary_enrollment);

            primarySchools.push(displayName);
            if (elem.m === 0 && elem.f === 0 && elem.total > 0) primaryHasTotalOnly = true;
            primaryEM.push(elem.m);
            primaryEF.push(elem.f);
            primaryETot.push(elem.total);

            secondarySchools.push(displayName);
            const secM = jhs.m + shs.m;
            const secF = jhs.f + shs.f;
            const secTot = (jhs.total + shs.total) || (secM + secF);
            if (secM === 0 && secF === 0 && secTot > 0) secondaryHasTotalOnly = true;
            secondaryEM.push(secM);
            secondaryEF.push(secF);
            secondaryETot.push(secTot);
          });
        }
      } else if (socData.length > 0) {
        // Fallback to native social_dev_stats if no dynamic data exists for education
        sData.forEach(s => {
          const isPrivate = s.name.includes('Holy Angel') || s.name.includes('Moises D. Fernandez') || s.district === 'School-Private';
          const displayName = isPrivate ? `${s.name} (Private)` : s.name;
          schoolNames.push(displayName);

          const st = socMap.get(s.id) || {};
          const enr = extractStatField(st, 'student_enrollment');
          const drp = extractStatField(st, 'drop_out');
          const osy = extractStatField(st, 'osy');

          if (enr.isTotalOnly) enrolledHasTotalOnly = true;

          tEnrolledM += enr.m;
          tEnrolledF += enr.f;
          tEnrolledTotal += enr.total;
          tDropOuts += drp.total;
          tOsy += osy.total;

          eM.push(enr.m);
          eF.push(enr.f);
          eTot.push(enr.total);

          if (s.district === 'School-Secondary') {
            secondarySchools.push(displayName);
            if (enr.isTotalOnly) secondaryHasTotalOnly = true;
            secondaryEM.push(enr.m);
            secondaryEF.push(enr.f);
            secondaryETot.push(enr.total);
          } else {
            primarySchools.push(displayName);
            if (enr.isTotalOnly) primaryHasTotalOnly = true;
            primaryEM.push(enr.m);
            primaryEF.push(enr.f);
            primaryETot.push(enr.total);
          }
        });
      }

      // Health & Welfare Stats -> from Barangays
      let tPwds = 0, tFourPs = 0, tFourPsChildren = 0, tSeniors = 0, tSolo = 0;
      let tTeen = 0, tMaternal = 0;
      const bNames: string[] = [];
      const bIds: string[] = [];
      const mM: number[] = [];
      const mF: number[] = [];
      const mTot: number[] = [];
      let malHasTotalOnly = false;
      
      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        const st = socMap.get(b.id) || {};
        const dyn = dynamicEntityMap.get(b.id) || {};

        let pwd = { m: 0, f: 0, total: 0 };
        let fps = { m: 0, f: 0, total: 0 };
        let fpsCh = { m: 0, f: 0, total: 0 };
        let sen = { m: 0, f: 0, total: 0 };
        let solo = { m: 0, f: 0, total: 0 };
        let mal = { m: 0, f: 0, total: 0, isTotalOnly: false };
        let teen = 0;
        let mat = 0;

        if (Object.keys(dyn).length > 0) {
          const dynPwd = dyn.pwd_registered || dyn.pwd_residents || dyn.pwd;
          if (dynPwd) {
            const v = extractDynamicValue(dynPwd);
            pwd = { m: v.m, f: v.f, total: v.total };
          }

          const dynFps = dyn.fourps_beneficiaries || dyn.four_ps || dyn.fourps;
          if (dynFps) {
            const v = extractDynamicValue(dynFps);
            fps = { m: v.m, f: v.f, total: v.total };
          }

          const dynSen = dyn.senior_pensioners || dyn.seniors || dyn.osca_registered || dyn.indigent_pensioners;
          if (dynSen) {
            const v = extractDynamicValue(dynSen);
            sen = { m: v.m, f: v.f, total: v.total };
          }

          const dynSolo = dyn.solo_parents || dyn.registered_solo_parents;
          if (dynSolo) {
            const v = extractDynamicValue(dynSolo);
            solo = { m: v.m, f: v.f, total: v.total };
          }

          const dynMal = dyn.under5_malnourished || dyn.malnourished;
          if (dynMal) {
            const v = extractDynamicValue(dynMal);
            mal = { m: v.m, f: v.f, total: v.total, isTotalOnly: v.m === 0 && v.f === 0 && v.total > 0 };
          }

          const dynTeen = dyn.teenage_pregnancies || dyn.teenage_pregnancy;
          if (dynTeen) {
            const v = extractDynamicValue(dynTeen);
            teen = v.total;
          }

          const dynMat = dyn.maternal_deaths || dyn.maternal_mortality;
          if (dynMat) {
            const v = extractDynamicValue(dynMat);
            mat = v.total;
          }

          const dynOsy = dyn.osy_count || dyn.osy;
          if (dynOsy && eduDynamicRows.length === 0) {
            const v = extractDynamicValue(dynOsy);
            tOsy += v.total;
          }
        } else if (allDynamicRows.length === 0 && socData.length > 0) {
          // Fallback to native only if no dynamic data exists at all
          const stPwd = extractStatField(st, 'pwd');
          const stFps = extractStatField(st, 'four_ps');
          const stFpsCh = extractStatField(st, 'four_ps_children');
          const stSen = extractStatField(st, 'senior_citizens');
          const stSolo = extractStatField(st, 'solo_parents');
          const stMal = extractStatField(st, 'malnourished');
          
          pwd = { m: stPwd.m, f: stPwd.f, total: stPwd.total };
          fps = { m: stFps.m, f: stFps.f, total: stFps.total };
          fpsCh = { m: stFpsCh.m, f: stFpsCh.f, total: stFpsCh.total };
          sen = { m: stSen.m, f: stSen.f, total: stSen.total };
          solo = { m: stSolo.m, f: stSolo.f, total: stSolo.total };
          mal = { m: stMal.m, f: stMal.f, total: stMal.total, isTotalOnly: stMal.isTotalOnly };
          teen = Number(st.teenage_pregnancy || 0);
          mat = Number(st.maternal_mortality || 0);
        }

        if (mal.isTotalOnly) malHasTotalOnly = true;
        
        tPwds += pwd.total;
        tFourPs += fps.total;
        tFourPsChildren += fpsCh.total;
        tSeniors += sen.total;
        tSolo += solo.total;
        tTeen += teen;
        tMaternal += mat;
        
        mM.push(mal.m);
        mF.push(mal.f);
        mTot.push(mal.total);
      });

      return {
        enrolledM: tEnrolledM, enrolledF: tEnrolledF, enrolledTotal: tEnrolledTotal,
        dropOuts: tDropOuts, osy: tOsy, 
        
        pwds: tPwds, fourPs: tFourPs, fourPsChildren: tFourPsChildren, seniorCitizens: tSeniors, soloParents: tSolo,
        teenPregnancy: tTeen, maternalMortality: tMaternal,
        
        barangays: bNames,
        barangayIds: bIds,
        schools: schoolNames,
        
        primarySchools,
        primaryHasTotalOnly,
        primaryEnrolledSeries: primaryHasTotalOnly
          ? [{ name: "Total", data: primaryETot }]
          : [{ name: "Male", data: primaryEM }, { name: "Female", data: primaryEF }],

        secondarySchools,
        secondaryHasTotalOnly,
        secondaryEnrolledSeries: secondaryHasTotalOnly
          ? [{ name: "Total", data: secondaryETot }]
          : [{ name: "Male", data: secondaryEM }, { name: "Female", data: secondaryEF }],

        enrolledHasTotalOnly,
        enrolledSeries: enrolledHasTotalOnly 
          ? [{ name: "Total", data: eTot }] 
          : [{ name: "Male", data: eM }, { name: "Female", data: eF }],
          
        malHasTotalOnly,
        malnourishedSeries: malHasTotalOnly 
          ? [{ name: "Total", data: mTot }] 
          : [{ name: "Male", data: mM }, { name: "Female", data: mF }],

        enrolledM_series: eM, enrolledF_series: eF,
        malnourishedM_series: mM, malnourishedF_series: mF,
      };
    }
  });
}
