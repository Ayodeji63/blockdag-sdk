import { useEffect, useState } from "react";
import { useDagKit } from "../context";
import { useEmailLogin } from "../hooks/useEmailLogin";
import { useOAuthLogin } from "../hooks/useOAuthLogin";
import { useAuth } from "../hooks";
import { Session, SocialProvider, User } from "../types";
import { AppleIcon, DiscordIcon, GoogleIcon } from "./Icons";
import { useAuthStore } from "../store";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";

function LoginModal({ onClose }: { onClose: () => void }) {
  const { config } = useDagKit();
  const { setUser, setSession, setLoading, setTurnkeyClient } = useAuthStore();
  const [mode, setMode] = useState<"email" | "social">("social");
  const [email, setEmail] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const { isLoading } = useAuth();

  const enabledProviders = config.enabledProviders || ["google", "email"];
  const isDark = config.appearance?.mode === "dark";
  const brandColor = config.appearance?.brandColor || "#6366f1";
  const companyName = "BlockDAG";

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const handleSocialLogin = async (provider: SocialProvider) => {
    setLoading(true);
    try {
      console.log("🔐 Starting OAuth login:", provider);

      // Step 1: Get OAuth credentials
      const credsRes = await fetch(
        `${config.turnkeyApiUrl}/api/oauth/credentials?provider=${provider}`
      );
      const creds = await credsRes.json();

      // Step 2: Build OAuth URL
      const params = new URLSearchParams({
        client_id: creds.clientId,
        redirect_uri: creds.redirectUri,
        response_type: "code",
        scope: provider === "google" ? "openid email profile" : "email profile",
        state: crypto.randomUUID(),
      });

      const authUrl =
        provider === "google"
          ? `https://accounts.google.com/o/oauth2/v2/auth?${params}`
          : ``;

      // Step 3: Open popup
      const popup = window.open(authUrl, "OAuth", "width=500,height=600");

      // Step 4: Listen for callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === "oauth-callback" && event.data.code) {
          window.removeEventListener("message", handleMessage);
          popup?.close();

          // Step 5: Exchange code
          const res = await fetch(
            `${config.turnkeyApiUrl}/api/oauth/exchange`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: event.data.code, provider }),
            }
          );

          const data = await res.json();

          // Step 6: Store user and session in Zustand
          const user: User = {
            id: data.userId,
            email: data.email,
            name: data.name,
            picture: data.picture,
            provider,
            walletAddress: data.walletAddress,
            subOrganizationId: data.turnkeyOrganizationId,
            privateKeyId: data.turnkeyPrivateKeyId,
            createdAt: Date.now(),
          };

          const session: Session = {
            userId: data.userId,
            turnkeyOrganizationId: data.turnkeyOrganizationId,
            turnkeyPrivateKeyId: data.turnkeyPrivateKeyId,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: Date.now() + data.expiresIn * 1000,
            isActive: true,
          };

          setUser(user);
          setSession(session);

          // Initialize Turnkey client for this user
          const stamper = new ApiKeyStamper({
            apiPublicKey: data.accessToken,
            apiPrivateKey: data.turnkeyPrivateKeyId,
          });

          const client = new TurnkeyClient(
            { baseUrl: config.turnkeyApiUrl! },
            stamper
          );

          setTurnkeyClient(client);

          console.log("✅ Login successful!");
          onClose();
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (error) {
      console.error("❌ Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailContinue = () => {
    if (email) {
      setMode("email");
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
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                    className="w-12 h-12 mb-4"
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className={`w-full px-4 py-3 rounded-lg border ${
                            isDark
                              ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                              : "bg-gray-50 border-gray-200 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleEmailContinue()
                          }
                        />
                      </div>
                      <button
                        onClick={handleEmailContinue}
                        disabled={!email || isLoading}
                        className="w-full mt-3 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: brandColor }}
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                    <span className="px-4 text-sm text-gray-500">Or</span>
                    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                  </div>

                  {/* Wallet Connect */}
                  <button
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium border-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                      isDark
                        ? "border-gray-700 hover:bg-gray-800"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                        strokeWidth="2"
                      />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" />
                    </svg>
                    Continue with a wallet
                  </button>
                </>
              ) : (
                /* Email Mode - Show OTP or Password */
                <div className="space-y-4">
                  <button
                    onClick={() => setMode("social")}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                          ? "bg-gray-800 border-gray-700"
                          : "bg-gray-100 border-gray-200"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDark
                          ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                          : "bg-gray-50 border-gray-200 focus:border-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                    />
                  </div>

                  <button
                    className="w-full py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: brandColor }}
                  >
                    Sign in
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-center text-gray-500">
                  By signing in, you agree to the{" "}
                  <a
                    href="#"
                    className="underline hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Terms of Service
                  </a>
                </p>
                <p className="text-xs text-center text-gray-400 mt-2">
                  Protected by {companyName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style> */}
    </>
  );
}
