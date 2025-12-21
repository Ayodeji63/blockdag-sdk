import { Account, WalletClient } from "viem";

/**
 * Common interface for all signers
 * This allows users to plug in different signing methods
 */

export interface ISigner {
  /**
   * Get the viem Account object for signing
   */
  getAccount(): Account | Promise<Account>;

  /**
   * Get the wallet client for transactions
   */
  getWalletClient(): WalletClient | Promise<WalletClient>;

  /**
   * Get the signer's address
   */
  getAddress(): `0x${string}` | Promise<`0${string}`>;

  /**
   * Check if signer is ready/connected
   */
  isReady(): boolean | Promise<boolean>;
}

/**
 *  Configuration for different signer types
 */

export type SignerConfig =
  | {
      type: "privateKey";
      privateKey: `0x${string}`;
    }
  | {
      type: "privy";
    }
  | {
      type: "custom";
      signer: ISigner;
    };
