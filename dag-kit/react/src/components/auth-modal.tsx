import React, { useState, useMemo, useCallback } from "react";
import { X, Mail, Loader2, Chrome } from "lucide-react";
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
      // await initEmailLogin(email);

      const init_ = await initEmailLogin(email);
      setInit(init_);
      // if (init) {
      // navigate(
      //   `/verify-email?id=${encodeURIComponent(init)}&email=${encodeURIComponent(
      //     email
      //   )}&type=email`
      // );
      setStep("verify");

      // }
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
        console.log("Completing OTP for email type");
        // const complete = await completeOtp({
        //   otpId,
        //   otpCode: code,
        //   contact: email,
        //   otpType: OtpType.Email,
        //   createSubOrgParams: {
        //     customWallet,
        //     userEmail: email,
        //   },
        // });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`relative w-full max-w-md rounded-2xl ${bgColor} shadow-2xl`}
      >
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 ${mutedColor} hover:${textColor} transition-colors`}
        >
          <X size={20} />
        </button>

        {step === "login" ? (
          <div className="p-8">
            <div className="mb-6 flex justify-center">
              <BlockDagIcon className="h-12 w-12" />
            </div>

            <h2
              className={`mb-8 text-center text-2xl font-semibold ${textColor}`}
            >
              Sign in
            </h2>

            <div className="mb-6">
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
                  onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                  className={`w-full rounded-lg border ${inputBg} ${textColor} py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <button
                onClick={handleEmailLogin}
                disabled={!isValidEmail || loading}
                className={`mt-4 w-full rounded-lg ${buttonBg} py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
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
              className={`mb-3 w-full rounded-lg border ${borderColor} ${secondaryBg} py-3 font-semibold ${textColor} transition-colors flex items-center justify-center gap-2`}
            >
              <GoogleIcon />
              Google
            </button>

            <div className="mb-6 grid grid-cols-4 gap-3">
              <button
                className={`rounded-lg border ${borderColor} ${secondaryBg} p-3 transition-colors flex items-center justify-center`}
              >
                <FacebookIcon />
              </button>
              <button
                className={`rounded-lg border ${borderColor} ${secondaryBg} p-3 transition-colors flex items-center justify-center`}
              >
                <AppleIcon />
              </button>
              <button
                className={`rounded-lg border ${borderColor} ${secondaryBg} p-3 transition-colors flex items-center justify-center`}
              >
                <DiscordIcon />
              </button>
              <button
                className={`rounded-lg border ${borderColor} ${secondaryBg} p-3 transition-colors flex items-center justify-center ${textColor}`}
              >
                <TwitterIcon />
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
              className={`mb-3 w-full rounded-lg border ${borderColor} ${secondaryBg} py-3 font-semibold ${textColor} transition-colors`}
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
              className={`w-full rounded-lg border ${borderColor} ${secondaryBg} py-3 font-semibold ${textColor} transition-colors`}
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

            <p className={`mt-6 text-center text-xs ${mutedColor}`}>
              By signing in, you agree to the{" "}
              <a href="#" className="text-blue-500 hover:underline">
                Terms of Service
              </a>
            </p>
            <p className={`mt-2 text-center text-xs ${mutedColor}`}>
              protected by <span className="font-semibold">BlockDag SDK</span>
            </p>
          </div>
        ) : (
          <div className="p-8">
            <button
              className={`mb-4 ${mutedColor} hover:${textColor} transition-colors`}
            >
              ← Back
            </button>

            <div className="mb-6 flex justify-center">
              <BlockDagIcon className="h-12 w-12" />
            </div>

            <h2
              className={`mb-2 text-center text-2xl font-semibold ${textColor}`}
            >
              Please verify your email
            </h2>
            <p className={`mb-8 text-center text-sm ${mutedColor}`}>
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold">{email}</span>
            </p>

            <div className="mb-6 flex justify-center gap-2">
              <CardContent className="space-y-6">
                <div className="flex justify-center">
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
                  className="font-semibold w-full rounded-lg ${buttonBg} py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isSixDigits || submitting}
                  loading={submitting}
                  onClick={handleVerify}
                >
                  Verify and continue
                </LoadingButton>
              </CardContent>
            </div>
            {/* 
            <button
              onClick={handleVerify}
              disabled={loading}
              className={`w-full rounded-lg ${buttonBg} py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="mx-auto animate-spin" size={20} />
              ) : (
                "Verify and continue"
              )}
            </button> */}

            <p className={`mt-4 text-center text-sm ${mutedColor}`}>
              Didn't receive the code?{" "}
              <button className="text-blue-500 hover:underline">Resend</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
