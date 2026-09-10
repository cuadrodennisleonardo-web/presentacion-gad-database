import { supabase } from "@/config/supabase";

export type FeedbackCategory = 'suggestion' | 'critique' | 'data_accuracy' | 'bug' | 'general';
export type FeedbackStatus = 'pending' | 'in_review' | 'planned' | 'resolved' | 'dismissed';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface FeedbackComment {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  author_name: string;
  author_email?: string | null;
  author_role: string;
  author_department?: string | null;
  page_url: string;
  page_title: string;
  subsector?: string | null;
  category: FeedbackCategory;
  title: string;
  content: string;
  rating?: number | null;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  admin_notes?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  parent_id?: string | null;
  upvotes_count: number;
  upvoters: string[];
  is_public: boolean;
  replies?: FeedbackComment[];
}

export interface SubmitFeedbackPayload {
  user_id?: string | null;
  author_name: string;
  author_email?: string | null;
  author_role: string;
  author_department?: string | null;
  page_url: string;
  page_title: string;
  subsector?: string | null;
  category: FeedbackCategory;
  title: string;
  content: string;
  rating?: number | null;
  priority?: FeedbackPriority;
  parent_id?: string | null;
}

export interface FeedbackFilterOptions {
  pageUrl?: string;
  category?: string;
  status?: string;
  searchQuery?: string;
  onlyCurrentPage?: boolean;
}

/**
 * Fetch all top-level feedback comments with nested replies
 */
export async function fetchFeedbackComments(filters?: FeedbackFilterOptions): Promise<FeedbackComment[]> {
  try {
    let query = supabase
      .from('feedback_comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.pageUrl && filters.onlyCurrentPage) {
      query = query.eq('page_url', filters.pageUrl);
    }
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("feedback_comments table might not exist yet:", error.message);
      return [];
    }

    const allRows = (data || []) as FeedbackComment[];
    
    // Group parent comments and replies
    const topLevel: FeedbackComment[] = [];
    const repliesMap = new Map<string, FeedbackComment[]>();

    allRows.forEach(row => {
      if (row.parent_id) {
        const list = repliesMap.get(row.parent_id) || [];
        list.push(row);
        repliesMap.set(row.parent_id, list);
      } else {
        topLevel.push(row);
      }
    });

    // Attach replies sorted chronologically
    topLevel.forEach(item => {
      const reps = repliesMap.get(item.id) || [];
      item.replies = reps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    // Filter by search query if provided
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      return topLevel.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.author_name.toLowerCase().includes(q) ||
        item.page_title.toLowerCase().includes(q)
      );
    }

    return topLevel;
  } catch (err) {
    console.error("Failed to fetch feedback:", err);
    return [];
  }
}

/**
 * Submit a new feedback comment or critique
 */
export async function submitFeedbackComment(payload: SubmitFeedbackPayload): Promise<FeedbackComment> {
  const { data, error } = await supabase
    .from('feedback_comments')
    .insert([{
      user_id: payload.user_id || null,
      author_name: payload.author_name.trim() || 'Anonymous Reviewer',
      author_email: payload.author_email || null,
      author_role: payload.author_role || 'reviewer',
      author_department: payload.author_department || null,
      page_url: payload.page_url,
      page_title: payload.page_title,
      subsector: payload.subsector || null,
      category: payload.category || 'suggestion',
      title: payload.title.trim(),
      content: payload.content.trim(),
      rating: payload.rating || null,
      priority: payload.priority || 'medium',
      status: 'pending',
      parent_id: payload.parent_id || null,
      upvotes_count: 0,
      upvoters: [],
      is_public: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle upvote on a feedback comment
 */
export async function toggleUpvoteFeedback(commentId: string, voterIdentifier: string): Promise<{ upvotes_count: number; hasUpvoted: boolean }> {
  const { data: item, error: fetchErr } = await supabase
    .from('feedback_comments')
    .select('upvotes_count, upvoters')
    .eq('id', commentId)
    .single();

  if (fetchErr) throw fetchErr;

  const upvoters: string[] = Array.isArray(item.upvoters) ? item.upvoters : [];
  const alreadyUpvoted = upvoters.includes(voterIdentifier);

  let newUpvoters: string[];
  let newCount: number;

  if (alreadyUpvoted) {
    newUpvoters = upvoters.filter(id => id !== voterIdentifier);
    newCount = Math.max(0, (item.upvotes_count || 1) - 1);
  } else {
    newUpvoters = [...upvoters, voterIdentifier];
    newCount = (item.upvotes_count || 0) + 1;
  }

  const { error: updateErr } = await supabase
    .from('feedback_comments')
    .update({
      upvotes_count: newCount,
      upvoters: newUpvoters,
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId);

  if (updateErr) throw updateErr;

  return { upvotes_count: newCount, hasUpvoted: !alreadyUpvoted };
}

/**
 * Update feedback status (for Admins / Superadmins)
 */
export async function updateFeedbackStatus(
  commentId: string, 
  status: FeedbackStatus, 
  adminNotes?: string,
  userId?: string
): Promise<void> {
  const isResolved = status === 'resolved';
  const { error } = await supabase
    .from('feedback_comments')
    .update({
      status,
      admin_notes: adminNotes !== undefined ? adminNotes : undefined,
      resolved_at: isResolved ? new Date().toISOString() : null,
      resolved_by: isResolved ? userId : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId);

  if (error) throw error;
}

/**
 * Delete a feedback comment
 */
export async function deleteFeedbackComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('feedback_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
