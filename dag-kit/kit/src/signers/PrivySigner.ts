// src/signers/PrivySigner.ts
import {
  type Account,
  type WalletClient,
  createWalletClient,
  custom,
  type Chain,
  LocalAccount,
} from "viem";
import { ISigner } from "./types.js";

/**
 * Privy Signer - Works with Privy's embedded wallets
 *
 * Usage in React:
 * ```tsx
 * import { useWallets } from '@privy-io/react-auth';
 *
 * const { wallets } = useWallets();
 * const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
 *
 * const signer = new PrivySigner(embeddedWallet, chain);
 * ```
 */
export class PrivySigner implements ISigner {
  private privyWallet: any; // Privy wallet object
  private chain: Chain;
  private cachedAddress?: `0x${string}`;
  private cachedWalletClient;

  constructor(privyWallet: any, chain: Chain) {
    if (!privyWallet) {
      throw new Error("Privy wallet is required");
    }
    this.privyWallet = privyWallet;
    this.chain = chain;
  }

  async getAccount(): Promise<LocalAccount> {
    const provider = await this.privyWallet.getEthereumProvider();

    if (!provider) {
      throw new Error("No Ethereum provider found in Privy wallet");
    }

    // Create a custom account from the provider
    return {
      address: this.privyWallet.address as `0x${string}`,
      type: "json-rpc",
      // @ts-ignore - Privy provider compatible with viem
      source: "privateKey",
    } as unknown as LocalAccount;
  }

  async getWalletClient(): Promise<WalletClient> {
    if (this.cachedWalletClient) {
      return this.cachedWalletClient;
    }

    const provider = await this.privyWallet.getEthereumProvider();

    if (!provider) {
      throw new Error("No Ethereum provider found in Privy wallet");
    }

    // Create wallet client with Privy's provider
    this.cachedWalletClient = createWalletClient({
      account: await this.getAccount(),
      chain: this.chain,
      transport: custom(provider),
    });

    return this.cachedWalletClient;
  }

  async getAddress(): Promise<`0x${string}`> {
    if (this.cachedAddress) {
      return this.cachedAddress;
    }

    this.cachedAddress = this.privyWallet.address as `0x${string}`;
    return this.cachedAddress;
  }

  async isReady(): Promise<boolean> {
    try {
      const provider = await this.privyWallet.getEthereumProvider();
      return !!provider && !!this.privyWallet.address;
    } catch {
      return false;
    }
  }
}
