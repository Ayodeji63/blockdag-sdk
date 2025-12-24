import {
  DagAAProvider,
  DagLoginButton,
  DagAccountWidget,
  DagTransactionButton,
  useAuth,
} from "@dag-kit/react";
import { sepolia } from "viem/chains";

export function App() {
  const { authenticated } = useAuth();

  return (
    <div style={{ padding: "2rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <h1>My dApp</h1>
        {authenticated ? (
          <DagAccountWidget showBalance showDisconnect />
        ) : (
          <DagLoginButton />
        )}
      </header>

      {authenticated && (
        <main>
          <h2>Welcome!</h2>
          <p>You're connected with your DAG Smart Account</p>

          <DagTransactionButton
            to="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            value={0n}
            text="Send Test Transaction"
            onSuccess={(hash) => alert(`Transaction sent: ${hash}`)}
            onError={(error) => alert(`Failed: ${error.message}`)}
          />
        </main>
      )}
    </div>
  );
}
