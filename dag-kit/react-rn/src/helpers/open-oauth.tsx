export function openOAuthWindow(
  authUrl: string
): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    // Open popup window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      "OAuth Login",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      reject(new Error("Failed to open popup window"));
      return;
    }

    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) {
        return;
      }

      // Check for OAuth response
      if (event.data.type === "oauth-callback") {
        window.removeEventListener("message", handleMessage);
        popup.close();

        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve({
            code: event.data.code,
            state: event.data.state,
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Check if popup was closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("OAuth popup was closed"));
      }
    }, 1000);
  });
}
