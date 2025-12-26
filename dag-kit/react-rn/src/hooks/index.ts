import { useState } from "react";
import { useDagKit } from "../context";
import { useAuthStore } from "../store";
import { createAccount } from "@turnkey/viem";
import { sepolia } from "viem/chains";
import { createWalletClient, http } from "viem";

/**
 *
 * Hook to access authentication states and methods
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, session } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    session,
  };
}

export { useConnectWallet } from "./useConnectWallet";
export { useEmailLogin } from "./useEmailLogin";
export { useOAuthLogin } from "./useOAuthLogin";
export { useSignMessage } from "./useSignMessage";
export { useWallet } from "./useWallet";
