import { handleOAuthCallback } from "../helpers/handle-oauth-callback";

export function OAuthCallbackPage() {
  // Call the handler on mount
  if (typeof window !== "undefined") {
    handleOAuthCallback();
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2>Processing login...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
