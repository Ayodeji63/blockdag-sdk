import { useDagKit } from "../context";
import { useAuth, useWallet } from "../hooks";
import { useAuthStore } from "../store";

export function DagKitDebugPanel() {
  const { config } = useDagKit();
  const { user, isAuthenticated, session } = useAuth();
  const { address, isConnected, walletClient } = useWallet();
  const { turnkeyClient } = useAuthStore();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: "#1a1a1a",
        color: "#fff",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "400px",
        maxHeight: "80vh",
        overflow: "auto",
        fontSize: "12px",
        fontFamily: "monospace",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        zIndex: 99999,
      }}
    >
      <h3
        style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "bold" }}
      >
        🔍 DAG Kit Debug Panel
      </h3>

      <div style={{ marginBottom: "12px" }}>
        <strong>Config:</strong>
        <pre
          style={{
            background: "#2a2a2a",
            padding: "8px",
            borderRadius: "4px",
            margin: "4px 0",
            overflow: "auto",
          }}
        >
          {JSON.stringify(
            {
              turnkeyOrgId: config.turnkeyOrganizationId,
              turnkeyApiUrl: config.turnkeyApiUrl,
              chain: config.chain?.name,
              rpcUrl: config.rpcUrl,
            },
            null,
            2
          )}
        </pre>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <strong>Authentication:</strong>
        <div style={{ marginTop: "4px" }}>
          <div>
            ✓ Authenticated:{" "}
            <span style={{ color: isAuthenticated ? "#4ade80" : "#f87171" }}>
              {isAuthenticated ? "YES" : "NO"}
            </span>
          </div>
          <div>
            ✓ Has User:{" "}
            <span style={{ color: user ? "#4ade80" : "#f87171" }}>
              {user ? "YES" : "NO"}
            </span>
          </div>
          <div>
            ✓ Has Session:{" "}
            <span style={{ color: session ? "#4ade80" : "#f87171" }}>
              {session ? "YES" : "NO"}
            </span>
          </div>
          <div>
            ✓ Turnkey Client:{" "}
            <span style={{ color: turnkeyClient ? "#4ade80" : "#f87171" }}>
              {turnkeyClient ? "INITIALIZED" : "NOT INITIALIZED"}
            </span>
          </div>
        </div>
      </div>

      {user && (
        <div style={{ marginBottom: "12px" }}>
          <strong>User:</strong>
          <pre
            style={{
              background: "#2a2a2a",
              padding: "8px",
              borderRadius: "4px",
              margin: "4px 0",
              overflow: "auto",
            }}
          >
            {JSON.stringify(
              {
                id: user.id,
                email: user.email,
                name: user.name,
                provider: user.provider,
                walletAddress: user.walletAddress,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {session && (
        <div style={{ marginBottom: "12px" }}>
          <strong>Session:</strong>
          <pre
            style={{
              background: "#2a2a2a",
              padding: "8px",
              borderRadius: "4px",
              margin: "4px 0",
              overflow: "auto",
            }}
          >
            {JSON.stringify(
              {
                userId: session.userId,
                turnkeyOrgId: session.turnkeyOrganizationId,
                turnkeyKeyId: session.turnkeyPrivateKeyId,
                hasAccessToken: !!session.accessToken,
                hasRefreshToken: !!session.refreshToken,
                expiresAt: new Date(session.expiresAt).toLocaleString(),
                isActive: session.isActive,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <strong>Wallet:</strong>
        <div style={{ marginTop: "4px" }}>
          <div>
            ✓ Connected:{" "}
            <span style={{ color: isConnected ? "#4ade80" : "#f87171" }}>
              {isConnected ? "YES" : "NO"}
            </span>
          </div>
          <div>
            ✓ Has Client:{" "}
            <span style={{ color: walletClient ? "#4ade80" : "#f87171" }}>
              {walletClient ? "YES" : "NO"}
            </span>
          </div>
          {address && (
            <div>
              ✓ Address:{" "}
              <span style={{ color: "#4ade80" }}>
                {address.substring(0, 6)}...
                {address.substring(address.length - 4)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: "1px solid #444",
          fontSize: "10px",
          color: "#888",
        }}
      >
        <strong>LocalStorage Keys:</strong>
        <div style={{ marginTop: "4px" }}>
          {Object.keys(localStorage)
            .filter((key) => key.includes("dagkit"))
            .map((key) => (
              <div key={key}>• {key}</div>
            ))}
        </div>
      </div>
    </div>
  );
}
