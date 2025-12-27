import { Address, WalletClient } from "viem";
import { Session, SocialProvider, User } from "../types";
import { TurnkeyClient } from "@turnkey/http";
import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  walletClient: WalletClient | null;
  smartAccountAddress: Address | null;
  turnkeyClient: TurnkeyClient | null;
  _hasHydrated: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setWalletClient: (client: WalletClient | null) => void;
  setSmartAccountAddress: (address: Address | null) => void;
  setTurnkeyClient: (client: TurnkeyClient | null) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (_hasHydrated: boolean) => void;

  login: (provider: SocialProvider) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;

  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      walletClient: null,
      smartAccountAddress: null,
      turnkeyClient: null,
      _hasHydrated: false,

      // Setters
      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),
      setUser: (user) => {
        console.log("Store: Setting user", user?.email);
        set({ user, isAuthenticated: !!user });
      },
      setSession: (session) => {
        console.log("Store: Setting session", session?.userId);
        set({ session });
      },
      setWalletClient: (walletClient: any) => {
        console.log("Store: Setting wallet client", !!walletClient);
        set({ walletClient });
      },
      setSmartAccountAddress: (smartAccountAddress) => {
        console.log("Store: setting smart account", smartAccountAddress);
        set({ smartAccountAddress });
      },
      setTurnkeyClient: (turnkeyClient) => {
        console.log("Store: Setting Turnkey client", !!turnkeyClient);
        set({ turnkeyClient });
      },
      setLoading: (isLoading) => set({ isLoading }),

      // Login method (will be implemented by provider)
      login: async (provider: SocialProvider) => {
        set({ isLoading: true });
        try {
          // This will be overridden by the DagKitProvider
          console.log("Login with", provider);
        } catch (error) {
          console.error("Login error:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Logout
      logout: async () => {
        set({
          isLoading: true,
          user: null,
          session: null,
          isAuthenticated: false,
          walletClient: null,
          smartAccountAddress: null,
        });
        try {
          // Clear session from backend if needed
          const { clear } = get();
          clear();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh session
      refreshSession: async () => {
        const { session } = get();
        if (!session || !session.refreshToken) return;

        try {
          // Call your backend to refresh token
          // Update session with new tokens
          console.log("Refreshing session...");
        } catch (error) {
          console.error("Session refresh error:", error);
          get().logout();
        }
      },

      // Clear all state
      clear: () =>
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          walletClient: null,
          smartAccountAddress: null,
          turnkeyClient: null,
        }),
    }),
    {
      name: "dagkit-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        smartAccountAddress: state.smartAccountAddress,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
