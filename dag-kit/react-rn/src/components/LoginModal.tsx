import { useState, useEffect } from "react";
import { useDagKit } from "../context";
import { useOAuthLogin } from "../hooks/useOAuthLogin";
import { useEmailLogin } from "../hooks/useEmailLogin";
import { useAuth } from "../hooks/useAuth";
import type { SocialProvider } from "../types";
import {
  AppleIcon,
  DiscordIcon,
  FacebookIcon,
  GoogleIcon,
  PasskeyIcon,
  SocialButton,
  WalletIcon,
} from "./socialButton";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const { config } = useDagKit();
  const { loginWithOAuth } = useOAuthLogin();
  const { loginWithEmail, signupWithEmail } = useEmailLogin();
  const { isLoading } = useAuth();

  const [mode, setMode] = useState<"social" | "email">("social");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [emailMode, setEmailMode] = useState<"login" | "signup">("login");
  const [isAnimating, setIsAnimating] = useState(false);

  const enabledProviders = config.enabledProviders || ["google", "email"];
  const isDark = config.appearance?.mode === "dark";
  const brandColor = config.appearance?.brandColor || "#6366f1";
  const companyName = "Abstract";

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      await loginWithOAuth(provider);
      onClose();
    } catch (error) {
      console.error("OAuth login failed:", error);
    }
  };

  const handleEmailContinue = () => {
    if (email) {
      setMode("email");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (emailMode === "login") {
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
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-md transform transition-all duration-300 ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`${
              isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            } rounded-2xl shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className="p-6 pb-4 relative">
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex flex-col items-center">
                {config.appearance?.logo ? (
                  <img
                    src={config.appearance.logo}
                    alt="Logo"
                    className="w-12 h-12 mb-4 rounded-full"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full mb-4 flex items-center justify-center text-white font-bold text-xl"
                    style={{
                      background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
                    }}
                  >
                    {companyName[0]}
                  </div>
                )}
                <h2 className="text-2xl font-bold">Sign in</h2>
                <p
                  className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  to continue to {companyName}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {mode === "social" ? (
                <>
                  {/* Email Input */}
                  {enabledProviders.includes("email") && (
                    <div className="mb-4">
                      <div className="relative">
                        <svg
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                            isDark
                              ? "bg-gray-800 border-gray-700 focus:border-blue-500 text-white placeholder-gray-500"
                              : "bg-gray-50 border-gray-200 focus:border-blue-500 placeholder-gray-400"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleEmailContinue()
                          }
                        />
                      </div>
                      <button
                        onClick={handleEmailContinue}
                        disabled={!email || isLoading}
                        className="w-full mt-3 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        style={{ backgroundColor: brandColor }}
                      >
                        {isLoading ? "Loading..." : "Continue"}
                      </button>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center my-6">
                    <div
                      className={`flex-1 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
                    />
                    <span
                      className={`px-4 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Or
                    </span>
                    <div
                      className={`flex-1 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
                    />
                  </div>

                  {/* Social Buttons */}
                  <div className="space-y-3">
                    {/* {enabledProviders.includes("passkey") && (
                      <SocialButton
                        icon={<PasskeyIcon />}
                        label="I have a passkey"
                        onClick={() => {}}
                        isDark={isDark}
                      />
                    )} */}

                    {enabledProviders.includes("google") && (
                      <SocialButton
                        icon={<GoogleIcon />}
                        label="Continue with Google"
                        onClick={() => handleSocialLogin("google")}
                        disabled={isLoading}
                        isDark={isDark}
                      />
                    )}

                    {enabledProviders.includes("apple") && (
                      <SocialButton
                        icon={<AppleIcon />}
                        label="Continue with Apple"
                        onClick={() => handleSocialLogin("apple")}
                        disabled={isLoading}
                        isDark={isDark}
                      />
                    )}

                    {enabledProviders.includes("facebook") && (
                      <SocialButton
                        icon={<FacebookIcon />}
                        label="Continue with Facebook"
                        onClick={() => handleSocialLogin("facebook")}
                        disabled={isLoading}
                        isDark={isDark}
                      />
                    )}

                    {enabledProviders.includes("discord") && (
                      <SocialButton
                        icon={<DiscordIcon />}
                        label="Continue with Discord"
                        onClick={() => handleSocialLogin("discord")}
                        disabled={isLoading}
                        isDark={isDark}
                      />
                    )}
                  </div>

                  {/* Wallet Connect */}
                  <div
                    className={`mt-6 pt-6 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <SocialButton
                      icon={<WalletIcon />}
                      label="Continue with a wallet"
                      onClick={() => {}}
                      isDark={isDark}
                    />
                  </div>
                </>
              ) : (
                /* Email Mode */
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setMode("social")}
                    className={`flex items-center gap-2 text-sm ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back
                  </button>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-gray-100 border-gray-200"
                      }`}
                    />
                  </div>

                  {emailMode === "signup" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Name (optional)
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          isDark
                            ? "bg-gray-800 border-gray-700 focus:border-blue-500 text-white"
                            : "bg-gray-50 border-gray-200 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? "bg-gray-800 border-gray-700 focus:border-blue-500 text-white"
                          : "bg-gray-50 border-gray-200 focus:border-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isLoading
                      ? "Loading..."
                      : emailMode === "login"
                        ? "Sign in"
                        : "Sign up"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setEmailMode(emailMode === "login" ? "signup" : "login")
                      }
                      className="text-sm underline"
                      style={{ color: brandColor }}
                    >
                      {emailMode === "login"
                        ? "Create an account"
                        : "Already have an account?"}
                    </button>
                  </div>
                </form>
              )}

              {/* Footer */}
              <div
                className={`mt-6 pt-6 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
              >
                <p
                  className={`text-xs text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  By signing in, you agree to the{" "}
                  <a
                    href="#"
                    className={`underline ${isDark ? "hover:text-gray-300" : "hover:text-gray-700"}`}
                  >
                    Terms of Service
                  </a>
                </p>
                <p
                  className={`text-xs text-center mt-2 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                >
                  Protected by {companyName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
