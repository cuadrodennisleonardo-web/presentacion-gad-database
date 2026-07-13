import React from 'react';
import { useNavigate } from 'react-router';
import PageMeta from '@/components/common/PageMeta';

const PublicLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans selection:bg-brand-500/30">
      <PageMeta title="Presentacion Municipal Database" description="Official Database and Analytics Platform" />
      
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-900/80 transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LGU Logo" className="h-10 w-10 object-contain drop-shadow-sm" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Presentacion</h1>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">GAD Database</p>
            </div>
          </div>
          <div>
            <button
              onClick={() => navigate('/login')}
              className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-brand-600 hover:shadow-brand-500/25"
            >
              <span>Sign In to Dashboard</span>
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
          {/* Background decorations */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-200 to-brand-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] dark:opacity-30" />
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-3xl">
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
                Data-Driven <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-500">Governance</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
                A centralized, highly secure platform for tracking demographic statistics, infrastructure developments, budget allocations, and Gender and Development (GAD) initiatives across all 18 barangays of Presentacion.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-full bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all hover:scale-105"
                >
                  Access Platform
                </button>
                <a href="#features" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Learn more <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
        </section>



        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-base font-semibold leading-7 text-brand-600 dark:text-brand-400">Robust Infrastructure</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Everything you need to manage municipal data
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Dynamic Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Generate instant, visual reports and dashboards for demographics, infrastructure, and social development across the municipality.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Custom Data Engines</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Easily build and track entirely new metrics on-the-fly using the Dynamic Table Builder without writing any code.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Financial Tracking</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  A dedicated financial ledger system for monitoring budget allocations, utilization, and performance indicators precisely.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Gender & Development</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Dedicated tracking for GAD initiatives, ensuring resources and programs are allocated equitably across all sectors.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Role-Based Security</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Granular permission systems ensure that department data is only accessible and editable by authorized personnel.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Comprehensive Audit Logs</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Every addition, modification, or deletion is tracked with strict audit logging for complete transparency and accountability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Location Map Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-base font-semibold leading-7 text-brand-600 dark:text-brand-400">Our Location</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Municipality of Presentacion
              </p>
            </div>
            
            <div className="overflow-hidden rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative aspect-[4/3] md:aspect-video w-full">
               <iframe 
                 title="Municipality of Presentacion Map"
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124014.6050032875!2d123.64968520736366!3d13.751327870152869!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a1d2796be6bd59%3A0x85594c3d82eed290!2sPresentacion%2C%20Camarines%20Sur!5e0!3m2!1sen!2sph!4v1783925587417!5m2!1sen!2sph" 
                 className="absolute top-0 left-0 w-full h-full border-0" 
                 allowFullScreen 
                 loading="lazy" 
                 referrerPolicy="no-referrer-when-downgrade"
               />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LGU Logo" className="h-8 w-8 grayscale opacity-70" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Municipal Government of Presentacion. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:hover:text-brand-400">Dashboard Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;
