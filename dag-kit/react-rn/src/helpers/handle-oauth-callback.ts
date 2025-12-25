export function handleOAuthCallback() {
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    // Send error to parent window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "oauth-callback",
          error: error,
        },
        window.location.origin
      );
    }
    return;
  }

  if (code && state) {
    // Send success to parent window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "oauth-callback",
          code: code,
          state: state,
        },
        window.location.origin
      );
    }
  }
}
