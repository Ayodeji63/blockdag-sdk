// react/src/components/DagAccountWidget.tsx
import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useDagAA } from "../hooks";

export interface DagAccountWidgetProps {
  /** Show balance */
  showBalance?: boolean;
  /** Show disconnect button */
  showDisconnect?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Pre-built account widget showing smart account info
 *
 * @example
 * ```tsx
 * import { DagAccountWidget } from '@dag-kit/react'
 *
 * function Header() {
 *   return <DagAccountWidget showBalance showDisconnect />
 * }
 * ```
 */
export function DagAccountWidget({
  showBalance = true,
  showDisconnect = true,
  className = "",
  style,
}: DagAccountWidgetProps) {
  const { authenticated, logout, user } = usePrivy();
  const { smartAccountAddress, balance, isReady, isConnecting } = useDagAA();

  if (!authenticated) {
    return null;
  }

  if (isConnecting) {
    return (
      <div
        className={`dag-account-widget dag-account-loading ${className}`}
        style={style}
      >
        <div className="dag-spinner-small"></div>
        <span>Connecting...</span>
      </div>
    );
  }

  if (!isReady || !smartAccountAddress) {
    return null;
  }

  const displayAddress = `${smartAccountAddress.slice(0, 6)}...${smartAccountAddress.slice(-4)}`;
  const displayBalance = showBalance
    ? `${(Number(balance) / 1e18).toFixed(4)} ETH`
    : null;
  const userName = user?.email?.address || user?.google?.email;

  return (
    <div className={`dag-account-widget ${className}`} style={style}>
      <div className="dag-account-info">
        {userName && <div className="dag-account-name">{userName}</div>}
        <div className="dag-account-address">{displayAddress}</div>
        {displayBalance && (
          <div className="dag-account-balance">{displayBalance}</div>
        )}
      </div>

      {showDisconnect && (
        <button onClick={logout} className="dag-disconnect-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
