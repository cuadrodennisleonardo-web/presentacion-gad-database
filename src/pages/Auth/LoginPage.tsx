import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import PageMeta from "@/components/common/PageMeta";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <>
      <PageMeta title="Sign In" description="Sign in to Presentacion Municipal Database" />
      <div className="flex min-h-screen">
        {/* Left Panel — Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-blue-light-500" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          
          {/* Decorative shapes */}
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-brand-700/30 blur-3xl" />
          <div className="absolute top-1/3 right-10 h-40 w-40 rounded-2xl bg-white/5 rotate-12" />
          
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            <div className="mb-8">
              <img src="/logo.png" alt="Presentacion Logo" className="h-20 w-20 object-contain drop-shadow-md" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Presentacion<br />GAD Database
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              A centralized platform for tracking, analyzing, and managing 
              Gender and Development (GAD) initiatives and demographic data 
              across Presentacion's 18 barangays.
            </p>
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="flex w-full items-center justify-center bg-white px-4 dark:bg-gray-900 lg:w-1/2">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-8 lg:hidden text-center">
              <img src="/logo.png" alt="Presentacion Logo" className="h-16 w-16 mx-auto object-contain mb-4 drop-shadow-sm" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                Presentacion GAD Database
              </h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                Sign In
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Enter your credentials to access the system.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-error-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.667L9.025 11.06a1.667 1.667 0 001.95 0L17.5 6.667M4.167 15h11.666A1.667 1.667 0 0017.5 13.333V6.667A1.667 1.667 0 0015.833 5H4.167A1.667 1.667 0 002.5 6.667v6.666A1.667 1.667 0 004.167 15z" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-12 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15.833 9.167H4.167A1.667 1.667 0 002.5 10.833v5.834A1.667 1.667 0 004.167 18.333h11.666a1.667 1.667 0 001.667-1.666v-5.834a1.667 1.667 0 00-1.667-1.666zM5.833 9.167V5.833a4.167 4.167 0 018.334 0v3.334" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-12 pr-12 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-hidden focus:ring-3 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
              Presentacion, Camarines Sur • Municipal Government
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
