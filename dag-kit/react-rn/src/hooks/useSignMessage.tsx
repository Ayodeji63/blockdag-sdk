/**
 * Hook to sign messages
 */

import { useState } from "react";
import { useAuthStore } from "../store";

export function useSignMessage() {
  const { walletClient } = useAuthStore();
  const [isSigning, setIsSigning] = useState(false);

  const signMessage = async (message: string) => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }

    setIsSigning(true);
    try {
      const signature = await walletClient.signMessage({
        account: walletClient.account!,
        message,
      });
      return signature;
    } finally {
      setIsSigning(false);
    }
  };

  return { signMessage, isSigning };
}
