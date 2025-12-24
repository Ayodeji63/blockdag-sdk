// react/src/components/DagLoginButton.tsx
import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { DagLoginModal } from "./DagLoginModal";

export interface DagLoginButtonProps {
  /** Custom button text */
  text?: string;
  /** Button variant */
  variant?: "primary" | "secondary" | "outline";
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Show modal immediately on mount */
  autoOpen?: boolean;
}

export function DagLoginButton({
  text = "Connect Wallet",
  variant = "primary",
  className = "",
  style,
  autoOpen = false,
}: DagLoginButtonProps) {
  const { authenticated, ready } = usePrivy();
  const [showModal, setShowModal] = useState(autoOpen);

  if (!ready) {
    return (
      <button
        className={`dag-button dag-button-loading ${className}`}
        disabled
        style={style}
      >
        <div className="dag-spinner-small"></div>
        Loading...
      </button>
    );
  }

  if (authenticated) {
    return null; // Hide button when authenticated
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`dag-button dag-button-${variant} ${className}`}
        style={style}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="18" y="10" width="4" height="4" rx="1" fill="currentColor" />
        </svg>
        {text}
      </button>

      {showModal && <DagLoginModal onClose={() => setShowModal(false)} />}
      {/* {showModal && <DagLoginModal />} */}
    </>
  );
}
