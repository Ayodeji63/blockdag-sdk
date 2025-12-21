import {
  type Account,
  type WalletClient,
  createWalletClient,
  custom,
  type Chain,
} from "viem";

import { ISigner } from "./types";

/**
 * Privy Signer - Works with Privy's embedded wallets
 *
 * Usage in React:
 * ```tsx
 * Import {useWallets} from '@privy-io/react-auth';
 *
 * const {wallets} = useWallets();
 * const embeddedWallet = wallets.find(w => w.walletClientType === 'privy);
 *
 * const singer = new PrivySigner(embeddedWallet, chain);
 */

export class PrivySigner implements ISigner {
  private privyWallet: any;
  private chain: Chain;
  private cachedAddress?: `0x${string}`;
  private cachedWalletClient?: WalletClient;

  constructor(privyWallet: any, chain: Chain) {
    if (!privyWallet) {
      throw new Error("Privy wallet is required");
    }
    this.privyWallet = privyWallet;
    this.chain = chain;
  }

  async getAccount(): Promise<Account> {
    const provider = await this.privyWallet.getEthereumProvider();

    if (!provider) {
      throw new Error("No Ethereum provider found in Privy wallet");
    }

    return {
      address: this.privyWallet.address as `0x${string}`,
      type: "json-rpc",
      source: "privateKey",
    } as unknown as Account;
  }

  async getWalletClient(): Promise<WalletClient> {
    if (this.cachedWalletClient) {
      return this.cachedWalletClient;
    }

    const provider = await this.privyWallet.getEthereumProvider();

    if (!provider) {
      throw new Error("No Ethereum provider found in Privy wallet");
    }

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
