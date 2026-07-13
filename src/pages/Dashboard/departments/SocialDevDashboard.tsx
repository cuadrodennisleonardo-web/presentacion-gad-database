import React, { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DeptKPIChart from "@/components/charts/DeptKPIChart";
import { supabase } from "@/config/supabase";

const SocialDevDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    education: { schoolLevels: {} as Record<string, number>, enrollmentStatus: {} as Record<string, number> },
    health: { nutritionalStatus: {} as Record<string, number> },
    soloParent: { classification: {} as Record<string, number> },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      const year = new Date().getFullYear();
      
      const { data: socialData } = await supabase
        .from('social_dev_stats')
        .select('*')
        .eq('year', year);
        
      const { data: popData } = await supabase
        .from('population_stats')
        .select('*')
        .eq('year', year);

      let enrolled = 0, dropout = 0, osy = 0;
      let malnourished = 0, teenagePregnancy = 0, maternalMortality = 0;
      
      if (socialData) {
        socialData.forEach(row => {
          enrolled += (row.student_enrollment_m || 0) + (row.student_enrollment_f || 0);
          dropout += (row.drop_out_m || 0) + (row.drop_out_f || 0);
          osy += (row.osy_m || 0) + (row.osy_f || 0);
          malnourished += (row.malnourished_m || 0) + (row.malnourished_f || 0);
          teenagePregnancy += row.teenage_pregnancy || 0;
          maternalMortality += row.maternal_mortality || 0;
        });
      }
      
      let soloM = 0, soloF = 0;
      if (popData) {
        popData.forEach(row => {
          soloM += row.solo_parents_m || 0;
          soloF += row.solo_parents_f || 0;
        });
      }

      setStats({ 
        education: { 
          schoolLevels: { 'Enrolled': enrolled }, 
          enrollmentStatus: { 
            'Enrolled': enrolled, 
            'Drop-outs': dropout, 
            'Out-of-school Youth': osy 
          } 
        }, 
        health: { 
          nutritionalStatus: { 
            'Malnourished': malnourished, 
            'Teenage Pregnancy': teenagePregnancy, 
            'Maternal Mortality': maternalMortality 
          } 
        }, 
        soloParent: { 
          classification: { 
            'Male Solo Parents': soloM, 
            'Female Solo Parents': soloF 
          } 
        } 
      });
      setIsLoading(false);
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }
  return (
    <>
      <PageMeta
        title="Social Development Dashboard"
        description="KPIs and metrics for Social Development"
      />
      <PageBreadcrumb pageTitle="Social Development Dashboard" />

      <div className="mb-8 rounded-2xl bg-white p-6 shadow-theme-sm dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Social Development Analytics
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This dashboard shows real-time analytics for Health, Education, and Solo Parents.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <DeptKPIChart 
          title="Education Overview"
          categories={Object.keys(stats.education.enrollmentStatus)}
          seriesData={Object.values(stats.education.enrollmentStatus)}
          type="bar"
          color="#3b82f6"
        />
        
        <DeptKPIChart 
          title="Health Indicators"
          categories={Object.keys(stats.health.nutritionalStatus)}
          seriesData={Object.values(stats.health.nutritionalStatus)}
          type="pie"
        />

        <DeptKPIChart 
          title="Solo Parents by Sex"
          categories={Object.keys(stats.soloParent.classification)}
          seriesData={Object.values(stats.soloParent.classification)}
          type="pie"
          color="#ec4899"
        />
      </div>
    </>
  );
};

export default SocialDevDashboard;
