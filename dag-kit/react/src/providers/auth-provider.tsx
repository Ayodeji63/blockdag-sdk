import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { googleLogout } from "@react-oauth/google";
import { uncompressRawPublicKey } from "@turnkey/crypto";
import { AuthClient, Session, SessionType } from "@turnkey/sdk-browser";
import { useTurnkey } from "@turnkey/sdk-react";
import { WalletType } from "@turnkey/wallet-stamper";
import { toHex } from "viem";
import * as authApi from "@/services/api/auth";
import {
  getOtpIdFromStorage,
  removeOtpIdFromStorage,
  setOtpIdInStorage,
  setSessionInStorage,
} from "@/lib/storage";

type Email = string;

interface UserSession {
  id: string;
  name: string;
  email: string;
  organization: {
    organizationId: string;
    organizationName: string;
  };
}

export const loginResponseToUser = (
  loginResponse: {
    organizationId: string;
    organizationName: string;
    userId: string;
    username: string;
    session?: string;
    sessionExpiry?: string;
  },
  authClient: AuthClient
): UserSession => {
  const subOrganization = {
    organizationId: loginResponse.organizationId,
    organizationName: loginResponse.organizationName,
  };

  return {
    id: loginResponse.userId,
    name: loginResponse.username,
    email: loginResponse.username,
    organization: subOrganization,
  };
};

type AuthActionType =
  | { type: "PASSKEY"; payload: UserSession }
  | { type: "INIT_EMAIL_AUTH" }
  | { type: "COMPLETE_EMAIL_AUTH"; payload: UserSession }
  | { type: "EMAIL_RECOVERY"; payload: UserSession }
  | { type: "WALLET_AUTH"; payload: UserSession }
  | { type: "OAUTH"; payload: UserSession }
  | { type: "LOADING"; payload: boolean }
  | { type: "ERROR"; payload: string }
  | { type: "SESSION_EXPIRING"; payload: boolean };

interface AuthState {
  loading: boolean;
  error: string;
  user: UserSession | null;
  sessionExpiring: boolean;
}

const initialState: AuthState = {
  loading: false,
  error: "",
  user: null,
  sessionExpiring: false,
};

function authReducer(state: AuthState, action: AuthActionType): AuthState {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: action.payload };
    case "ERROR":
      return { ...state, error: action.payload, loading: false };
    case "INIT_EMAIL_AUTH":
      return { ...state, loading: false, error: "" };
    case "COMPLETE_EMAIL_AUTH":
      return { ...state, user: action.payload, loading: false, error: "" };
    case "PASSKEY":
    case "EMAIL_RECOVERY":
    case "WALLET_AUTH":
    case "OAUTH":
      return { ...state, user: action.payload, loading: false, error: "" };
    case "SESSION_EXPIRING":
      return { ...state, sessionExpiring: action.payload };
    default:
      return state;
  }
}

