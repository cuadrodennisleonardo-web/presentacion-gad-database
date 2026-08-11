import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import PageMeta from '@/components/common/PageMeta';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
import { BARANGAYS } from '@/lib/constants';
import { PresentacionAdminMap } from '@/components/maps/PresentacionAdminMap';
import { getBarangays, type BarangayWithStats } from '@/services/barangayService';

const SECTORS = [
  {
    title: "Demographics & Population",
    description: "Tracking total population, total households, gender breakdown, and barangay demographics.",
    icon: (
      <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: "Social Development",
    description: "Monitoring student enrollment, malnutrition, OSY, PWDs, 4Ps beneficiaries, and senior citizens.",
    icon: (
      <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  },
  {
    title: "Economic Development",
    description: "Recording employment stats, farmers, fisherfolks, commercial establishments, and ambulant vendors.",
    icon: (
      <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    title: "Infrastructure & Utilities",
    description: "Mapping access to safe potable water, sanitary toilet facilities, and informal settler management.",
    icon: (
      <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M9 16h.01M9 12h.01M9 8h.01M15 16h.01M15 12h.01M15 8h.01" />
      </svg>
    )
  },
  {
    title: "Local Governance",
    description: "Managing elected municipal/barangay officials, appointed department heads, and capacity trainings.",
    icon: (
      <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    )
  },
  {
    title: "Justice & Safety",
    description: "Documenting VAWC cases, CICL interventions, sexual assault reports, and community safety programs.",
    icon: (
      <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    title: "Institutional GAD",
    description: "Overseeing mandatory GAD budget allocations, project utilization, and municipal compliance reporting.",
    icon: (
      <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const PublicLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [barangayList, setBarangayList] = useState<BarangayWithStats[]>([]);
  const [barangayStatsMap, setBarangayStatsMap] = useState<Record<string, { population: number; households: number }>>({});

  useEffect(() => {
    async function loadBarangayData() {
      const { data } = await getBarangays();
      if (data && data.length > 0) {
        setBarangayList(data);
        const map: Record<string, { population: number; households: number }> = {};
        data.forEach(b => {
          map[b.name] = {
            population: b.population_count,
            households: b.household_count
          };
        });
        setBarangayStatsMap(map);
      }
    }
    loadBarangayData();
  }, []);

  const handleBarangayClick = (brgyName: string) => {
    setSelectedBarangay(brgyName);
    const mapElement = document.getElementById("location-map");
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit selection:bg-brand-500 selection:text-white transition-colors duration-200">
      <PageMeta title="Presentacion Municipal GAD Database" description="Official Municipal Database & Analytics Platform" />
      
      {/* Sticky Glass Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200/80 bg-white/85 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-900/85 transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LGU Presentacion Seal" className="h-11 w-11 object-contain drop-shadow-sm" />
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                Municipality of Presentacion
              </h1>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                Gender &amp; Development (GAD) Database
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all"
            >
              <span>Sign In to Portal</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24 bg-gradient-to-b from-brand-50/60 via-gray-50/40 to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 border-b border-gray-200/60 dark:border-gray-800/60">
          
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-brand-500/10 dark:bg-brand-500/15 blur-[120px] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center text-center">
              
              {/* LGU Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 mb-6 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                Republic of the Philippines • Camarines Sur
              </div>

              {/* Main Headline */}
              <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl leading-tight">
                Presentacion Municipal <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-500 dark:from-brand-400 dark:to-indigo-300">
                  GAD &amp; Demographic Database
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                A centralized, secure digital platform for monitoring demographic indicators, infrastructure developments, budget allocations, and Gender and Development (GAD) statistics across all 18 barangays of Presentacion.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-500/25 hover:bg-brand-600 active:scale-[0.98] transition-all"
                >
                  Access Authorized Portal
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <a
                  href="#sectors"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Explore Municipal Sectors
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* Municipal Sectors Grid Section (Minimal Executive Design) */}
        <section id="sectors" className="py-12 lg:py-16 bg-white dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-8 lg:mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Municipal Governance Pillars
              </span>
              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Integrated Data Management Sectors
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Data management &amp; approval workflows across 7 dedicated LGU departments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {SECTORS.map((sector, idx) => (
                <div 
                  key={idx}
                  className="group flex items-start gap-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-xs hover:shadow-md hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all duration-200"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10 group-hover:scale-105 transition-transform">
                    {sector.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                      {sector.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">
                      {sector.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 18 Barangays Directory Grid Section (Minimal Space-Saving Compact Grid) */}
        <section className="py-12 lg:py-16 bg-gray-50 dark:bg-gray-950 border-t border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-8 lg:mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Barangay Directory
              </span>
              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                The 18 Barangays of Presentacion
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Click any barangay card below to locate and highlight it on the Administrative Map.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(barangayList.length > 0
                ? barangayList
                : BARANGAYS.map((name) => ({
                    id: name,
                    name,
                    population_count: 0,
                    household_count: 0,
                  }))
              ).map((brgy) => {
                const brgyName = typeof brgy === 'string' ? brgy : brgy.name;
                const popCount = (brgy as any).population_count || barangayStatsMap[brgyName]?.population || 0;
                const hhCount = (brgy as any).household_count || barangayStatsMap[brgyName]?.households || 0;
                const isSelected = selectedBarangay === brgyName;

                return (
                  <div
                    key={brgyName}
                    onClick={() => handleBarangayClick(brgyName)}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? "border-2 border-brand-500 bg-brand-50/90 dark:bg-brand-500/15 shadow-md ring-2 ring-brand-500/30 dark:border-brand-400"
                        : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 shrink-0">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected 
                          ? "bg-brand-500 text-white" 
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-500/20 dark:group-hover:text-brand-400"
                      }`}>
                        <span>Map</span>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    </div>
                    
                    <div className="mt-2.5">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                        {brgyName}
                      </h3>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800/60 text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Pop <strong className="font-bold text-gray-800 dark:text-white/90">{popCount.toLocaleString()}</strong></span>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">HH <strong className="font-bold text-gray-800 dark:text-white/90">{hhCount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Location Map Section */}
        <section id="location-map" className="py-16 lg:py-24 bg-white dark:bg-gray-900 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Geographic Location
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {selectedBarangay ? `Location Map — Barangay ${selectedBarangay}` : "Municipality of Presentacion Map"}
              </h2>
              <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
                {selectedBarangay 
                  ? `Showing geographic location & demographic stats for Barangay ${selectedBarangay}, Presentacion, Camarines Sur.`
                  : "Located in the 4th Congressional District of Camarines Sur, Bicol Region."
                }
              </p>
            </div>
            
            <div className="overflow-hidden rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 sm:p-6 relative w-full flex flex-col items-center justify-center">
              <PresentacionAdminMap 
                selectedBarangay={selectedBarangay} 
                onSelectBarangay={(brgy) => setSelectedBarangay(brgy || null)}
                barangayStatsMap={barangayStatsMap}
              />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LGU Logo" className="h-8 w-8 object-contain" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Municipal Government of Presentacion, Camarines Sur. All rights reserved.
            </p>
          </div>
          <button 
            onClick={() => navigate('/login')} 
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Authorized Portal Access
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;
