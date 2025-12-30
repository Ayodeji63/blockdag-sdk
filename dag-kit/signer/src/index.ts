import {
  createWalletClient,
  http,
  type Chain,
  type Account,
  type WalletClient,
  type Address,
  type Hex,
  LocalAccount,
} from "viem";
import { TurnkeyClient } from "@turnkey/http";
import { createAccount } from "@turnkey/viem";
import { ISigner } from "./types.js";
import { IframeStamper } from "@turnkey/iframe-stamper";

export interface TurnkeySignerConfig {
  chain: Chain;
  rpcUrl?: string;
  turnkeyConfig: {
    baseUrl: string;
    organizationId: string;
    privateKeyId?: string;
    apiPublicKey?: string;
    apiPrivateKey?: string;
    stamper?: any;
  };
}

export class TurnkeySigner implements ISigner {
  private walletClient: WalletClient | null = null;
  private account: Account | null = null;
  private turnkeyClient: TurnkeyClient | null = null;
  private chain: Chain | null = null;
  private rpcUrl: string | undefined;
  private config: TurnkeySignerConfig["turnkeyConfig"] | undefined;
  private isConnected: boolean = false;

  constructor(config: TurnkeySignerConfig) {
    this.chain = config.chain;
    this.rpcUrl = config.rpcUrl || config.chain.rpcUrls.default.http[0];
    this.config = config.turnkeyConfig;
  }

  async connect(): Promise<void> {
    try {
      console.log("Connecting to Turnkey...");

      this.turnkeyClient = new TurnkeyClient(
        {
          baseUrl: this.config?.baseUrl || "",
        },
        this.config?.stamper
      );

      let signWith: string;

      if (this.config?.privateKeyId) {
        signWith = this.config.privateKeyId;
        console.log("Using existing private key:", signWith);
      } else {
        console.log("Creating new Private key");
        signWith = await this.createPrivateKey();
      }

      this.account = await createAccount({
        client: this.turnkeyClient,
        organizationId: this.config?.organizationId || "",
        signWith: signWith,
      });

      this.walletClient = createWalletClient({
        account: this.account,
        chain: this.chain,
        transport: http(this.rpcUrl),
      });
      this.isConnected = true;
      console.log("Turnkey signer connected:", this.account.address);
    } catch (err) {
      console.error("Failed to connect Turnkey signer:", err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.walletClient = null;
    this.account = null;
    this.turnkeyClient = null;
    this.isConnected = false;
    console.log("Turnkey singer disconnected");
  }

  private async whoami(subOrg: string): Promise<any> {
    try {
      const res = await this.turnkeyClient?.getWhoami({
        organizationId: subOrg,
      });

      // organizationId: string;
      // organizationName: string;
      // userId: string;
      // username: string;
      console.log("User ID:", res?.userId);
      console.log("Organization ID:", res?.organizationId);
      console.log("Username:", res?.username);
      return res;
    } catch (error) {}
  }

  async _createApiKeys(subOrg: string): Promise<any> {
    if (!this.turnkeyClient) {
      throw new Error("Turnkey client not initialized");
    }

    try {
      // ✅ Get the userId from the SUB-ORG, not the parent
      const { userId } = await this.whoami(subOrg);
      const { generateP256KeyPair } = await import("@turnkey/crypto");
      const keyPair = generateP256KeyPair();

      if (!userId) {
        throw Error("UserId not found in sub-organization");
      }

      const res = await this.turnkeyClient.createApiKeys({
        type: "ACTIVITY_TYPE_CREATE_API_KEYS_V2",
        timestampMs: String(Date.now()),
        organizationId: subOrg,
        parameters: {
          apiKeys: [
            {
              apiKeyName: `SubOrg-API-Key-${Date.now()}`,
              publicKey: keyPair.publicKey,
              curveType: "API_KEY_CURVE_P256",
            },
          ],
          userId: userId, // ✅ userId from the sub-org
        },
      });

      console.log("API Keys created:", res);

      return {
        apiKeyId: res.activity.result.createApiKeysResult?.apiKeyIds?.[0],
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
      };
    } catch (error) {
      console.error("Failed to create sub-org API keys:", error);
      throw error;
    }
  }

  private async createPrivateKey(): Promise<string> {
    if (!this.turnkeyClient) {
      throw new Error("Turnkey client not initialized");
    }

    try {
      const response = await this.turnkeyClient.createPrivateKeys({
        type: "ACTIVITY_TYPE_CREATE_PRIVATE_KEYS_V2",
        timestampMs: String(Date.now()),
        organizationId: this.config?.organizationId || "",
        parameters: {
          privateKeys: [
            {
              privateKeyName: `BlockDAG-Key-${Date.now()}`,
              curve: "CURVE_SECP256K1",
              addressFormats: ["ADDRESS_FORMAT_ETHEREUM"],
              privateKeyTags: [],
            },
          ],
        },
      });

      console.log("Private key creation response:", response);

      const privateKeyId =
        response.activity.result.createPrivateKeysResultV2?.privateKeys?.[0]
          ?.privateKeyId;

      if (!privateKeyId) {
        throw new Error("Failed to create private Key");
      }

      console.log("Created to private key:", privateKeyId);
      return privateKeyId;
    } catch (err) {
      console.error("Failed to create private key:", err);
      throw err;
    }
  }

  async listPrivateKeys(): Promise<any[]> {
    if (!this.turnkeyClient) {
      throw new Error("Turnkey client not initialized");
    }

    try {
      const response = await this.turnkeyClient.getPrivateKeys({
        organizationId: this.config?.organizationId || "",
      });

      return response.privateKeys || [];
    } catch (err) {
      console.error("Failed to list private keys:", err);
      throw err;
    }
  }

  async isReady(): Promise<boolean> {
    return this.isConnected && this.account !== null;
  }

  async getAccount(): Promise<Account> {
    if (!this.account) {
      throw new Error("Account not connected. Call connect() first.");
    }
    return this.account;
  }

  async getWalletClient(): Promise<WalletClient> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized call connect() first.");
    }
    return this.walletClient;
  }

  async getAddress(): Promise<Address> {
    const account = await this.getAccount();
    return account.address;
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    const client = await this.getWalletClient();
    const account = await this.getAccount();

    return await client.signMessage({
      account,
      message: typeof message === "string" ? message : { raw: message },
    });
  }

  async signTypedData(typedData: any): Promise<Hex> {
    const client = await this.getWalletClient();
    const account = await this.getAccount();

    return await client.signTypedData({
      account,
      ...typedData,
    });
  }

  isSessionActive(): boolean {
    return this.isConnected;
  }

  async refreshSession(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }
}

export function createTurnkeySigner(
  config: TurnkeySignerConfig
): TurnkeySigner {
  return new TurnkeySigner(config);
}

export async function createWebAuthnStamper() {
  const { WebauthnStamper } = await import("@turnkey/webauthn-stamper");
  return new WebauthnStamper({
    rpId: window.location.hostname,
  });
}

export async function createIframeStamper(iframeUrl: string) {
  const TurnkeyIframeContainerId = "turnkey-iframe-container";
  const TurnkeyIframeElementId = "turnkey-iframe";
  return new IframeStamper({
    iframeUrl,
    iframeElementId: TurnkeyIframeElementId,
    iframeContainer: document.getElementById(TurnkeyIframeContainerId),
  });
}
export async function createApiKeyStamper(
  apiPublicKey: string,
  apiPrivateKey: string
) {
  const { ApiKeyStamper } = await import("@turnkey/api-key-stamper");
  return new ApiKeyStamper({
    apiPublicKey,
    apiPrivateKey,
  });
}
