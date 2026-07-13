import { useQuery } from "@tanstack/react-query";
import { fetchBarangays, fetchStats } from "@/services/api";

export function useSocialDevStats(year: number) {
  return useQuery({
    queryKey: ['social_dev_stats', year],
    queryFn: async () => {
      const [bData, socData] = await Promise.all([
        fetchBarangays(),
        fetchStats("social_dev_stats", year)
      ]);

      const socMap = new Map(socData.map(d => [d.barangay_id, d]));

      let tEnrolledM = 0, tEnrolledF = 0;
      let tPwds = 0, tFourPs = 0, tSeniors = 0, tSolo = 0;
      let tDropOuts = 0, tOsy = 0, tTeen = 0, tMaternal = 0;

      const bNames: string[] = [];
      const bIds: string[] = [];
      const eM: number[] = [];
      const eF: number[] = [];
      const mM: number[] = [];
      const mF: number[] = [];

      bData.forEach(b => {
        bNames.push(b.name);
        bIds.push(b.id);
        
        const s = socMap.get(b.id) || {};

        tEnrolledM += s.student_enrollment_m || 0;
        tEnrolledF += s.student_enrollment_f || 0;
        tPwds += (s.pwd_m || 0) + (s.pwd_f || 0);
        tFourPs += (s.four_ps_m || 0) + (s.four_ps_f || 0);
        tSeniors += (s.senior_citizens_m || 0) + (s.senior_citizens_f || 0);
        tSolo += (s.solo_parents_m || 0) + (s.solo_parents_f || 0);
        tDropOuts += (s.drop_out_m || 0) + (s.drop_out_f || 0);
        tOsy += (s.osy_m || 0) + (s.osy_f || 0);
        tTeen += s.teenage_pregnancy || 0;
        tMaternal += s.maternal_mortality || 0;

        eM.push(s.student_enrollment_m || 0);
        eF.push(s.student_enrollment_f || 0);
        mM.push(s.malnourished_m || 0);
        mF.push(s.malnourished_f || 0);
      });

      return {
        enrolledM: tEnrolledM, enrolledF: tEnrolledF,
        pwds: tPwds, fourPs: tFourPs, seniorCitizens: tSeniors, soloParents: tSolo,
        dropOuts: tDropOuts, osy: tOsy, teenPregnancy: tTeen, maternalMortality: tMaternal,
        barangays: bNames,
        barangayIds: bIds,
        enrolledM_series: eM, enrolledF_series: eF,
        malnourishedM_series: mM, malnourishedF_series: mF,
      };
    }
  });
}