const AuthContext = createContext<{
  state: AuthState;
  initEmailLogin: (email: Email) => Promise<void>;
  completeEmailAuth: (params: {
    userEmail: string;
    continueWith: string;
    credentialBundle: string;
  }) => Promise<void>;
  loginWithPasskey: (email?: Email) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  loginWithOAuth: (credential: string, providerName: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithApple: (credential: string) => Promise<void>;
  loginWithFacebook: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}>({
  state: initialState,
  initEmailLogin: async () => {},
  completeEmailAuth: async () => {},
  loginWithPasskey: async () => {},
  loginWithWallet: async () => {},
  loginWithOAuth: async () => {},
  loginWithGoogle: async () => {},
  loginWithApple: async () => {},
  loginWithFacebook: async () => {},
  logout: async () => {},
});

const SESSION_EXPIRY = "900";
const WARNING_BUFFER = 30;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const { turnkey, indexedDbClient, passkeyClient, walletClient } =
    useTurnkey();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  console.log("Turnkey hook values:", {
    turnkey,
    indexedDbClient,
    passkeyClient,
    walletClient,
  });

  const initEmailLogin = async (email: Email) => {
    dispatch({ type: "LOADING", payload: true });

    try {
      const publicKey = await indexedDbClient?.getPublicKey();
      if (!publicKey) {
        throw new Error("No public key found");
      }

      const targetPublicKey = toHex(
        uncompressRawPublicKey(new Uint8Array(Buffer.from(publicKey, "hex")))
      );

      if (!targetPublicKey) {
        throw new Error("No public key found");
      }

      const response = await authApi.initEmailAuth({
        email,
        targetPublicKey,
        baseUrl: window.location.origin,
      });

      if (response) {
        if (response.otpId) {
          setOtpIdInStorage(response.otpId);
        }
        dispatch({ type: "INIT_EMAIL_AUTH" });
        navigate(`/email-auth?userEmail=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const completeEmailAuth = async ({
    userEmail,
    continueWith,
    credentialBundle,
  }: {
    userEmail: string;
    continueWith: string;
    credentialBundle: string;
  }) => {
    if (userEmail && continueWith === "email" && credentialBundle) {
      dispatch({ type: "LOADING", payload: true });

      try {
        const publicKeyCompressed = await indexedDbClient?.getPublicKey();
        if (!publicKeyCompressed) {
          throw new Error("No public key found");
        }

        const storedOtpId = getOtpIdFromStorage();
        if (!storedOtpId) {
          throw new Error("OTP identifier not found. Please restart sign-in.");
        }

        const authResponse = await authApi.verifyOtp({
          otpId: storedOtpId,
          publicKey: publicKeyCompressed,
          otpCode: credentialBundle,
        });

        const { session, userId, organizationId } = await authApi.otpLogin({
          email: userEmail as Email,
          publicKey: publicKeyCompressed,
          verificationToken: authResponse.verificationToken,
        });

        await indexedDbClient?.loginWithSession(session || "");
        removeOtpIdFromStorage();

        const expiryTime = Date.now() + parseInt(SESSION_EXPIRY) * 1000;
        scheduleSessionWarning(expiryTime);

        setSessionInStorage({
          id: userId,
          name: userEmail,
          email: userEmail,
          organization: {
            organizationId: organizationId,
            organizationName: "",
          },
        });

        navigate("/dashboard");
      } catch (error: any) {
        console.error("[completeEmailAuth] Error:", error);
        dispatch({ type: "ERROR", payload: error.message });
      } finally {
        dispatch({ type: "LOADING", payload: false });
      }
    }
  };

  const loginWithPasskey = async (email?: Email) => {
    dispatch({ type: "LOADING", payload: true });
    try {
      const { subOrgId } = await authApi.getSubOrgId({ email: email as Email });

      if (subOrgId?.length) {
        await indexedDbClient?.resetKeyPair();
        const publicKey = await indexedDbClient!.getPublicKey();
        await passkeyClient?.loginWithPasskey({
          sessionType: SessionType.READ_WRITE,
          publicKey,
        });

        navigate("/dashboard");
      } else {
        const { encodedChallenge, attestation } =
          (await passkeyClient?.createUserPasskey({
            publicKey: {
              user: {
                name: email,
                displayName: email,
              },
            },
          })) || {};

        if (encodedChallenge && attestation) {
          const { subOrg, user } = await authApi.createUserSubOrg({
            email: email as Email,
            passkey: {
              challenge: encodedChallenge,
              attestation,
            },
          });

          if (subOrg && user) {
            setSessionInStorage(
              loginResponseToUser(
                {
                  userId: user.userId,
                  username: user.userName,
                  organizationId: subOrg.subOrganizationId,
                  organizationName: "",
                  session: undefined,
                  sessionExpiry: undefined,
                },
                AuthClient.Passkey
              )
            );

            navigate("/dashboard");
          }
        }
      }
    } catch (error: any) {
      const message: string = error?.message || "";
      if (message.includes("NotAllowedError")) {
        window.location.reload();
        return;
      }
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const loginWithWallet = async () => {
    dispatch({ type: "LOADING", payload: true });

    try {
      await indexedDbClient?.resetKeyPair();
      const publicKey = await indexedDbClient?.getPublicKey();
      const walletPublicKey = await walletClient?.getPublicKey();

      if (!publicKey || !walletPublicKey) {
        throw new Error("No public key found");
      }

      let { subOrgId } = await authApi.getSubOrgId({
        publicKey: walletPublicKey,
      });

      if (!subOrgId) {
        const { subOrg } = await authApi.createUserSubOrg({
          wallet: {
            publicKey: walletPublicKey,
            type: WalletType.Ethereum,
          },
        });
        subOrgId = subOrg.subOrganizationId;
      }

      await walletClient?.loginWithWallet({
        publicKey,
        sessionType: SessionType.READ_WRITE,
      });

      navigate("/dashboard");
    } catch (error: any) {
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const loginWithOAuth = async (credential: string, providerName: string) => {
    dispatch({ type: "LOADING", payload: true });
    try {
      const publicKeyCompressed = await indexedDbClient?.getPublicKey();

      if (!publicKeyCompressed) {
        throw new Error("No public key found");
      }

      const publicKey = toHex(
        uncompressRawPublicKey(
          new Uint8Array(Buffer.from(publicKeyCompressed, "hex"))
        )
      ).replace("0x", "");

      let { subOrgId } = await authApi.getSubOrgId({ oidcToken: credential });

      if (!subOrgId) {
        const { subOrg } = await authApi.createUserSubOrg({
          oauth: {
            oidcToken: credential,
            providerName,
          },
        });
        subOrgId = subOrg.subOrganizationId;
      }

      const oauthResponse = await authApi.oauth({
        credential,
        publicKey: publicKeyCompressed,
        subOrgId,
      });

      await indexedDbClient?.loginWithSession(oauthResponse.session);

      navigate("/dashboard");
    } catch (error: any) {
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const loginWithGoogle = async (credential: string) => {
    await loginWithOAuth(credential, "Google Auth - Embedded Wallet");
  };

  const loginWithApple = async (credential: string) => {
    await loginWithOAuth(credential, "Apple Auth - Embedded Wallet");
  };

  const loginWithFacebook = async (credential: string) => {
    await loginWithOAuth(credential, "Facebook Auth - Embedded Wallet");
  };

  const logout = async () => {
    await turnkey?.logout();
    await indexedDbClient?.clear();
    googleLogout();
    navigate("/");
  };

  const scheduleSessionWarning = (expiryTime: number) => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    const warningTime = expiryTime - WARNING_BUFFER * 1000;
    const now = Date.now();
    const timeUntilWarning = warningTime - now;

    if (timeUntilWarning > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        dispatch({ type: "SESSION_EXPIRING", payload: true });

        const resetTimeout = setTimeout(() => {
          dispatch({ type: "SESSION_EXPIRING", payload: false });
        }, WARNING_BUFFER * 1000);

        return () => clearTimeout(resetTimeout);
      }, timeUntilWarning);
    }
  };

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        state,
        initEmailLogin,
        completeEmailAuth,
        loginWithPasskey,
        loginWithWallet,
        loginWithOAuth,
        loginWithGoogle,
        loginWithApple,
        loginWithFacebook,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
