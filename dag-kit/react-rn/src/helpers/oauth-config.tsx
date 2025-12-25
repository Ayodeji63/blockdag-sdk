import { generateState } from ".";
import { DagKitConfig, SocialProvider } from "../types";

interface OAuthConfig {
  authUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

const OAUTH_CONFIGS: Record<SocialProvider, Partial<OAuthConfig>> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "openid email profile",
    responseType: "code",
  },
  apple: {
    authUrl: "https://appleid.apple.com/auth/authorize",
    scope: "name email",
    responseType: "code id_token",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v12.0/dialog/oauth",
    scope: "email public_profile",
    responseType: "code",
  },
  discord: {
    authUrl: "https://discord.com/api/oauth2/authorize",
    scope: "identify email",
    responseType: "code",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    scope: "tweet.read users.read",
    responseType: "code",
  },
  email: {
    authUrl: "", // Not used for email
    scope: "",
    responseType: "",
  },
};

export async function initiateOAuthFlow(
  provider: SocialProvider,
  config: DagKitConfig
): Promise<string> {
  if (provider == "email") {
    throw new Error("Email provider does not use OAuth flow");
  }

  const providerConfig = OAUTH_CONFIGS[provider];
  if (!providerConfig) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  // Get OAuth credentials from your backend
  const credentialsResponse = await fetch(
    `${config.turnkeyApiUrl}/api/oauth/credentials?provider=${provider}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!credentialsResponse.ok) {
    throw new Error("Failed to get OAuth credentials");
  }

  const { clientId, redirectUri } = await credentialsResponse.json();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: providerConfig.responseType || "code",
    scope: providerConfig.scope || "",
    state: generateState(),
  });

  if (provider === "apple") {
    params.append("response_mode", "form_post");
  }

  const authUrl = `${providerConfig.authUrl}?${params.toString()}`;
  return authUrl;
}
