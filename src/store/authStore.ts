import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { AuthUser, UserProfile } from "@/types";
import { supabase } from "@/config/supabase";

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id);
        set({
          session,
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
            profile,
          },
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({ session: null, user: null, isLoading: false, isInitialized: true });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === "SIGNED_IN" && newSession?.user) {
          const profile = await get().fetchProfile(newSession.user.id);
          set({
            session: newSession,
            user: {
              id: newSession.user.id,
              email: newSession.user.email ?? "",
              profile,
            },
          });
        } else if (event === "SIGNED_OUT") {
          set({ session: null, user: null });
        } else if (event === "TOKEN_REFRESHED" && newSession) {
          set({ session: newSession });
        }
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      if (data.user) {
        const profile = await get().fetchProfile(data.user.id);

        // Check if user is active
        if (profile && !profile.is_active) {
          await supabase.auth.signOut();
          set({ isLoading: false });
          return { error: "Your account has been deactivated. Contact your administrator." };
        }

        // Log login event
        await supabase.rpc('log_client_auth_event', {
          event_type: 'LOGIN',
          device_info: { user_agent: navigator.userAgent }
        });

        set({
          session: data.session,
          user: {
            id: data.user.id,
            email: data.user.email ?? "",
            profile,
          },
          isLoading: false,
        });
      }

      return { error: null };
    } catch (error) {
      set({ isLoading: false });
      return { error: "An unexpected error occurred. Please try again." };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    // Log logout event before actually signing out
    await supabase.rpc('log_client_auth_event', {
      event_type: 'LOGOUT',
      device_info: { user_agent: navigator.userAgent }
    });
    await supabase.auth.signOut();
    set({ user: null, session: null, isLoading: false });
  },

  fetchProfile: async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },
}));
