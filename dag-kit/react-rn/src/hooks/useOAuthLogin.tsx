/**
 * Hook to handlw OAuth login
 */

import { useState } from "react";
import { useDagKit } from "../context";
import { useAuthStore } from "../store";
import { SocialProvider } from "../types";
import { initiateOAuthFlow } from "../helpers/oauth-config";
import { openOAuthWindow } from "../helpers/open-oauth";
import { exchangeOAuthCode } from "../helpers/exchange-oauth-code";

export function useOAuthLogin() {
  const { config } = useDagKit();
  const { setUser, setSession, setLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const loginWithOAuth = async (provider: SocialProvider) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Initiate OAuth flow
      const authUrl = await initiateOAuthFlow(provider, config);

      // Step 2: Open OAuth pop or redirect
      const result = await openOAuthWindow(authUrl);

      // Step 3: Exchange code for tokens
      const { user, session } = await exchangeOAuthCode(result.code, provider);

      // Step 4: Store user and session
      setUser(user);
      setSession(session);

      return { user, session };
    } catch (error: any) {
      setError(error.message || "OAuth login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loginWithOAuth,
    error,
  };
}
