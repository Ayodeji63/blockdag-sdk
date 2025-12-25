// react/src/DagAAProvider.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { DagAAClient } from "@dag-kit/kit";
import type { DagAAConfig } from "@dag-kit/kit";
import type { Chain } from "viem";

// ==============================================================================
// Context Types
// ==============================================================================

interface DagAAContextValue {
  client: DagAAClient | null;
  config: Omit<DagAAConfig, "entryPointAddress">;
}

const DagAAContext = createContext<DagAAContextValue | undefined>(undefined);

// ==============================================================================
// Provider Props
// ==============================================================================

export interface DagAAProviderProps {
  /** Privy App ID from dashboard.privy.io */
  privyAppId: string;

  /** Blockchain configuration */
  config: {
    chain: Chain;
    rpcUrl: string;
    bundlerUrl: string;
    factoryAddress: `0x${string}`;
    paymasterUrl?: string;
  };

  /** Optional Privy customization (for advanced users) */
  privyConfig?: PrivyClientConfig;

  children: React.ReactNode;
}

// ==============================================================================
// Main Provider Component
// ==============================================================================

/**
 * DagAAProvider - Headless Account Abstraction with Social Login
 *
 * This provider uses Privy ONLY for authentication (invisible).
 * You build your own UI completely from scratch.
 *
 * @example
 * ```tsx
 * import { DagAAProvider } from '@dag-kit/react';
 * import { sepolia } from 'viem/chains';
 *
 * <DagAAProvider
 *   privyAppId="your-app-id"
 *   config={{
 *     chain: sepolia,
 *     rpcUrl: "https://sepolia.infura.io/v3/...",
 *     bundlerUrl: "https://api.pimlico.io/v2/sepolia/rpc?apikey=...",
 *     factoryAddress: "0x...",
 *   }}
 * >
 *   <YourCustomUI />
 * </DagAAProvider>
 * ```
 */
export function DagAAProvider({
  privyAppId,
  config,
  privyConfig = {},
  children,
}: DagAAProviderProps) {
  const [client, setClient] = useState<DagAAClient | null>(null);

  // Initialize DAG AA Client once
  useEffect(() => {
    if (!client) {
      const dagClient = new DagAAClient(config);
      setClient(dagClient);
    }
  }, [config, client]);

  // HEADLESS MODE: Privy runs invisibly in background
  const headlessPrivyConfig: PrivyClientConfig = {
    // Create embedded wallet automatically (invisible to user)
    embeddedWallets: {
      ethereum: {
        createOnLogin: "users-without-wallets",
      },
      showWalletUIs: false, // Don't show Privy prompts
    },

    // Completely hide Privy UI
    appearance: {
      showWalletLoginFirst: false,
      walletList: [], // Hide wallet options in Privy UI
      // No logo, no colors - pure headless
    },

    // Enable login methods (handled by YOUR UI)
    loginMethods: ["email", "google", "wallet", "apple", "twitter"],

    // Override with user config if provided
    ...privyConfig,
  };

  return (
    <PrivyProvider appId={privyAppId} config={headlessPrivyConfig}>
      <DagAAContext.Provider value={{ client, config }}>
        {children}
      </DagAAContext.Provider>
    </PrivyProvider>
  );
}

// ==============================================================================
// Hook to access DAG AA context
// ==============================================================================

export function useDagAAContext() {
  const context = useContext(DagAAContext);
  if (!context) {
    throw new Error("useDagAAContext must be used within DagAAProvider");
  }
  return context;
}
