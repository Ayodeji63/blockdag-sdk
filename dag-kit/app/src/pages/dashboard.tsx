import React, { useEffect, useState } from "react";
import { UserProfile } from "../components/userProfile";
import {
  useAuth,
  useWallet,
  useDagKit,
  useConnectWallet,
} from "@dag-kit/react-rn";
import { LoginButton } from "../components/LoginButton";
import { WalletConnect } from "../components/walletConnect";
import { SendTransaction } from "../components/sendTransaction";
import { SignMessageExample } from "../components/signMessage";

export function Dashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { address, isConnected } = useWallet();
  const { connect, isConnecting } = useConnectWallet();
  const { openLoginModal } = useDagKit();

  useEffect(() => {
    // Auto-connect wallet after login
    if (isAuthenticated && !isConnected && !isConnecting) {
      connect().catch(console.error);
    }
  }, [isAuthenticated, isConnected, isConnecting, connect]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="landing">
        <h1>Welcome to BlockDAG</h1>
        <p>Connect your wallet to get started</p>
        <button onClick={openLoginModal} className="cta-button">
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>BlockDAG Dashboard</h1>
        <LoginButton />
      </header>

      <div className="dashboard-grid">
        <div className="card">
          <UserProfile />
        </div>

        <div className="card">
          <WalletConnect />
          {isConnected && (
            <div className="wallet-actions">
              <SendTransaction />
              <SignMessageExample />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
