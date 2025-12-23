import { useEffect, useState, useCallback } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import type { DagAAConfig } from "@dag-kit/kit";
import { DagAAClient } from "@dag-kit/kit/dist/types/clients/actions/main";
import { PrivySigner } from "@dag-kit/kit/src/index";
import type { Address } from "viem";
import { symbol } from "zod";

export function usePrivySigner() {
  const { wallets } = useWallets();
  const { ready, authenticated } = usePrivy();
  const [signer, setSigner] = useState<PrivySigner | null>(null);

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  useEffect(() => {
    if (ready && authenticated && embeddedWallet && !signer) {
      const chain = {
        id: 1,
        name: "Ethereum",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["https://eth.llamarpc.com"] } },
      };
    }

    const newSigner = new PrivySigner(embeddedWallet, chain);
    setSigner(newSigner);
  }, [ready, authenticated, embeddedWallet, signer]);

  return {
    signer,
    isReady: ready && authenticated && !!signer,
    embeddedWallet,
  };
}

/**
 * Hook to use DAG AA Client with Privy
 *
 * Usage:
 * ```tsx
 * const {client, smartAccountAddress, isConnecting, connect} = useDagAA({
 * chain: ***,
 * rpcUrl: "https://..."
 * bundlerUrl: "https://...",
 * factoryAddress: "0x...",
 *
 * })
 * ````
 */

export function useDagAA(config: Omit<DagAAConfig, "entryPointAddress">) {
  const { signer, isReady } = usePrivySigner();
  const [client, setClient] = useState<DagAAClient | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] =
    useState<Address | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize client
  useEffect(() => {
    if (!client) {
      const dagClient = new DagAAClient(config);
      setClient(dagClient);
    }
  }, [config, client]);

  const connect = useCallback(
    async (existingAccountAddress?: Address) => {
      if (!client || !signer || !isReady) {
        throw new Error("Client or signer not ready");
      }

      setIsConnecting(true);
      setError(null);

      try {
        const address = await client.connectSmartAccount({
          signer,
          accountAddress: existingAccountAddress,
        });

        setSmartAccountAddress(address);

        return address;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [client, signer, isReady]
  );

  useEffect(() => {
    if (isReady && client && signer && !smartAccountAddress && !isConnecting) {
      connect().catch(console.error);
    }
  }, [isReady, client, signer, smartAccountAddress, isConnecting, connect]);

  return {
    client,
    smartAccountAddress,
    isConnecting,
    isReady: isReady && !!smartAccountAddress,
    error,
    connect,
    signer,
  };
}
