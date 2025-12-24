// react/src/components/DagTransactionButton.tsx
import React, { useState } from "react";
import { useDagAA } from "../hooks";
import type { Address } from "viem";

export interface DagTransactionButtonProps {
  /** Transaction target address */
  to: Address;
  /** Transaction value in wei */
  value?: bigint;
  /** Transaction data */
  data?: `0x${string}`;
  /** Button text */
  text?: string;
  /** Success callback */
  onSuccess?: (txHash: string) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Pre-built transaction button
 *
 * @example
 * ```tsx
 * import { DagTransactionButton } from '@dag-kit/react'
 *
 * function App() {
 *   return (
 *     <DagTransactionButton
 *       to="0x..."
 *       value={parseEther("0.01")}
 *       text="Send 0.01 ETH"
 *       onSuccess={(hash) => console.log('Tx sent:', hash)}
 *     />
 *   )
 * }
 * ```
 */
export function DagTransactionButton({
  to,
  value = 0n,
  data = "0x",
  text = "Send Transaction",
  onSuccess,
  onError,
  className = "",
  disabled = false,
}: DagTransactionButtonProps) {
  const { sendTransaction, isReady } = useDagAA();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!isReady) return;

    setIsLoading(true);
    try {
      const hash = await sendTransaction({
        target: to,
        value,
        data,
      });

      onSuccess?.(hash);
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("Transaction failed");
      onError?.(err);
      console.error("Transaction failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading || !isReady}
      className={`dag-button dag-button-primary ${className}`}
    >
      {isLoading ? (
        <>
          <div className="dag-spinner-small"></div>
          Sending...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {text}
        </>
      )}
    </button>
  );
}
