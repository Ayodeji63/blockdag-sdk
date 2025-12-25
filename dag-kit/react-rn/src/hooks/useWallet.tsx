import { useAuthStore } from "../store";

/**
 *
 * Hook to access wallet information
 */
export function useWallet() {
  const { walletClient, smartAccountAddress, isAuthenticated } = useAuthStore();

  return {
    walletClient,
    address: smartAccountAddress,
    isConnected: isAuthenticated && !!smartAccountAddress,
  };
}
