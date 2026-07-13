import { useAuthStore } from "@/store/authStore";

/**
 * Hook to access authentication state and actions.
 * Convenience wrapper around the Zustand auth store.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const initialize = useAuthStore((state) => state.initialize);

  return {
    user,
    session,
    isLoading,
    isInitialized,
    isAuthenticated: !!session && !!user,
    signIn,
    signOut,
    initialize,
  };
}
