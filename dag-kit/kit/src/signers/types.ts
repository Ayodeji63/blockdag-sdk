// src/signers/types.ts
import { Account, LocalAccount, WalletClient } from "viem";

/**
 * Common interface for all signers
 * This allows users to plug in different signing methods
 */
export interface ISigner {
  /**
   * Get the viem Account object for signing
   */
  getAccount(): LocalAccount | Promise<LocalAccount>;

  /**
   * Get the wallet client for transactions
   */
  getWalletClient(): WalletClient | Promise<WalletClient>;

  /**
   * Get the signer's address
   */
  getAddress(): `0x${string}` | Promise<`0x${string}`>;

  /**
   * Check if signer is ready/connected
   */
  isReady(): boolean | Promise<boolean>;
}

/**
 * Configuration for different signer types
 */
export type SignerConfig =
  | {
      type: "privateKey";
      privateKey: `0x${string}`;
    }
  | {
      type: "privy";
      // Privy handles its own state, no config needed
    }
  | {
      type: "custom";
      signer: ISigner;
    };
