import { useState } from "react";
import { useDagKit } from "../context";
import { useEmailLogin } from "../hooks/useEmailLogin";
import { useOAuthLogin } from "../hooks/useOAuthLogin";
import { useAuth } from "../hooks";
import { SocialProvider } from "../types";
import { AppleIcon, DiscordIcon, GoogleIcon } from "./Icons";
import "./login-modal.css";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const { config } = useDagKit();
  const { loginWithOAuth } = useOAuthLogin();
  const { loginWithEmail, signupWithEmail } = useEmailLogin();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { isLoading } = useAuth();

  const enabledProviders = config.enabledProviders || ["google", "email"];
  const isDark = config.appearance?.mode === "dark";

  const handleOAuthLogin = async (provider: SocialProvider) => {
    try {
      await loginWithOAuth(provider);
      onClose();
    } catch (error) {
      console.error("OAuth login failed:", error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name);
      }
      onClose();
    } catch (error) {
      console.error("Email auth failed:", error);
    }
  };

  return (
    <div className="dagkit-modal-overlay" onClick={onClose}>
      <div
        className={`dagkit-modal ${isDark ? "dark" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dagkit-modal-header">
          {config.appearance?.logo && (
            <img
              src={config.appearance.logo}
              alt="Logo"
              className="dagkit-logo"
            />
          )}
          <h2>{mode === "login" ? "Sign In" : "Sign Up"}</h2>
          <button className="dagkit-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Social Login Buttons */}
        <div className="dagkit-social-buttons">
          {enabledProviders.includes("google") && (
            <button
              className="dagkit-social-btn dagkit-google-btn"
              onClick={() => handleOAuthLogin("google")}
              disabled={isLoading}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          )}

          {enabledProviders.includes("apple") && (
            <button
              className="dagkit-social-btn dagkit-apple-btn"
              onClick={() => handleOAuthLogin("apple")}
              disabled={isLoading}
            >
              <AppleIcon />
              Continue with Apple
            </button>
          )}

          {enabledProviders.includes("discord") && (
            <button
              className="dagkit-social-btn dagkit-discord-btn"
              onClick={() => handleOAuthLogin("discord")}
              disabled={isLoading}
            >
              <DiscordIcon />
              Continue with Discord
            </button>
          )}
        </div>

        {/* Divider */}
        {enabledProviders.includes("email") && (
          <>
            <div className="dagkit-divider">
              <span>or</span>
            </div>

            {/* Email Form */}
            <form className="dagkit-email-form" onSubmit={handleEmailSubmit}>
              {mode === "signup" && (
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="dagkit-input"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="dagkit-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dagkit-input"
              />
              <button
                type="submit"
                className="dagkit-submit-btn"
                disabled={isLoading}
                style={{ backgroundColor: config.appearance?.brandColor }}
              >
                {isLoading
                  ? "Loading..."
                  : mode === "login"
                    ? "Sign In"
                    : "Sign Up"}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="dagkit-toggle-mode">
              {mode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button onClick={() => setMode("signup")}>Sign Up</button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button onClick={() => setMode("login")}>Sign In</button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
