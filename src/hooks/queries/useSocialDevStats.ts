import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchSchools, fetchStats } from "@/services/api";

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
      let tEnrolledM = 0, tEnrolledF = 0;
      let tDropOuts = 0, tOsy = 0;
      const schoolNames: string[] = [];
      const eM: number[] = [];
      const eF: number[] = [];
      
      sData.forEach(s => {
        schoolNames.push(s.name);
        const st = socMap.get(s.id) || {};
        tEnrolledM += st.student_enrollment_m || 0;
        tEnrolledF += st.student_enrollment_f || 0;
        tDropOuts += (st.drop_out_m || 0) + (st.drop_out_f || 0);
        tOsy += (st.osy_m || 0) + (st.osy_f || 0);
        
        eM.push(st.student_enrollment_m || 0);
        eF.push(st.student_enrollment_f || 0);
      });

      // Health & Welfare Stats -> from Barangays
      let tPwds = 0, tFourPs = 0, tSeniors = 0, tSolo = 0;
      let tTeen = 0, tMaternal = 0;
      const bNames: string[] = [];
      const bIds: string[] = [];
      const mM: number[] = [];
      const mF: number[] = [];
      
      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        const st = socMap.get(b.id) || {};
        
        tPwds += (st.pwd_m || 0) + (st.pwd_f || 0);
        tFourPs += (st.four_ps_m || 0) + (st.four_ps_f || 0);
        tSeniors += (st.senior_citizens_m || 0) + (st.senior_citizens_f || 0);
        tSolo += (st.solo_parents_m || 0) + (st.solo_parents_f || 0);
        tTeen += st.teenage_pregnancy || 0;
        tMaternal += st.maternal_mortality || 0;
        
        mM.push(st.malnourished_m || 0);
        mF.push(st.malnourished_f || 0);
      });

      return {
        enrolledM: tEnrolledM, enrolledF: tEnrolledF,
        dropOuts: tDropOuts, osy: tOsy, 
        
        pwds: tPwds, fourPs: tFourPs, seniorCitizens: tSeniors, soloParents: tSolo,
        teenPregnancy: tTeen, maternalMortality: tMaternal,
        
        barangays: bNames,
        barangayIds: bIds,
        schools: schoolNames,
        
        enrolledM_series: eM, enrolledF_series: eF,
        malnourishedM_series: mM, malnourishedF_series: mF,
      };
    }
  });
}
