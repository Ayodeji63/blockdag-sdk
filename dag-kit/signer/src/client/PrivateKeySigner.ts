// src/signers/PrivateKeySigner.ts
import {
  createWalletClient,
  http,
  type Chain,
  type Account,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ISigner } from "./types";

export class PrivateKeySigner implements ISigner {
  private account: Account;
  private walletClient: WalletClient;

  constructor(privateKey: `0x${string}`, chain: Chain, rpcUrl: string) {
    this.account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain,
      transport: http(rpcUrl),
    });
  }

  getAccount(): Account {
    return this.account;
  }

  getWalletClient(): WalletClient {
    return this.walletClient;
  }

  getAddress(): `0x${string}` {
    return this.account.address;
  }

  isReady(): boolean {
    return true;
  }
}
