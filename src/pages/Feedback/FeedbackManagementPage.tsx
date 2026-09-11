import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRole } from '@/hooks/useRole';
import { 
  useFeedbackList, 
  useFeedbackStats, 
  useUpdateFeedbackStatus, 
  useDeleteFeedback, 
  useToggleUpvote,
  useSubmitFeedback 
} from '@/hooks/queries/useFeedback';
import { 
  type FeedbackCategory, 
  type FeedbackStatus
} from '@/services/feedbackService';
import toast from 'react-hot-toast';

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

const ClockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const StarIcon = ({ filled = true, className = "w-4 h-4" }: { filled?: boolean; className?: string }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={filled ? 0 : 1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const DownloadIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ArrowUpIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const PinIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ReplyIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4" />
  </svg>
);

const ShieldIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
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

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; icon: React.FC<{ className?: string }>; bg: string; text: string; border: string }> = {
  suggestion: { label: 'Suggestion', icon: LightbulbIcon, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' },
  critique: { label: 'Design Critique', icon: PaletteIcon, bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/60' },
  data_accuracy: { label: 'Data Accuracy', icon: ChartBarIcon, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/60' },
  bug: { label: 'Bug Report', icon: BugIcon, bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/60' },
  general: { label: 'General', icon: ChatIcon, bg: 'bg-gray-50 dark:bg-gray-800/60', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  pending: { label: 'Pending Review', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/40' },
  in_review: { label: 'Under Consideration', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800/40' },
  planned: { label: 'Planned / In Progress', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800/40' },
  resolved: { label: 'Implemented / Resolved', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/40' },
  dismissed: { label: 'Closed', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400', border: 'border-gray-200 dark:border-gray-700' },
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

export default function FeedbackManagementPage() {
  const { user } = useAuthStore();
  const { isSuperAdmin } = useRole();

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'upvotes' | 'rating'>('recent');

  // Response state per comment
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingAdminNotesId, setEditingAdminNotesId] = useState<string | null>(null);
  const [adminNotesText, setAdminNotesText] = useState('');

  // Queries & Mutations
  const stats = useFeedbackStats();
  const { data: comments = [], isLoading } = useFeedbackList({
    category: selectedCategory,
    status: selectedStatus,
    searchQuery,
  });

  const updateStatusMutation = useUpdateFeedbackStatus();
  const deleteMutation = useDeleteFeedback();
  const upvoteMutation = useToggleUpvote();
  const submitMutation = useSubmitFeedback();

  const voterId = user?.id || `anon_${localStorage.getItem('anon_voter_id') || 'guest'}`;

  // Sorted comments
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (sortBy === 'upvotes') {
        return (b.upvotes_count || 0) - (a.upvotes_count || 0);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [comments, sortBy]);

  const handleStatusChange = async (commentId: string, newStatus: FeedbackStatus) => {
    await updateStatusMutation.mutateAsync({
      commentId,
      status: newStatus,
      userId: user?.id,
    });
  };

  const handleSaveAdminNotes = async (commentId: string, currentStatus: FeedbackStatus) => {
    await updateStatusMutation.mutateAsync({
      commentId,
      status: currentStatus,
      adminNotes: adminNotesText,
      userId: user?.id,
    });
    setEditingAdminNotesId(null);
    setAdminNotesText('');
  };

  const handlePostReply = async (parentId: string, parentPageUrl: string, parentPageTitle: string) => {
    if (!replyText.trim()) return;

    await submitMutation.mutateAsync({
      user_id: user?.id || null,
      author_name: user?.profile?.full_name || user?.email?.split('@')[0] || 'Admin',
      author_email: user?.email || null,
      author_role: user?.profile?.role || (isSuperAdmin ? 'superadmin' : 'dept_admin'),
      author_department: user?.profile?.department || 'Administration',
      page_url: parentPageUrl,
      page_title: parentPageTitle,
      category: 'general',
      title: 'Response / Feedback Reply',
      content: replyText.trim(),
      parent_id: parentId,
    });

    setReplyText('');
    setReplyingId(null);
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this feedback item and all its replies?")) {
      await deleteMutation.mutateAsync(commentId);
    }
  };

  const handleExportCSV = () => {
    if (comments.length === 0) {
      toast.error("No feedback records to export.");
      return;
    }

    const headers = ['ID', 'Date', 'Author Name', 'Author Role', 'Department', 'Page Title', 'Page URL', 'Category', 'Priority', 'Rating', 'Title', 'Content', 'Status', 'Admin Notes', 'Upvotes'];
    const rows = comments.map(c => [
      `"${c.id}"`,
      `"${new Date(c.created_at).toISOString()}"`,
      `"${(c.author_name || '').replace(/"/g, '""')}"`,
      `"${(c.author_role || '').replace(/"/g, '""')}"`,
      `"${(c.author_department || '').replace(/"/g, '""')}"`,
      `"${(c.page_title || '').replace(/"/g, '""')}"`,
      `"${(c.page_url || '').replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.priority}"`,
      `"${c.rating || ''}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.content || '').replace(/"/g, '""')}"`,
      `"${c.status}"`,
      `"${(c.admin_notes || '').replace(/"/g, '""')}"`,
      `"${c.upvotes_count || 0}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `presentacion_gad_feedback_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Feedback exported as CSV!");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ChatIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Feedback, Critiques &amp; Suggestions Hub
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review stakeholder suggestions, UI/UX critiques, data accuracy observations, and user ideas across all municipal modules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-xs transition cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold">
            <ChatIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Entries</span>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.total}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-bold">
            <ClockIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Review</span>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.pending}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg font-bold">
            <TrendingUpIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">In Consideration</span>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.inReview + stats.planned}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Implemented</span>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.resolved}</div>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center text-lg font-bold">
            <StarIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Avg Satisfaction</span>
            <div className="text-xl font-black text-gray-900 dark:text-white">{stats.avgRating} <span className="text-xs text-gray-400 font-normal">/ 5</span></div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, suggestion keyword, reviewer name, or page..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <svg className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort By & Category Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="suggestion">Suggestions</option>
              <option value="critique">Critiques</option>
              <option value="data_accuracy">Data Accuracy</option>
              <option value="bug">Bug Reports</option>
              <option value="general">General</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="in_review">Under Consideration</option>
              <option value="planned">Planned / In Progress</option>
              <option value="resolved">Implemented</option>
              <option value="dismissed">Closed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="upvotes">Most Upvoted</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
        </div>

        {/* Category Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-bold text-gray-400 mr-1">Filter Type:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cat]) => {
            const CatIconComp = cat.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                <CatIconComp className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Feedback List */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-gray-400">Loading feedback submissions...</p>
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
            <LightbulbIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No feedback items match your filter criteria.</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Try resetting your filters or submit a new critique using the floating widget on the bottom right.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((item) => {
            const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.suggestion;
            const CatIconComp = cat.icon;
            const stat = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const hasUpvoted = Array.isArray(item.upvoters) && item.upvoters.includes(voterId);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header: User & Role Identification + Category + Upvotes */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-gray-800/80 pb-3.5">
                  {/* Author Details */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {item.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                          {item.author_name}
                        </span>
                        {renderRoleBadge(item.author_role)}
                        {item.author_department && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            • {item.author_department}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                        <span>Submitted on {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold truncate max-w-xs">
                          <PinIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.page_title}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Upvote */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Upvote Button */}
                    <button
                      onClick={() => upvoteMutation.mutate({ commentId: item.id, voterIdentifier: voterId })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        hasUpvoted
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'
                      }`}
                      title="Upvote / Support this item"
                    >
                      <ArrowUpIcon className="w-3.5 h-3.5" />
                      <span>{item.upvotes_count || 0} Upvotes</span>
                    </button>

                    {/* Delete (if admin or author) */}
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete feedback"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges Bar: Category, Priority, Rating, Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${cat.bg} ${cat.text} ${cat.border}`}>
                    <CatIconComp className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </span>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    item.priority === 'urgent'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      : item.priority === 'high'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    Priority: {item.priority}
                  </span>

                  {item.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <div className="flex items-center gap-0.5">
                        {[...Array(item.rating)].map((_, i) => (
                          <StarIcon key={i} className="w-3.5 h-3.5" />
                        ))}
                      </div>
                      <span className="text-gray-400 text-[10px] font-normal ml-1">({item.rating}/5)</span>
                    </div>
                  )}

                  {/* Status Dropdown / Badge */}
                  <div className="ml-auto">
                    {isSuperAdmin ? (
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${stat.bg} ${stat.text} ${stat.border} cursor-pointer focus:outline-none`}
                      >
                        <option value="pending">Pending Review</option>
                        <option value="in_review">Under Consideration</option>
                        <option value="planned">Planned / In Progress</option>
                        <option value="resolved">Implemented / Resolved</option>
                        <option value="dismissed">Closed</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${stat.bg} ${stat.text} ${stat.border}`}>
                        <span className={`w-2 h-2 rounded-full ${stat.dot}`} />
                        {stat.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Content */}
                <div className="space-y-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-gray-50/60 dark:bg-gray-900/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    {item.content}
                  </p>
                </div>

                {/* Admin Notes Box */}
                {(item.admin_notes || editingAdminNotesId === item.id) && (
                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <ShieldIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Admin Action Notes &amp; Status Memo</span>
                      </span>
                      {isSuperAdmin && editingAdminNotesId !== item.id && (
                        <button
                          onClick={() => {
                            setEditingAdminNotesId(item.id);
                            setAdminNotesText(item.admin_notes || '');
                          }}
                          className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                        >
                          Edit Memo
                        </button>
                      )}
                    </div>

                    {editingAdminNotesId === item.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={adminNotesText}
                          onChange={(e) => setAdminNotesText(e.target.value)}
                          placeholder="Add administrative resolution note or status update for this suggestion..."
                          className="w-full rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditingAdminNotesId(null); setAdminNotesText(''); }}
                            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveAdminNotes(item.id, item.status)}
                            className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer"
                          >
                            Save Memo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-purple-800 dark:text-purple-300 leading-relaxed whitespace-pre-line">
                        {item.admin_notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Add Memo button if admin and no note exists */}
                {isSuperAdmin && !item.admin_notes && editingAdminNotesId !== item.id && (
                  <div>
                    <button
                      onClick={() => {
                        setEditingAdminNotesId(item.id);
                        setAdminNotesText('');
                      }}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>+</span> Add Admin Memo / Resolution Note
                    </button>
                  </div>
                )}

                {/* Threaded Discussion Replies */}
                {item.replies && item.replies.length > 0 && (
                  <div className="pl-4 border-l-2 border-indigo-500/40 space-y-2.5 mt-3">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Replies &amp; Discussion ({item.replies.length})
                    </h5>
                    {item.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {rep.author_name}
                            </span>
                            {renderRoleBadge(rep.author_role)}
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(rep.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {rep.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="pt-2">
                  {replyingId === item.id ? (
                    <div className="space-y-2 p-3 rounded-xl bg-blue-50/40 dark:bg-gray-800 border border-blue-100 dark:border-gray-750">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                        <span>Replying to {item.author_name}'s critique:</span>
                      </div>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your response, clarification, or follow-up note..."
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 p-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setReplyingId(null); setReplyText(''); }}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePostReply(item.id, item.page_url, item.page_title)}
                          disabled={!replyText.trim() || submitMutation.isPending}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                        >
                          {submitMutation.isPending ? 'Posting...' : 'Post Reply'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingId(item.id)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <ReplyIcon className="w-3.5 h-3.5" />
                      <span>Reply to this critique / thread</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
