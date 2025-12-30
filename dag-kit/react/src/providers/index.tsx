import {
  TurnkeyProvider,
  TurnkeyProviderConfig,
} from "@turnkey/react-wallet-kit";
// import { turnkeyConfig } from "@/config/turnkey";
import { AuthProvider } from "./auth-provider";
import { DagClientProvider } from "./dag-provider";

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const turnkeyConfig: TurnkeyProviderConfig = {
    organizationId: import.meta.env.VITE_PUBLIC_ORGANIZATION_ID!,
    authProxyConfigId: import.meta.env.VITE_PUBLIC_AUTH_PROXY_ID!,
  };

  console.log("Turnkey Config Provider:", turnkeyConfig);

  return (
    <TurnkeyProvider
      config={turnkeyConfig}
      callbacks={{
        onSessionExpired: () => {
          console.log("Session expired. Please log in again.");
        },
        onError: (error) => {
          console.error("❌ Turnkey Provider Error:", error);
        },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </TurnkeyProvider>
  );
};
