import { useTurnkey } from "@turnkey/react-wallet-kit";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { customWallet } from "@/config/turnkey";
import { OtpType } from "@turnkey/sdk-react";

import { LoadingButton } from "@/components/ui/button.loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { BlockDagIcon } from "@/components/icons";
import { useAuth } from "@/providers/auth-provider";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { httpClient, signUpWithPasskey, completeOtp } = useTurnkey();
  const { completeEmailAuth } = useAuth();

  const otpId = searchParams.get("id") || "";
  console.log("OTP ID from URL:", otpId);
  const email = searchParams.get("email") || "";
  const type = (searchParams.get("type") || "").toLowerCase();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSixDigits = useMemo(() => code.length === 6, [code]);

  const handleVerify = useCallback(async () => {
    // if (!otpId || !email || (type !== "passkey" && type !== "email")) {
    //   toast.error("Missing verification context. Please restart sign in");
    //   navigate("/");
    //   return;
    // }

    try {
      setSubmitting(true);

      if (type === "passkey") {
        const res = await httpClient?.proxyVerifyOtp({
          otpId,
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
        const params = { otpId, code, email };
        const res = await completeEmailAuth(params);
        console.log("OTP completed successfully for email", res);
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
  }, [otpId, email, code, httpClient, signUpWithPasskey, navigate]);

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <Card className="mx-auto w-full max-w-[450px]">
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16">
              <BlockDagIcon />
            </div>
          </div>

          <CardTitle className="text-center text-xl font-medium">
            Please verify your email
          </CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold">{email}</span>.
          </CardDescription>
        </CardHeader>
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
            className="w-full font-semibold"
            disabled={!isSixDigits || submitting}
            loading={submitting}
            onClick={handleVerify}
          >
            Verify and continue
          </LoadingButton>
        </CardContent>
      </Card>
    </main>
  );
}
