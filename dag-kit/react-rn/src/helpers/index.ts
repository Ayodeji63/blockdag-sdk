export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export { exchangeOAuthCode } from "./exchange-oauth-code.js";
export { handleOAuthCallback } from "./handle-oauth-callback.js";
export { initiateOAuthFlow } from "./oauth-config.js";
export { openOAuthWindow } from "./open-oauth.js";
