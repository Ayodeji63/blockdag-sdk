import { Address, WalletClient } from "viem";
import { Session, SocialProvider, User } from "../types";
import { TurnkeyClient } from "@turnkey/http";
import { Wallet } from "@privy-io/react-auth";
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

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setWalletClient: (client: WalletClient | null) => void;
  setSmartAccountAddress: (address: Address | null) => void;
  setTurnkeyClient: (client: TurnkeyClient | null) => void;
  setLoading: (loading: boolean) => void;

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

      // Setters
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setWalletClient: (walletClient: any) => set({ walletClient }),
      setSmartAccountAddress: (smartAccountAddress) =>
        set({ smartAccountAddress }),
      setTurnkeyClient: (turnkeyClient) => set({ turnkeyClient }),
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
        set({ isLoading: true });
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
    }
  )
);
