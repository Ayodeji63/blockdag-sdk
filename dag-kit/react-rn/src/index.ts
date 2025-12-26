export { DagKitProvider } from "./context";
// UI Components (Pre-built)
export {
  SendTransaction,
  WalletConnect,
  LoginModal,
  OAuthCallbackPage,
} from "./components";

export {
  exchangeOAuthCode,
  handleOAuthCallback,
  initiateOAuthFlow,
  openOAuthWindow,
} from "./helpers";

export {
  useConnectWallet,
  useEmailLogin,
  useOAuthLogin,
  useSignMessage,
  useWallet,
  useAuth,
} from "./hooks";

export { useDagKit } from "./context";

// export type {
//   DagLoginButtonProps,
//   DagLoginModalProps,
//   DagAccountWidgetProps,
//   DagTransactionButtonProps,
// } from "./components";

// Styles (developers can import)
import "./styles/components.css";
import "./components/login-modal.css";
// Re-export from core kit
export type {
  DagAAConfig,
  SmartAccountConfig,
  SendUserOperationParams,
  Address,
  Hash,
  Chain,
} from "@dag-kit/kit";
