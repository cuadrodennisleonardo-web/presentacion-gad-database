import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  fetchFeedbackComments, 
  submitFeedbackComment, 
  toggleUpvoteFeedback, 
  updateFeedbackStatus, 
  deleteFeedbackComment,
  type FeedbackFilterOptions,
  type SubmitFeedbackPayload,
  type FeedbackStatus
} from '@/services/feedbackService';

export function useFeedbackList(filters?: FeedbackFilterOptions) {
  return useQuery({
    queryKey: ['feedback_comments', filters],
    queryFn: () => fetchFeedbackComments(filters),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useFeedbackStats() {
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['feedback_comments', { status: 'all', category: 'all' }],
    queryFn: () => fetchFeedbackComments({ status: 'all', category: 'all' }),
  });

  const total = comments.length;
  const pending = comments.filter(c => c.status === 'pending').length;
  const inReview = comments.filter(c => c.status === 'in_review').length;
  const planned = comments.filter(c => c.status === 'planned').length;
  const resolved = comments.filter(c => c.status === 'resolved').length;

  const ratedComments = comments.filter(c => typeof c.rating === 'number' && c.rating > 0);
  const avgRating = ratedComments.length > 0 
    ? (ratedComments.reduce((acc, c) => acc + (c.rating || 0), 0) / ratedComments.length).toFixed(1)
    : '5.0';

  return {
    total,
    pending,
    inReview,
    planned,
    resolved,
    avgRating,
    isLoading
  };
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitFeedbackPayload) => submitFeedbackComment(payload),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['feedback_comments'] });
      if (newItem.parent_id) {
        toast.success("Reply submitted successfully!");
      } else {
        toast.success("Thank you! Your critique / suggestion has been submitted.", { duration: 4000 });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit feedback. Please try again.");
    }
  });
}

export function useToggleUpvote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, voterIdentifier }: { commentId: string; voterIdentifier: string }) => 
      toggleUpvoteFeedback(commentId, voterIdentifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_comments'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update upvote.");
    }
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, status, adminNotes, userId }: { commentId: string; status: FeedbackStatus; adminNotes?: string; userId?: string }) =>
      updateFeedbackStatus(commentId, status, adminNotes, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_comments'] });
      toast.success("Feedback status updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update status.");
    }
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteFeedbackComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback_comments'] });
      toast.success("Feedback comment deleted.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete feedback.");
    }
  });
}
