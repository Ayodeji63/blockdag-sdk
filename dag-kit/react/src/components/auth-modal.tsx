import React, { useState, useMemo, useCallback } from "react";
import { X, Mail, Loader2, Chrome, ChevronDown, ChevronUp } from "lucide-react";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import {
  AppleIcon,
  BlockDagIcon,
  DiscordIcon,
  FacebookIcon,
  GoogleIcon,
  TwitterIcon,
} from "./icons";
import { useAuth } from "@/providers/auth-provider";
import { Email } from "@/types/turnkey";
import { any, string } from "zod";
import { CardContent } from "./ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./ui/input-otp";
import { LoadingButton } from "./ui/button.loader";
import { toast } from "sonner";
import { customWallet } from "@/config/turnkey";
import { useNavigate } from "react-router-dom";
import { OtpType } from "@turnkey/sdk-react";

export const AuthModal = ({
  isOpen,
  onClose,
  darkMode,
}: {
  isOpen: any;
  onClose: any;
  darkMode: any;
}) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState("");
  const [step, setStep] = useState("login");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { initEmailLogin } = useAuth();
  const [init, setInit] = useState("");
  const navigate = useNavigate();
  const { completeEmailAuth } = useAuth();
  const { httpClient, signUpWithPasskey, completeOtp } = useTurnkey();

  const type = "email";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSixDigits = useMemo(() => code.length === 6, [code]);

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const handleEmailLogin = async () => {
    setLoadingAction("email");
    try {
      const init_ = await initEmailLogin(email);
      setInit(init_);
      setStep("verify");
    } finally {
      setLoadingAction(null);
    }
  };

  const bgColor = darkMode ? "bg-gray-900" : "bg-white";
  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mutedColor = darkMode ? "text-gray-400" : "text-gray-600";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const inputBg = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-300";
  const buttonBg = darkMode
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-blue-600 hover:bg-blue-700";
  const secondaryBg = darkMode
    ? "bg-gray-800 hover:bg-gray-750"
    : "bg-gray-100 hover:bg-gray-200";

  const handleVerify = useCallback(async () => {
    try {
      setSubmitting(true);

      if (type != "email") {
        const res = await httpClient?.proxyVerifyOtp({
          otpId: init,
          otpCode: code,
        });
        if (!res?.verificationToken) {
          toast.error("Verification failed. Please try again.");
          return;
        }

        await signUpWithPasskey({
          createSubOrgParams: {
            customWallet,
            verificationToken: res.verificationToken,
            userEmail: email,
          },
        });
        navigate("/dashboard");
      } else if (type === "email") {
        const params = { otpId: init, code, email };
        await completeEmailAuth(params);
      }
    } catch (err: any) {
      const message: string = err?.message || "Verification error";
      if (message.toLowerCase().includes("invalid otp")) {
        toast.error("Invalid code. Please try again.");
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [init, email, code, httpClient, signUpWithPasskey, navigate]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 lg:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full lg:w-auto lg:min-w-[420px] lg:max-w-md transition-all duration-300 ease-out ${bgColor} shadow-2xl rounded-t-3xl lg:rounded-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div
          className="flex lg:hidden items-center justify-center py-3 cursor-pointer"
          onClick={toggleExpand}
        >
          <div
            className={`w-10 h-1 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 z-10 ${mutedColor} hover:${textColor} transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800`}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {step === "login" ? (
          <div className="px-6 pb-6 lg:px-8 lg:pb-8 lg:pt-6">
            <div className="mb-6 flex justify-center">
              <BlockDagIcon className="h-12 w-12" />
            </div>

            <h2
              className={`mb-6 text-center text-2xl font-semibold ${textColor}`}
            >
              Sign in
            </h2>

            {/* Essential login options - always visible */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Mail
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedColor}`}
                  size={20}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && isValidEmail && handleEmailLogin()
                  }
                  className={`w-full rounded-lg border ${inputBg} ${textColor} py-3 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow`}
                />
              </div>
              <button
                onClick={handleEmailLogin}
                disabled={!isValidEmail || loading}
                className={`w-full rounded-lg ${buttonBg} py-3 text-base font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {loading ? (
                  <Loader2 className="mx-auto animate-spin" size={20} />
                ) : (
                  "Continue"
                )}
              </button>
            </div>

            <div className="relative my-6">
              <div className={`absolute inset-0 flex items-center`}>
                <div className={`w-full border-t ${borderColor}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`${bgColor} ${mutedColor} px-2`}>or</span>
              </div>
            </div>

            <button
              className={`w-full rounded-lg border ${borderColor} ${secondaryBg} py-3 text-base font-semibold ${textColor} transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2`}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Expandable content */}
            {isExpanded && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-4 gap-3">
                  <button
                    className={`rounded-lg border ${borderColor} ${secondaryBg} p-3 transition-all hover:scale-105 active:scale-95 flex items-center justify-center`}
                    aria-label="Sign in with Facebook"
                  >
                    <FacebookIcon />
                  </button>
                  <button
                    className={`rounded-lg border ${borderColor} ${secondaryBg} p-3 transition-all hover:scale-105 active:scale-95 flex items-center justify-center`}
                    aria-label="Sign in with Apple"
                  >
                    <AppleIcon />
                  </button>
                  <button
                    className={`rounded-lg border ${borderColor} ${secondaryBg} p-3 transition-all hover:scale-105 active:scale-95 flex items-center justify-center`}
                    aria-label="Sign in with Discord"
                  >
                    <DiscordIcon />
                  </button>
                  <button
                    className={`rounded-lg border ${borderColor} ${secondaryBg} p-3 transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${textColor}`}
                    aria-label="Sign in with Twitter"
                  >
                    <TwitterIcon />
                  </button>
                </div>

                <div className="relative my-4">
                  <div className={`absolute inset-0 flex items-center`}>
                    <div className={`w-full border-t ${borderColor}`}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className={`${bgColor} ${mutedColor} px-2`}>
                      or connect wallet
                    </span>
                  </div>
                </div>

                <button
                  className={`w-full rounded-lg border ${borderColor} ${secondaryBg} py-3 text-base font-semibold ${textColor} transition-all hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                    WalletConnect
                  </span>
                </button>
                <button
                  className={`w-full rounded-lg border ${borderColor} ${secondaryBg} py-3 text-base font-semibold ${textColor} transition-all hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M7 7h10M7 12h10M7 17h6" />
                    </svg>
                    More wallets
                  </span>
                </button>
              </div>
            )}

            {/* Show more/less button */}
            <button
              onClick={toggleExpand}
              className={`w-full mt-4 py-2 text-sm ${mutedColor} hover:${textColor} transition-colors flex items-center justify-center gap-1`}
            >
              <span>
                {isExpanded ? "Less options" : "More sign in options"}
              </span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <p className={`mt-6 text-center text-xs ${mutedColor}`}>
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-500 hover:underline">
                Terms of Service
              </a>
            </p>
            <p className={`mt-2 text-center text-xs ${mutedColor}`}>
              Protected by <span className="font-semibold">BlockDag SDK</span>
            </p>
          </div>
        ) : (
          <div className="px-6 pb-6 lg:px-8 lg:pb-8 lg:pt-6">
            <button
              onClick={() => setStep("login")}
              className={`mb-6 ${mutedColor} hover:${textColor} transition-colors text-sm flex items-center gap-1`}
            >
              ← Back
            </button>

            <div className="mb-6 flex justify-center">
              <BlockDagIcon className="h-12 w-12" />
            </div>

            <h2
              className={`mb-2 text-center text-2xl font-semibold ${textColor}`}
            >
              Verify your email
            </h2>
            <p className={`mb-8 text-center text-sm ${mutedColor}`}>
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold">{email}</span>
            </p>

            <div className="mb-6">
              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <LoadingButton
                className={`w-full rounded-lg ${buttonBg} py-3 text-base font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50`}
                disabled={!isSixDigits || submitting}
                loading={submitting}
                onClick={handleVerify}
              >
                Verify and continue
              </LoadingButton>
            </div>

            <p className={`text-center text-sm ${mutedColor}`}>
              Didn't receive the code?{" "}
              <button
                className="text-blue-500 hover:underline font-medium"
                onClick={handleEmailLogin}
              >
                Resend
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
