import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { googleLogout } from "@react-oauth/google";
import { uncompressRawPublicKey } from "@turnkey/crypto";
import { AuthClient, Session, SessionType } from "@turnkey/sdk-browser";
// Remove: import { useTurnkey } from "@turnkey/sdk-react";
import { OtpType, useTurnkey } from "@turnkey/react-wallet-kit";
import { WalletType } from "@turnkey/wallet-stamper";
import { Address, toHex } from "viem";
import * as authApi from "@/services/api/auth";
import {
  getOtpIdFromStorage,
  removeOtpIdFromStorage,
  setOtpIdInStorage,
  setSessionInStorage,
} from "@/lib/storage";
import { customWallet } from "@/config/turnkey";
import { createApiKeyStamper, createTurnkeySigner } from "@dag-kit/signer";
import { awakening, createDagAAClient, parseDAG } from "@dag-kit/kit";
import { boolean } from "zod";

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

export enum transactionType {
  NFT = "NFT",
  TOKEN = "TOKEN",
}

export interface BatchTransactionType {
  id: number;
  name: transactionType;
  data: any;
  value: any;
  target: Address;
}

const initialState: AuthState = {
  loading: false,
  error: "",
  user: null,
  sessionExpiring: false,
};

const batchState: BatchTransactionType = {
  id: 0,
  name: transactionType.NFT,
  data: "0x",
  value: parseDAG("0.1"),
  target: "0x",
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
  isModalOpen: boolean;
  address: string;
  dagClient: any;
  batchTransaction: any;
  initEmailLogin: (email: Email) => Promise<any>;
  completeEmailAuth: (params: {
    otpId: string;
    code: string;
    email: string;
  }) => Promise<any>;
  createSmartAccount: (subOrg: string) => Promise<any>;
  // loginWithPasskey: (email?: Email) => Promise<void>;
  // loginWithWallet: () => Promise<void>;
  // loginWithOAuth: (credential: string, providerName: string) => Promise<void>;
  // loginWithGoogle: (credential: string) => Promise<void>;
  // loginWithApple: (credential: string) => Promise<void>;
  // loginWithFacebook: (credential: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  setAddress: Dispatch<SetStateAction<string>>;
  setDagClient: Dispatch<SetStateAction<any>>;
  setBatchTransaction: Dispatch<SetStateAction<BatchTransactionType[]>>;
}>({
  state: initialState,
  isModalOpen: false,
  address: "",
  dagClient: "",
  batchTransaction: batchState,
  initEmailLogin: async () => {},
  completeEmailAuth: async () => {},
  // loginWithPasskey: async () => {},
  // loginWithWallet: async () => {},
  // loginWithOAuth: async () => {},
  // loginWithGoogle: async () => {},
  // loginWithApple: async () => {},
  // loginWithFacebook: async () => {},
  handleLogout: async () => {},
  createSmartAccount: async () => {},
  setIsModalOpen: () => {},
  setAddress: () => {},
  setDagClient: () => {},
  setBatchTransaction: () => {},
});

