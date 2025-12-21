import React from "react";
import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import type { PrivyClientConfig } from "@privy-io/react-auth";

interface DagAAPrvyProviderProps {
  appId: string;
  children: React.ReactNode;
  config?: PrivyClientConfig;
}

export function DagAAPrivyProvider({
  appId,
  children,
  config = {},
}: DagAAPrvyProviderProps) {
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
      {children}
    </BasePrivyProvider>
  );
}
