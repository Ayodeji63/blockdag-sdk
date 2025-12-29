import { TurnkeyProviderConfig } from "@turnkey/react-wallet-kit";

import { env } from "@/env";

const {
  VITE_PUBLIC_ORGANIZATION_ID,
  VITE_PUBLIC_BASE_URL,
  VITE_PUBLIC_AUTH_PROXY_URL,
  VITE_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  VITE_PUBLIC_APPLE_OAUTH_CLIENT_ID,
  VITE_PUBLIC_FACEBOOK_CLIENT_ID,
  VITE_PUBLIC_AUTH_PROXY_ID,
  VITE_PUBLIC_APP_URL,
} = env;

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

export const turnkeyConfig: TurnkeyProviderConfig = {
  organizationId: VITE_PUBLIC_ORGANIZATION_ID,
  authProxyConfigId: VITE_PUBLIC_AUTH_PROXY_ID,
  authProxyUrl: VITE_PUBLIC_AUTH_PROXY_URL,
  apiBaseUrl: VITE_PUBLIC_BASE_URL,
  auth: {
    autoRefreshSession: true,
    oauthConfig: {
      oauthRedirectUri: VITE_PUBLIC_APP_URL,
      googleClientId: VITE_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      appleClientId: VITE_PUBLIC_APPLE_OAUTH_CLIENT_ID,
      facebookClientId: VITE_PUBLIC_FACEBOOK_CLIENT_ID,
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