const SESSION_EXPIRY = "900";
const WARNING_BUFFER = 30;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const { initOtp, completeOtp, verifyOtp, logout } = useTurnkey();
  const [client, setClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [address, setAddress] = useState<string>("");
  const [dagClient, setDagClient] = useState<any>(null);
  const [batchTransaction, setBatchTransaction] = useState<
    BatchTransactionType[]
  >([]);

  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const [isInitialized, setIsInitialized] = useState(false);

  const initEmailLogin = async (email: Email) => {
    dispatch({ type: "LOADING", payload: true });

    try {
      console.log("Initializing email login for:", email);
      const init = await initOtp({
        otpType: OtpType.Email,
        contact: email,
      });

      // if (init) {
      //   navigate(
      //     `/verify-email?id=${encodeURIComponent(init)}&email=${encodeURIComponent(
      //       email
      //     )}&type=email`
      //   );
      // }
      dispatch({ type: "INIT_EMAIL_AUTH" });

      return encodeURIComponent(init);
    } catch (error: any) {
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };
  const createSmartAccount = async (subOrgId: string) => {
    try {
      // Validate subOrgId first
      if (!subOrgId || subOrgId.trim() === "") {
        throw new Error("Invalid sub-organization ID provided");
      }

      // Get API credentials (these are for the parent org)
      const PUBLIC_KEY =
        import.meta.env.VITE_TURNKEY_PUBLIC_KEY ||
        "0274c3a3f0c5dbd9737d39628af4615ceb799df320a9f8816e716254b40f387678";
      const PRIVATE_KEY =
        import.meta.env.VITE_TURNKEY_PRIVATE_KEY ||
        "72ae2bd2ed49396c8c365437efd7c0b852e3d57d87a3a7ddd39b017a8812ce8b";
      const PARENT_ORG_ID =
        import.meta.env.VITE_TURNKEY_ORG_ID ||
        "1381ab26-7197-4e84-ad74-d06963b50de7";

      if (!PUBLIC_KEY || !PRIVATE_KEY || !PARENT_ORG_ID) {
        throw new Error(
          "Missing required environment variables: PUBLIC_KEY, PRIVATE_KEY, or ORG_ID"
        );
      }

      console.log(
        "🔑 Public Key (first 10 chars):",
        PUBLIC_KEY.substring(0, 10)
      );
      console.log(
        "🔑 Private Key (first 10 chars):",
        PRIVATE_KEY.substring(0, 10)
      );
      console.log("🏢 Parent Organization ID:", PARENT_ORG_ID);
      console.log("🏢 Sub-organization ID:", subOrgId);

      // Validate key formats
      if (PUBLIC_KEY.length !== 66) {
        throw new Error(
          `Invalid public key length: ${PUBLIC_KEY.length} (expected 66)`
        );
      }

      if (PRIVATE_KEY.length !== 64) {
        throw new Error(
          `Invalid private key length: ${PRIVATE_KEY.length} (expected 64)`
        );
      }

      if (!PUBLIC_KEY.startsWith("02") && !PUBLIC_KEY.startsWith("03")) {
        throw new Error(
          "Invalid public key format: must start with 02 or 03 (compressed format)"
        );
      }

      // Create stamper (uses parent org credentials)
      console.log("📝 Creating API Key Stamper...");
      const stamper = await createApiKeyStamper(PUBLIC_KEY, PRIVATE_KEY);
      console.log("✅ Stamper created successfully");

      if (!stamper || typeof stamper.stamp !== "function") {
        throw new Error("Invalid stamper object created");
      }

      // ✅✅✅ CRITICAL FIX: Use SUB-ORG ID, not parent ORG_ID
      console.log("🔐 Creating Turnkey Signer...");
      const turnkeySigner = createTurnkeySigner({
        chain: awakening.chain_config,
        rpcUrl: "https://rpc.awakening.bdagscan.com",
        turnkeyConfig: {
          baseUrl: "https://api.turnkey.com",
          organizationId: PARENT_ORG_ID, // ✅ Use subOrgId here!
          stamper: stamper,
        },
      });

      console.log("🔗 Connecting to Turnkey...");
      await turnkeySigner.connect();
      console.log("✅ Turnkey connected successfully");

      const signerAddress = await turnkeySigner.getAddress();
      console.log("📍 Signer Address:", signerAddress);

      // Create DAG AA Client
      console.log("🚀 Creating DAG AA Client...");
      const _dagClient = createDagAAClient({
        chain: awakening.chain_config,
        rpcUrl: "https://rpc.awakening.bdagscan.com",
        bundlerUrl: "http://localhost:3000",
        paymasterUrl: "http://localhost:3001/rpc",
        factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
      });

      // Connect smart account
      console.log("💼 Connecting Smart Account...");
      const smartAccountAddress = await _dagClient.connectSmartAccount({
        signer: turnkeySigner,
      });

      console.log("✅ Smart Account Address:", smartAccountAddress);

      // Check deployment status
      const isDeployed = await _dagClient.isDeployed();
      console.log("📦 Is Smart Account Deployed:", isDeployed);

      // Get balance
      const balance = await _dagClient.getBalance();
      console.log("💰 Balance:", balance.toString(), "wei");

      if (balance === 0n) {
        console.warn(
          `⚠️ Warning: Smart account has 0 balance. Fund it at: ${smartAccountAddress}`
        );
      }

      setAddress(smartAccountAddress);
      setDagClient(_dagClient);
      return {
        signerAddress,
        smartAccountAddress,
        isDeployed,
        balance,
        _dagClient,
        turnkeySigner,
      };
    } catch (error: any) {
      console.error("❌ Error creating smart account:", error);

      // Better error messages
      if (error.message?.includes("createPrivateKeysResultV2")) {
        throw new Error(
          "Failed to create private key. This usually means:\n" +
            "1. The sub-organization ID is incorrect\n" +
            "2. The API key doesn't have permission to access this sub-org\n" +
            "3. The sub-organization doesn't exist yet"
        );
      }

      if (error.message?.includes("API key")) {
        throw new Error(
          "Invalid Turnkey API credentials. Check your PUBLIC_KEY and PRIVATE_KEY."
        );
      }

      if (error.message?.includes("organization")) {
        throw new Error(
          "Invalid organization ID. Make sure you're using the sub-organization ID."
        );
      }

      throw error;
    }
  };

  const verifyCode = async ({
    otpId,
    otpCode,
    email,
  }: {
    otpId: string;
    otpCode: string;
    email: string;
  }) => {
    try {
      dispatch({ type: "LOADING", payload: true });
      const res = await verifyOtp({
        otpId,
        otpCode,
        contact: email,
        otpType: OtpType.Email,
      });

      console.log("OTP verified successfully:", res);
      return res;
    } catch (error: any) {
      dispatch({ type: "ERROR", payload: error.message });
    } finally {
      dispatch({ type: "LOADING", payload: false });
    }
  };

  const completeEmailAuth = async ({
    otpId,
    code,
    email,
  }: {
    otpId: string;
    code: string;
    email: string;
  }) => {
    if (email) {
      dispatch({ type: "LOADING", payload: true });

      try {
        // const res = await completeOtp({
        //   otpId,
        //   otpCode: code,
        //   contact: email,
        //   otpType: OtpType.Email,
        //   // optional: create sub-org on first login
        //   createSubOrgParams: {
        //     customWallet,
        //     userEmail: email,
        //   },
        // });

        const res = await verifyCode({ otpId, otpCode: code, email });

        await createSmartAccount(res?.subOrganizationId || "");

        localStorage.setItem("Session", JSON.stringify(res));

        setIsModalOpen(false);
        // navigate("/dashboard");

        return res;
      } catch (error: any) {
        console.error("[completeEmailAuth] Error:", error);
        dispatch({ type: "ERROR", payload: error.message });
      } finally {
        dispatch({ type: "LOADING", payload: false });
      }
    }
  };

  // const loginWithPasskey = async (email?: Email) => {
  //   dispatch({ type: "LOADING", payload: true });
  //   try {
  //     const { subOrgId } = await authApi.getSubOrgId({ email: email as Email });

  //     if (subOrgId?.length) {
  //       await indexedDbClient?.resetKeyPair();
  //       const publicKey = await indexedDbClient!.getPublicKey();
  //       await passkeyClient?.loginWithPasskey({
  //         sessionType: SessionType.READ_WRITE,
  //         publicKey,
  //       });

  //       navigate("/dashboard");
  //     } else {
  //       const { encodedChallenge, attestation } =
  //         (await passkeyClient?.createUserPasskey({
  //           publicKey: {
  //             user: {
  //               name: email,
  //               displayName: email,
  //             },
  //           },
  //         })) || {};

  //       if (encodedChallenge && attestation) {
  //         const { subOrg, user } = await authApi.createUserSubOrg({
  //           email: email as Email,
  //           passkey: {
  //             challenge: encodedChallenge,
  //             attestation,
  //           },
  //         });

  //         if (subOrg && user) {
  //           setSessionInStorage(
  //             loginResponseToUser(
  //               {
  //                 userId: user.userId,
  //                 username: user.userName,
  //                 organizationId: subOrg.subOrganizationId,
  //                 organizationName: "",
  //                 session: undefined,
  //                 sessionExpiry: undefined,
  //               },
  //               AuthClient.Passkey
  //             )
  //           );

  //           navigate("/dashboard");
  //         }
  //       }
  //     }
  //   } catch (error: any) {
  //     const message: string = error?.message || "";
  //     if (message.includes("NotAllowedError")) {
  //       window.location.reload();
  //       return;
  //     }
  //     dispatch({ type: "ERROR", payload: error.message });
  //   } finally {
  //     dispatch({ type: "LOADING", payload: false });
  //   }
  // };

  // const loginWithWallet = async () => {
  //   dispatch({ type: "LOADING", payload: true });

  //   try {
  //     await indexedDbClient?.resetKeyPair();
  //     const publicKey = await indexedDbClient?.getPublicKey();
  //     const walletPublicKey = await walletClient?.getPublicKey();

  //     if (!publicKey || !walletPublicKey) {
  //       throw new Error("No public key found");
  //     }

  //     let { subOrgId } = await authApi.getSubOrgId({
  //       publicKey: walletPublicKey,
  //     });

  //     if (!subOrgId) {
  //       const { subOrg } = await authApi.createUserSubOrg({
  //         wallet: {
  //           publicKey: walletPublicKey,
  //           type: WalletType.Ethereum,
  //         },
  //       });
  //       subOrgId = subOrg.subOrganizationId;
  //     }

  //     await walletClient?.loginWithWallet({
  //       publicKey,
  //       sessionType: SessionType.READ_WRITE,
  //     });

  //     navigate("/dashboard");
  //   } catch (error: any) {
  //     dispatch({ type: "ERROR", payload: error.message });
  //   } finally {
  //     dispatch({ type: "LOADING", payload: false });
  //   }
  // };

  // const loginWithOAuth = async (credential: string, providerName: string) => {
  //   dispatch({ type: "LOADING", payload: true });
  //   try {
  //     const publicKeyCompressed = await indexedDbClient?.getPublicKey();

  //     if (!publicKeyCompressed) {
  //       throw new Error("No public key found");
  //     }

  //     const publicKey = toHex(
  //       uncompressRawPublicKey(
  //         new Uint8Array(Buffer.from(publicKeyCompressed, "hex"))
  //       )
  //     ).replace("0x", "");

  //     let { subOrgId } = await authApi.getSubOrgId({ oidcToken: credential });

  //     if (!subOrgId) {
  //       const { subOrg } = await authApi.createUserSubOrg({
  //         oauth: {
  //           oidcToken: credential,
  //           providerName,
  //         },
  //       });
  //       subOrgId = subOrg.subOrganizationId;
  //     }

  //     const oauthResponse = await authApi.oauth({
  //       credential,
  //       publicKey: publicKeyCompressed,
  //       subOrgId,
  //     });

  //     await indexedDbClient?.loginWithSession(oauthResponse.session);

  //     navigate("/dashboard");
  //   } catch (error: any) {
  //     dispatch({ type: "ERROR", payload: error.message });
  //   } finally {
  //     dispatch({ type: "LOADING", payload: false });
  //   }
  // };

  // const loginWithGoogle = async (credential: string) => {
  //   await loginWithOAuth(credential, "Google Auth - Embedded Wallet");
  // };

  // const loginWithApple = async (credential: string) => {
  //   await loginWithOAuth(credential, "Apple Auth - Embedded Wallet");
  // };

  // const loginWithFacebook = async (credential: string) => {
  //   await loginWithOAuth(credential, "Facebook Auth - Embedded Wallet");
  // };

  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      const session = localStorage.getItem("Session");
      const sessionToken = JSON.parse(session || "{}").sessionToken;
      localStorage.removeItem("Session");
      console.log("Session token:", sessionToken);
      setAddress("");
      setDagClient(null);
      // Clear any stored session data
      localStorage.removeItem("smartAccountAddress");
      localStorage.removeItem("authToken");
      await logout(sessionToken);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
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
        isModalOpen,
        initEmailLogin,
        completeEmailAuth,
        address,
        dagClient,
        setDagClient,
        batchTransaction,
        // loginWithPasskey,
        // loginWithWallet,
        // loginWithOAuth,
        // loginWithGoogle,
        // loginWithApple,
        // loginWithFacebook,
        handleLogout,
        createSmartAccount,
        setIsModalOpen,
        setAddress,
        setBatchTransaction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
