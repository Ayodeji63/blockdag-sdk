// react/src/components/DagLoginModal.tsx
import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

export interface DagLoginModalProps {
  onClose: () => void;
}

/**
 * Pre-built login modal with multiple auth options
 */
export function DagLoginModal({ onClose }: DagLoginModalProps) {
  const { login } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");

  const handleLogin = async (
    method?: "google" | "apple" | "twitter" | "wallet"
  ) => {
    setIsLoading(true);
    try {
      if (method) {
        login();
      } else {
        login();
      }
      onClose();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await handleLogin();
  };

  return (
    <div className="dag-modal-overlay" onClick={onClose}>
      <div className="dag-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dag-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="dag-modal-header">
          <h2>Connect to DAG</h2>
          <p>Choose your preferred login method</p>
        </div>

        <div className="dag-modal-content">
          {!showEmailInput ? (
            <div className="dag-login-options">
              <button
                onClick={() => setShowEmailInput(true)}
                className="dag-login-option"
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <polyline
                    points="22,6 12,13 2,6"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <span>Continue with Email</span>
              </button>

              <button
                onClick={() => handleLogin("google")}
                className="dag-login-option dag-login-google"
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                onClick={() => handleLogin("apple")}
                className="dag-login-option dag-login-apple"
                disabled={isLoading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span>Continue with Apple</span>
              </button>

              <button
                onClick={() => handleLogin("wallet")}
                className="dag-login-option dag-login-wallet"
                disabled={isLoading}
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
                  <rect
                    x="18"
                    y="10"
                    width="4"
                    height="4"
                    rx="1"
                    fill="currentColor"
                  />
                </svg>
                <span>Connect Wallet</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="dag-email-form">
              <button
                type="button"
                onClick={() => setShowEmailInput(false)}
                className="dag-back-button"
              >
                ← Back
              </button>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dag-input"
                autoFocus
                required
              />

              <button
                type="submit"
                className="dag-button dag-button-primary"
                disabled={!email || isLoading}
              >
                {isLoading ? "Sending..." : "Continue"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
