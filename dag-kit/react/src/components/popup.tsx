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

export const PopUpModal = ({
  isOpen,
  onClose,
  darkMode,
  handleMint,
  addToBatch,
}: {
  isOpen: any;
  onClose: any;
  darkMode: any;
  handleMint: any;
  addToBatch: any;
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

  const type = "email";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSixDigits = useMemo(() => code.length === 6, [code]);

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 "
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full transition-all duration-300 ease-out ${bgColor} shadow-2xl rounded-t-3xl lg:rounded-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div
          className="flex items-center justify-center py-3 cursor-pointer"
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

        <div className="px-6 pb-6 mt-4">
          {/* Essential login options - always visible */}
          <div className="space-x-3 mb-6 flex items-center">
            <button
              onClick={() => handleMint()}
              className={`w-full rounded-lg ${buttonBg} py-3 text-base font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="mx-auto animate-spin" size={20} />
              ) : (
                "Submit"
              )}
            </button>

            <button
              onClick={() => addToBatch()}
              className={`w-full rounded-lg ${buttonBg} py-3 text-base font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="mx-auto animate-spin" size={20} />
              ) : (
                "Add To Batch"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
