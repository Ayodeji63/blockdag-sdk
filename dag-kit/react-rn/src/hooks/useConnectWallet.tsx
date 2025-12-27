import { useState } from "react";
import { useDagKit } from "../context";
import { useAuthStore } from "../store";
import { createAccount } from "@turnkey/viem";
import { sepolia } from "viem/chains";
import { createWalletClient, http } from "viem";

/**
 * hook to connect wallet after authentication
 */
export function useConnectWallet() {
  const {
    turnkeyClient,
    session,
    setWalletClient,
    setSmartAccountAddress,
    _hasHydrated,
  } = useAuthStore();

  const { config } = useDagKit();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    if (!_hasHydrated) {
      throw new Error("Loading session... Please wait.");
    }
    if (!turnkeyClient || !session) {
      throw new Error("Not authnticated. Please login first.");
    }

    setIsConnecting(true);
    try {
      const account = await createAccount({
        client: turnkeyClient,
        organizationId: session.turnkeyOrganizationId,
        signWith: session.turnkeyPrivateKeyId,
      });

      const chain = config.chain || sepolia;
      const rpcUrl = config.rpcUrl || chain.rpcUrls.default.http[0];

      const wallet = createWalletClient({
        account,
        chain,
        transport: http(rpcUrl),
      });

      setWalletClient(wallet);
      setSmartAccountAddress(account.address);

      return account.address;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    connect,
    isConnecting,
    isReady: _hasHydrated && !!session,
  };
}
