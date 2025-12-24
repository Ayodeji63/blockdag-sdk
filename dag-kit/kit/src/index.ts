export { createDagAAClient, parseDAG } from "./clients/actions/main.js";
export { awakening, arbitrumSep } from "./clients/chains.js";
export { DagAAClient } from "./clients/actions/main.js";

export type {
  DagAAConfig,
  SmartAccountConfig,
  SendUserOperationParams,
  UserOperationReceipt,
} from "./exports/public-types.js";

export { PrivySigner } from "./signers/PrivySigner.js";
export { PrivateKeySigner } from "./signers/PrivateKeySigner.js";

// Re-export commonly used viem types for convenience
export type { Address, Hash, Chain } from "viem";
