import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { useRole } from '@/hooks/useRole';
import { 
  useFeedbackList, 
  useSubmitFeedback, 
  useToggleUpvote,
  useFeedbackStats
} from '@/hooks/queries/useFeedback';
import { 
  type FeedbackCategory, 
  type FeedbackPriority, 
  type FeedbackComment 
} from '@/services/feedbackService';

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const ChatIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const LightbulbIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const PaletteIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const ChartBarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BugIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PinIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StarIcon = ({ filled = true, className = "w-4 h-4" }: { filled?: boolean; className?: string }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={filled ? 0 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const ArrowUpIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const ReplyIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
  </svg>
);

const ShieldIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BriefcaseIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserCheckIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CATEGORIES: { id: FeedbackCategory; label: string; icon: React.FC<{ className?: string }>; bg: string; text: string; border: string }[] = [
  { id: 'suggestion', label: 'Suggestion', icon: LightbulbIcon, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' },
  { id: 'critique', label: 'Design Critique', icon: PaletteIcon, bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/60' },
  { id: 'data_accuracy', label: 'Data Accuracy', icon: ChartBarIcon, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/60' },
  { id: 'bug', label: 'Bug Report', icon: BugIcon, bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/60' },
  { id: 'general', label: 'General Comment', icon: ChatIcon, bg: 'bg-gray-50 dark:bg-gray-800/60', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Pending Review', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  in_review: { label: 'Under Consideration', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  planned: { label: 'Planned / In Progress', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  resolved: { label: 'Implemented / Resolved', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  dismissed: { label: 'Closed', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
};

function formatRoleTitle(roleStr: string): string {
  if (!roleStr) return 'Reviewer';
  const clean = roleStr.replace(/_/g, ' ');
  return clean
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function renderRoleBadge(roleStr: string) {
  const r = (roleStr || 'reviewer').toLowerCase();
  const formatted = formatRoleTitle(roleStr);

  if (r.includes('superadmin') || r.includes('super_admin') || r.includes('super admin')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
        <ShieldIcon className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Super Admin
      </span>
    );
  }
  if (r.includes('senior')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
        <BriefcaseIcon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> {formatted}
      </span>
    );
  }
  if (r.includes('dept') || r.includes('head') || r.includes('admin') || r.includes('encoder')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[10px] font-extrabold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
        <BriefcaseIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" /> {formatted}
      </span>
    );
  }
  if (r.includes('reviewer') || r.includes('stakeholder') || r.includes('evaluator') || r.includes('viewer')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/50 text-[10px] font-extrabold text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/50">
        <UserCheckIcon className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> {formatted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
      <UserCheckIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {formatted}
    </span>
  );
}

function getPageTitleFromUrl(pathname: string): string {
  if (pathname === '/' || pathname === '/dashboard') return 'Overview Dashboard';
  if (pathname.startsWith('/data-entry/social-development')) return 'Social Development Hub';
  if (pathname.startsWith('/data-entry/economic-development')) return 'Economic Development Hub';
  if (pathname.startsWith('/data-entry/infrastructure')) return 'Infrastructure Hub';
  if (pathname.startsWith('/data-entry/environment')) return 'Environment Hub';
  if (pathname.startsWith('/data-entry/institutional')) return 'Institutional Hub';
  if (pathname.startsWith('/dashboard/social-development')) return 'Social Development Dashboard';
  if (pathname.startsWith('/dashboard/economic-development')) return 'Economic Development Dashboard';
  if (pathname.startsWith('/dashboard/infrastructure')) return 'Infrastructure Dashboard';
  if (pathname.startsWith('/dashboard/environment')) return 'Environment Dashboard';
  if (pathname.startsWith('/dashboard/institutional')) return 'Institutional Dashboard';
  if (pathname.startsWith('/barangays')) return 'Barangays Directory';
  if (pathname.startsWith('/gad-reports/gpb')) return 'GPB Form (Annex D)';
  if (pathname.startsWith('/gad-reports/gadar')) return 'GAD AR (Annex E)';
  if (pathname.startsWith('/gad-reports/gfps')) return 'GFPS Directory Tracker';
  if (pathname.startsWith('/gad-reports/compliance')) return 'JMC Compliance Dashboard';
  if (pathname.startsWith('/gad-reports/hgdg')) return 'HGDG Project Scoring';
  if (pathname.startsWith('/settings/dynamic-tables')) return 'Dynamic Tables Manager';
  if (pathname.startsWith('/settings/users')) return 'User Management';
  if (pathname.startsWith('/settings/approvals')) return 'Approval Queue';
  if (pathname.startsWith('/settings/audit-logs')) return 'Audit Logs';
  if (pathname.startsWith('/settings/profile')) return 'User Profile';
  return 'Presentacion GAD Database';
}

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'browse'>('submit');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { isSuperAdmin } = useRole();

  // Stats for badge
  const { total, pending } = useFeedbackStats();

  // Form State
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [priority, setPriority] = useState<FeedbackPriority>('medium');

  const authorName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Reviewer';
  const authorRole = user?.profile?.role || 'reviewer';
  const authorDept = user?.profile?.department || null;

  // Filter State for Browse Tab
  const [onlyCurrentPage, setOnlyCurrentPage] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const currentPageTitle = useMemo(() => getPageTitleFromUrl(location.pathname), [location.pathname]);

  const { data: feedbackList = [], isLoading: isLoadingList } = useFeedbackList({
    pageUrl: location.pathname,
    onlyCurrentPage,
    category: filterCategory,
    searchQuery,
  });

  const submitMutation = useSubmitFeedback();
  const upvoteMutation = useToggleUpvote();

  // Client identifier for upvote tracking
  const voterId = user?.id || `anon_${localStorage.getItem('anon_voter_id') || (() => {
    const id = Math.random().toString(36).substring(2, 9);
    localStorage.setItem('anon_voter_id', id);
    return id;
  })()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await submitMutation.mutateAsync({
      user_id: user?.id || null,
      author_name: authorName,
      author_email: user?.email || null,
      author_role: authorRole,
      author_department: authorDept,
      page_url: location.pathname,
      page_title: currentPageTitle,
      category,
      title,
      content,
      rating: rating || null,
      priority,
    });

    setTitle('');
    setContent('');
    setRating(null);
    setIsSubmittedSuccess(true);
    if (isSuperAdmin) {
      setActiveTab('browse');
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return;

    await submitMutation.mutateAsync({
      user_id: user?.id || null,
      author_name: authorName,
      author_email: user?.email || null,
      author_role: authorRole,
      author_department: authorDept,
      page_url: location.pathname,
      page_title: currentPageTitle,
      category: 'general',
      title: 'Reply',
      content: replyContent,
      parent_id: parentId,
    });

    setReplyContent('');
    setReplyingToId(null);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={() => { setIsOpen(true); setIsSubmittedSuccess(false); }}
          className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 sm:px-5 py-3 text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-95 cursor-pointer border border-white/20"
          aria-label="Feedback and Critique"
        >
          <ChatIcon className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            Feedback &amp; Critique
          </span>
          {isSuperAdmin && pending > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-gray-950 shadow-sm animate-pulse">
              {pending}
            </span>
          )}
        </button>
      </div>

      {/* Slide-over Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-100 dark:border-gray-800 flex flex-col h-full">
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/30 dark:from-gray-900 dark:to-gray-850 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white">
                      {isSuperAdmin ? "Feedback & Critique Manager" : "Submit Feedback & Critique"}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {isSuperAdmin ? "Review and manage submissions from reviewers" : "Help us improve the Presentacion GAD Database"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSuperAdmin && (
                      <Link
                        to="/feedback"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer"
                        title="Open Full Management Hub"
                      >
                        <span>Admin Hub</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    )}

                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Current Page Context Badge */}
                <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <PinIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Current Page: {currentPageTitle}</span>
                </div>

                {/* Navigation Tabs (Only visible if Superadmin) */}
                {isSuperAdmin && (
                  <div className="mt-2.5 flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
                    <button
                      onClick={() => setActiveTab('submit')}
                      className={`flex-1 py-1 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'submit'
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <ChatIcon className="w-3.5 h-3.5" />
                      <span>Leave Feedback</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className={`flex-1 py-1 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'browse'
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <LightbulbIcon className="w-3.5 h-3.5" />
                      <span>Review Feedbacks</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[10px] font-extrabold text-blue-700 dark:text-blue-300">
                        {total}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {isSubmittedSuccess && !isSuperAdmin ? (
                  <div className="py-10 px-4 text-center rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Feedback Submitted Successfully!
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Thank you for your feedback. Your suggestions and critique have been recorded and sent directly to the Super Admin for review.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmittedSuccess(false)}
                      className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition cursor-pointer"
                    >
                      Submit Another Feedback
                    </button>
                  </div>
                ) : activeTab === 'submit' ? (
                  <form onSubmit={handleSubmit} className="space-y-3.5">

                    {/* Category Selector */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        What type of feedback are you providing?
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CATEGORIES.map(cat => {
                          const IconComp = cat.icon;
                          const isSelected = category === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategory(cat.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                                isSelected
                                  ? `${cat.bg} ${cat.border} ring-2 ring-blue-500/50 shadow-xs`
                                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? cat.text : 'text-gray-400'}`} />
                              <span className={`text-xs font-bold truncate ${isSelected ? cat.text : 'text-gray-700 dark:text-gray-300'}`}>
                                {cat.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Overall Satisfaction / Rating */}
                    <div className="flex items-center justify-between bg-gray-50/80 dark:bg-gray-850 px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                          Overall Satisfaction / Rating
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {rating ? `${rating} of 5 Stars` : 'Optional'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star === rating ? null : star)}
                            className={`p-1 transition-transform hover:scale-115 focus:outline-none cursor-pointer ${
                              rating && star <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'
                            }`}
                          >
                            <StarIcon filled={!!(rating && star <= rating)} className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Headline / Summary */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Headline / Summary <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Add export button to Education table, or UI layout clarification..."
                        className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 px-3 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Detailed Content */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Detailed Critique or Suggestion <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe your suggestion, what could be improved, any observed issues, or ideas for new metrics..."
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[76px] resize-y"
                      />
                    </div>

                    {/* Priority Level */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Priority Level:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(['low', 'medium', 'high', 'urgent'] as FeedbackPriority[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
                              priority === p
                                ? p === 'urgent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : p === 'high'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-blue-600 text-white shadow-xs'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitMutation.isPending || !title.trim() || !content.trim()}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <span>Submit Feedback &amp; Critique</span>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Browse Ideas Tab */
                  <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={onlyCurrentPage}
                            onChange={(e) => setOnlyCurrentPage(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          Only this page
                        </label>

                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300"
                        >
                          <option value="all">All Categories</option>
                          <option value="suggestion">Suggestions</option>
                          <option value="critique">Critiques</option>
                          <option value="data_accuracy">Data Accuracy</option>
                          <option value="bug">Bugs</option>
                          <option value="general">General</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search suggestions, authors, or critiques..."
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Feedback Items List */}
                    {isLoadingList ? (
                      <div className="py-12 text-center">
                        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Loading suggestions...</p>
                      </div>
                    ) : feedbackList.length === 0 ? (
                      <div className="py-12 text-center p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-2">
                          <LightbulbIcon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No suggestions recorded yet.</p>
                        <p className="text-[11px] text-gray-400 mt-1">Be the first to share an idea or critique for this module!</p>
                        <button
                          onClick={() => setActiveTab('submit')}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition cursor-pointer"
                        >
                          Write Feedback
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {feedbackList.map((item: FeedbackComment) => {
                          const catInfo = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];
                          const CatIconComp = catInfo.icon;
                          const statInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                          const hasUpvoted = Array.isArray(item.upvoters) && item.upvoters.includes(voterId);

                          return (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-4 shadow-xs hover:shadow-md transition-shadow space-y-3"
                            >
                              {/* Top Bar: Category, Status & Upvote */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}>
                                    <CatIconComp className="w-3 h-3" /> {catInfo.label}
                                  </span>

                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${statInfo.bg} ${statInfo.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statInfo.dot}`} />
                                    {statInfo.label}
                                  </span>

                                  {item.rating && (
                                    <div className="flex items-center gap-0.5 text-amber-500">
                                      {[...Array(item.rating)].map((_, i) => (
                                        <StarIcon key={i} className="w-3 h-3" />
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Upvote Button */}
                                <button
                                  onClick={() => upvoteMutation.mutate({ commentId: item.id, voterIdentifier: voterId })}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    hasUpvoted
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                  }`}
                                  title="Upvote / Agree with this suggestion"
                                >
                                  <ArrowUpIcon className="w-3 h-3" />
                                  <span>{item.upvotes_count || 0}</span>
                                </button>
                              </div>

                              {/* Title & Body */}
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">
                                  {item.title}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                  {item.content}
                                </p>
                              </div>

                              {/* Author & Context Bar */}
                              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                    {item.author_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-gray-800 dark:text-gray-200">
                                    {item.author_name}
                                  </span>
                                  {renderRoleBadge(item.author_role)}
                                </div>

                                <span>
                                  {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>

                              {/* Page Context Tag */}
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                                <PinIcon className="w-3 h-3 shrink-0 text-gray-400" />
                                <span className="truncate">{item.page_title}</span>
                              </div>

                              {/* Threaded Replies */}
                              {item.replies && item.replies.length > 0 && (
                                <div className="mt-3 pl-3 border-l-2 border-blue-500/40 space-y-2">
                                  {item.replies.map(rep => (
                                    <div key={rep.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-gray-900 dark:text-white">{rep.author_name}</span>
                                          {renderRoleBadge(rep.author_role)}
                                        </div>
                                        <span className="text-[10px] text-gray-400">
                                          {new Date(rep.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {rep.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reply Input Trigger */}
                              <div className="pt-1">
                                {replyingToId === item.id ? (
                                  <div className="space-y-2 pt-2">
                                    <textarea
                                      rows={2}
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder="Write a response or follow-up suggestion..."
                                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => { setReplyingToId(null); setReplyContent(''); }}
                                        className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleReplySubmit(item.id)}
                                        disabled={!replyContent.trim()}
                                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                                      >
                                        Post Reply
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setReplyingToId(item.id)}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1.5"
                                  >
                                    <ReplyIcon className="w-3.5 h-3.5" />
                                    <span>Reply to this critique</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
