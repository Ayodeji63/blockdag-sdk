import React, { createContext, useContext, useEffect, useState } from "react";
import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { Chain } from "viem";
import { DagAAClient, DagAAConfig } from "@dag-kit/kit";

interface DagAAContextValue {
  client: DagAAClient | null;
  config: Omit<DagAAConfig, "entryPointAddress">;
}

const DagAAContext = createContext<DagAAContextValue | undefined>(undefined);

interface DagAAPrvyProviderProps {
  appId: string;
  children: React.ReactNode;
  config: {
    chain: Chain;
    rpcUrl: string;
    bundlerUrl: string;
    factoryAddress: `0x${string}`;
    paymasterUrl?: string;
  };
  privyConfig?: PrivyClientConfig;
}

export function DagAAProvider({
  appId,
  children,
  config,
  privyConfig = {},
}: DagAAPrvyProviderProps) {
  const [client, setClient] = useState<DagAAClient | null>(null);

  useEffect(() => {
    if (!client) {
      const dagClient = new DagAAClient(config);
      setClient(dagClient);
    }
  }, [config, client]);

  const defaultConfig: PrivyClientConfig = {
    embeddedWallets: {
      ethereum: {
        createOnLogin: "users-without-wallets",
      },
    },
    appearance: {
      theme: "dark",
    },
    loginMethods: ["email", "google", "wallet"],
    ...config,
  };

  return (
    <BasePrivyProvider appId={appId} config={defaultConfig}>
      <DagAAContext.Provider value={{ client, config }}>
        {children}
      </DagAAContext.Provider>
    </BasePrivyProvider>
  );
}

export function useDagAAContext() {
  const context = useContext(DagAAContext);
  if (!context) {
    throw new Error("useDagAAContext must be used within DagAAProvider");
  }

  return context;
}
