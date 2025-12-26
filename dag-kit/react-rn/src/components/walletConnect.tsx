import React from "react";
import { useAuth } from "../hooks";
import { useWallet } from "../hooks/useWallet";
import { useConnectWallet } from "../hooks/useConnectWallet";

export function WalletConnect() {
  const { isAuthenticated } = useAuth();
  const { address, isConnected } = useWallet();
  const { connect, isConnecting } = useConnectWallet();

  if (!isAuthenticated) {
    return <div>Please login first</div>;
  }

  if (isConnected && address) {
    return (
      <div className="wallet-info">
        <p>
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
    );
  }

  return (
    <button onClick={connect} disabled={isConnecting}>
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
