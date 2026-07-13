import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";

const NotFoundPage: React.FC = () => {
  return (
    <>
      <PageMeta title="Page Not Found" />
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">
            404
          </h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Page Not Found
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.833 10H4.167M4.167 10l5 5M4.167 10l5-5" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
