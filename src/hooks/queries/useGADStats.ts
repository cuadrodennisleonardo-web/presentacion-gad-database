import { useQuery } from "@tanstack/react-query";
import { fetchStatsMaybeSingle } from "@/services/api";

export function useGADStats(year: number) {
  return useQuery({
    queryKey: ['gad_stats', year],
    queryFn: async () => {
      const g = await fetchStatsMaybeSingle("gad_stats", year) || {};

      const totalLGU = g.total_lgu_budget || 0;
      const gadAllocated = g.gad_allocated_amount || 0;
      const gadUtilized = g.gad_utilized_amount || 0;
      
      const nonGadBudget = Math.max(0, totalLGU - gadAllocated);
      const unusedGad = Math.max(0, gadAllocated - gadUtilized);

      return {
        lguBudget: totalLGU,
        gadAllocated: gadAllocated,
        gadUtilized: gadUtilized,
        trainings: g.number_of_gad_trainings || 0,
        participants: g.participants_trained || 0,
        budgetSeries: [nonGadBudget, gadUtilized, unusedGad],
        budgetLabels: ["Non-GAD Budget", "Utilized GAD Budget", "Unused GAD Allocation"]
      };
    }
  });
}
