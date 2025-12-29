import { TurnkeyProvider } from "@turnkey/react-wallet-kit";

import { turnkeyConfig } from "@/config/turnkey";

import { AuthProvider } from "./auth-provider";

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <TurnkeyProvider
    config={turnkeyConfig}
    callbacks={{
      onSessionExpired: () => {
        console.log("Session expired. Please log in again.");
        // Optionally, you can redirect the user to the login page or show a modal
      },
    }}
  >
    <AuthProvider> {children}</AuthProvider>
  </TurnkeyProvider>
);
