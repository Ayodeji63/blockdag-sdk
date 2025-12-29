import { TurnkeyProviderConfig } from "@turnkey/react-wallet-kit";

import { env } from "@/env";

// const {
//   import.meta.env.VITE_PUBLIC_ORGANIZATION_ID,
//   import.meta.env.VITE_PUBLIC_BASE_URL,
//   import.meta.env.VITE_PUBLIC_AUTH_PROXY_URL,
//   import.meta.env.VITE_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
//   import.meta.env.VITE_PUBLIC_APPLE_OAUTH_CLIENT_ID,
//   import.meta.env.VITE_PUBLIC_FACEBOOK_CLIENT_ID,
//   import.meta.env.VITE_PUBLIC_AUTH_PROXY_ID,
//   import.meta.env.VITE_PUBLIC_APP_URL,
// } = env;

export const customWallet = {
  walletName: "Default Wallet",
  walletAccounts: [
    {
      curve: "CURVE_SECP256K1" as const,
      pathFormat: "PATH_FORMAT_BIP32" as const,
      path: `m/44'/60'/0'/0/0`,
      addressFormat: "ADDRESS_FORMAT_ETHEREUM" as const,
    },
  ],
};

const orgId = import.meta.env.VITE_PUBLIC_ORGANIZATION_ID;
console.log("Using Turnkey Organization ID:", orgId);

if (!orgId) {
  console.warn(
    "Warning: VITE_PUBLIC_ORGANIZATION_ID is not set. Please set it in your environment variables."
  );
}

export const turnkeyConfig: TurnkeyProviderConfig = {
  organizationId: import.meta.env.VITE_PUBLIC_ORGANIZATION_ID,

  authProxyConfigId: import.meta.env.VITE_PUBLIC_AUTH_PROXY_ID,
  authProxyUrl: import.meta.env.VITE_PUBLIC_AUTH_PROXY_URL,
  apiBaseUrl: import.meta.env.VITE_PUBLIC_BASE_URL,
  auth: {
    autoRefreshSession: true,
    oauthConfig: {
      oauthRedirectUri: "https://auth.turnkey.com/oauth/callback",
      googleClientId: import.meta.env.VITE_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      appleClientId: import.meta.env.VITE_PUBLIC_APPLE_OAUTH_CLIENT_ID,
      facebookClientId: import.meta.env.VITE_PUBLIC_FACEBOOK_CLIENT_ID,
    },
    createSuborgParams: {
      passkeyAuth: {
        userName: "Passkey User",
        passkeyName: "Default Passkey",
        customWallet,
      },
      emailOtpAuth: {
        userName: "Email User",
        customWallet,
      },
      oauth: {
        userName: "OAuth User",
        customWallet,
      },
    },
  },

  // ui: {
  //   darkMode: true,
  //   borderRadius: "12px",
  //   renderModalInProvider: false,
  // },
};
