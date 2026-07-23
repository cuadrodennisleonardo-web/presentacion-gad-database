import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchSchools, fetchStats } from "@/services/api";

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

export function useSocialDevStats(year: number) {
  return useQuery({
    queryKey: ['social_dev_stats', year],
    queryFn: async () => {
      const [bData, sData, socData] = await Promise.all([
        fetchBarangays(),
        fetchSchools(),
        fetchStats("social_dev_stats", year)
      ]);

      const socMap = new Map(socData.map(d => [d.barangay_id, d]));

      // Education Stats -> from Schools
      let tEnrolledM = 0, tEnrolledF = 0, tEnrolledTotal = 0;
      let tDropOuts = 0, tOsy = 0;
      const schoolNames: string[] = [];
      const eM: number[] = [];
      const eF: number[] = [];
      const eTot: number[] = [];
      let enrolledHasTotalOnly = false;
      
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

      // Health & Welfare Stats -> from Barangays
      let tPwds = 0, tFourPs = 0, tSeniors = 0, tSolo = 0;
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

        const pwd = extractStatField(st, 'pwd');
        const fps = extractStatField(st, 'four_ps');
        const sen = extractStatField(st, 'senior_citizens');
        const solo = extractStatField(st, 'solo_parents');
        const mal = extractStatField(st, 'malnourished');

        if (mal.isTotalOnly) malHasTotalOnly = true;
        
        tPwds += pwd.total;
        tFourPs += fps.total;
        tSeniors += sen.total;
        tSolo += solo.total;
        tTeen += Number(st.teenage_pregnancy || 0);
        tMaternal += Number(st.maternal_mortality || 0);
        
        mM.push(mal.m);
        mF.push(mal.f);
        mTot.push(mal.total);
      });

      return {
        enrolledM: tEnrolledM, enrolledF: tEnrolledF, enrolledTotal: tEnrolledTotal,
        dropOuts: tDropOuts, osy: tOsy, 
        
        pwds: tPwds, fourPs: tFourPs, seniorCitizens: tSeniors, soloParents: tSolo,
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
