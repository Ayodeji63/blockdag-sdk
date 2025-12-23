// src/react/hooks.ts
import { useEffect, useState, useCallback } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { PrivySigner } from "@dag-kit/kit";
import { useDagAAContext } from "../PrivyProvider";
import type { Address } from "viem";

/**
 * Main hook to use DAG AA SDK with Privy
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     smartAccountAddress,
 *     isReady,
 *     sendTransaction,
 *     getBalance,
 *     client
 *   } = useDagAA();
 *
 *   const handleSend = async () => {
 *     await sendTransaction({
 *       target: "0x...",
 *       value: 0n,
 *       data: "0x"
 *     });
 *   };
 *
 *   if (!isReady) return <div>Connecting...</div>;
 *
 *   return <div>Smart Account: {smartAccountAddress}</div>;
 * }
 * ```
 */
export function useDagAA() {
  const { client, config } = useDagAAContext();
  const { wallets } = useWallets();
  const { ready, authenticated } = usePrivy();

  const [smartAccountAddress, setSmartAccountAddress] =
    useState<Address | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [balance, setBalance] = useState<bigint>(0n);

  // Get Privy's embedded wallet
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  // Auto-connect smart account when ready
  useEffect(() => {
    async function connectSmartAccount() {
      if (
        !client ||
        !embeddedWallet ||
        !authenticated ||
        !ready ||
        smartAccountAddress ||
        isConnecting
      ) {
        return;
      }

      setIsConnecting(true);
      setError(null);

      try {
        console.log("🔗 Connecting smart account...");

        // Create Privy signer
        const signer = new PrivySigner(embeddedWallet, config.chain);

        // Connect to smart account
        const address = await client.connectSmartAccount({
          signer,
        });

        setSmartAccountAddress(address);
        console.log("✅ Smart account connected:", address);

        // Get initial balance
        const bal = await client.getBalance();
        setBalance(bal);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        console.error("❌ Failed to connect smart account:", error);
        setError(error);
      } finally {
        setIsConnecting(false);
      }
    }

    connectSmartAccount();
  }, [
    client,
    embeddedWallet,
    authenticated,
    ready,
    smartAccountAddress,
    isConnecting,
    config.chain,
  ]);

  // Helper: Send transaction
  const sendTransaction = useCallback(
    async (params: {
      target: Address;
      value?: bigint;
      data?: `0x${string}`;
    }) => {
      if (!client || !smartAccountAddress) {
        throw new Error("Smart account not connected");
      }

      const hash = await client.sendUserOperation({
        target: params.target,
        value: params.value || 0n,
        data: params.data || "0x",
      });

      // Refresh balance after transaction
      const newBalance = await client.getBalance();
      setBalance(newBalance);

      return hash;
    },
    [client, smartAccountAddress]
  );

  // Helper: Get balance
  const getBalance = useCallback(async () => {
    if (!client) {
      throw new Error("Client not initialized");
    }
    const bal = await client.getBalance();
    setBalance(bal);
    return bal;
  }, [client]);

  // Helper: Write contract
  const writeContract = useCallback(
    async (params: {
      address: Address;
      abi: any[];
      functionName: string;
      args?: any[];
      value?: bigint;
    }) => {
      if (!client) {
        throw new Error("Client not initialized");
      }
      return await client.writeContract(params);
    },
    [client]
  );

  // Helper: Read contract
  const readContract = useCallback(
    async (params: {
      address: Address;
      abi: any[];
      functionName: string;
      args?: any[];
    }) => {
      if (!client) {
        throw new Error("Client not initialized");
      }
      return await client.readContract(params);
    },
    [client]
  );

  return {
    // State
    smartAccountAddress,
    balance,
    isConnecting,
    isReady: ready && authenticated && !!smartAccountAddress,
    error,

    // Core client
    client,

    // Helper methods
    sendTransaction,
    getBalance,
    writeContract,
    readContract,

    // Wallet info
    embeddedWalletAddress: embeddedWallet?.address as Address | undefined,
  };
}

/**
 * Hook to access Privy auth state
 * (Re-exported for convenience)
 */
export { usePrivy, useWallets } from "@privy-io/react-auth";
