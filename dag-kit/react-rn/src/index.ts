export { DagAAProvider } from "./PrivyProvider";
export { useDagAA, usePrivy as useAuth, useWallets } from "./hooks/index";

// UI Components (Pre-built)
export {
  DagLoginButton,
  DagLoginModal,
  DagAccountWidget,
  DagTransactionButton,
} from "./components";

export type {
  DagLoginButtonProps,
  DagLoginModalProps,
  DagAccountWidgetProps,
  DagTransactionButtonProps,
} from "./components";

// Styles (developers can import)
import "./styles/components.css";

// Re-export from core kit
export type {
  DagAAConfig,
  SmartAccountConfig,
  SendUserOperationParams,
  Address,
  Hash,
  Chain,
} from "@dag-kit/kit";
