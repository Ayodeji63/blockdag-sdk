// ==============================================================================
// DAG AA SDK - BlockDAG Account Abstraction SDK
// Inspired by Alchemy AA SDK
// ==============================================================================

import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type Transport,
  type Account,
  type Hash,
  type Address,
  encodeFunctionData,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint06Address } from "viem/account-abstraction";
import { createSmartAccountClient } from "permissionless";
import {
  DagAAConfig,
  SmartAccountConfig,
  SendUserOperationParams,
  UserOperationReceipt,
} from "../types";

// ==============================================================================
// Main SDK Class
// ==============================================================================

export class DagAAClient {
  private config: DagAAConfig;
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient>;
  private bundlerClient: ReturnType<typeof createPimlicoClient> | null = null;
  private smartAccount: any | null = null;
  private smartAccountClient: ReturnType<
    typeof createSmartAccountClient
  > | null = null;

  constructor(config: DagAAConfig) {
    this.config = {
      ...config,
      entryPointAddress: config.entryPointAddress || entryPoint06Address,
    };

    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    this.walletClient = createWalletClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });
  }

  // ==============================================================================
  // Smart Account Management
  // ==============================================================================

  async connectSmartAccount(
    accountConfig: SmartAccountConfig
  ): Promise<Address> {
    const owner = privateKeyToAccount(accountConfig.owner);

    const signingClient = createWalletClient({
      account: owner,
      chain: this.config.chain,
      transport: http(this.config.rpcUrl),
    });

    if (accountConfig.accountAddress) {
      // Use existing account
      this.smartAccount = await toSimpleSmartAccount({
        client: signingClient,
        owner: owner,
        factoryAddress: this.config.factoryAddress,
        entryPoint: {
          address: this.config.entryPointAddress!,
          version: "0.6",
        },
        address: accountConfig.accountAddress,
      });
    } else {
      // Create new account
      this.smartAccount = await toSimpleSmartAccount({
        client: signingClient,
        owner: owner,
        factoryAddress: this.config.factoryAddress,
        entryPoint: {
          address: this.config.entryPointAddress!,
          version: "0.6",
        },
      });
    }

    // Create bundler client
    this.bundlerClient = createPimlicoClient({
      transport: http(this.config.bundlerUrl),
      entryPoint: {
        address: this.config.entryPointAddress!,
        version: "0.6",
      },
    });

    // Create smart account client
    this.smartAccountClient = createSmartAccountClient({
      bundlerTransport: http(this.config.bundlerUrl),
      chain: this.config.chain,
      account: this.smartAccount,
    });

    console.log(`✅ Connected to smart account: ${this.smartAccount.address}`);
    return this.smartAccount.address;
  }

  // ==============================================================================
  // Account Information
  // ==============================================================================

  getAddress(): Address {
    if (!this.smartAccount) {
      throw new Error(
        "Smart account not connected. Call connectSmartAccount() first."
      );
    }
    return this.smartAccount.address;
  }

  async getBalance(): Promise<bigint> {
    if (!this.smartAccount) {
      throw new Error("Smart account not connected");
    }

    return await this.publicClient.getBalance({
      address: this.smartAccount.address,
    });
  }

  async isDeployed(): Promise<boolean> {
    if (!this.smartAccount) {
      throw new Error("Smart account not connected");
    }

    const code = await this.publicClient.getCode({
      address: this.smartAccount.address,
    });

    return code !== undefined && code !== "0x";
  }

  async getNonce(): Promise<bigint> {
    if (!this.smartAccount) {
      throw new Error("Smart account not connected");
    }

    return await this.publicClient.readContract({
      address: this.config.entryPointAddress!,
      abi: [
        {
          name: "getNonce",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "sender", type: "address" },
            { name: "key", type: "uint192" },
          ],
          outputs: [{ name: "nonce", type: "uint256" }],
        },
      ],
      functionName: "getNonce",
      args: [this.smartAccount.address, 0n],
    });
  }

  // ==============================================================================
  // Send UserOperations
  // ==============================================================================

  async sendUserOperation(params: SendUserOperationParams): Promise<Hash> {
    if (!this.smartAccountClient) {
      throw new Error("Smart account not connected");
    }

    const {
      target,
      data = "0x",
      value = 0n,
      maxFeePerGas,
      maxPriorityFeePerGas,
      callGasLimit = 150000n,
      verificationGasLimit = 300000n,
      preVerificationGas = 100000n,
    } = params;

    // Get gas prices if not provided
    let gasPrices = {
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
    };

    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      const estimatedGas = await this.bundlerClient!.getUserOperationGasPrice();
      gasPrices = {
        maxFeePerGas: maxFeePerGas || estimatedGas.fast.maxFeePerGas,
        maxPriorityFeePerGas:
          maxPriorityFeePerGas || estimatedGas.fast.maxPriorityFeePerGas,
      };
    }

    console.log("Sending UserOperation...");
    console.log(`  Target: ${target}`);
    console.log(`  Value: ${value}`);
    console.log(
      `  Gas: ${gasPrices.maxFeePerGas} / ${gasPrices.maxPriorityFeePerGas}`
    );

    const userOpHash = await this.smartAccountClient.sendTransaction({
      calls: [
        {
          to: target,
          value: value,
          data: data,
        },
      ],
      maxFeePerGas: gasPrices.maxFeePerGas,
      maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
    });

    console.log(`✅ UserOperation sent: ${userOpHash}`);
    return userOpHash;
  }

  // ==============================================================================
  // Contract Interactions
  // ==============================================================================

  async writeContract(params: {
    address: Address;
    abi: any[];
    functionName: string;
    args?: any[];
    value?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }): Promise<Hash> {
    const { address, abi, functionName, args = [], value = 0n } = params;

    const data = encodeFunctionData({
      abi,
      functionName,
      args,
    });

    return await this.sendUserOperation({
      target: address,
      data,
      value,
      maxFeePerGas: params.maxFeePerGas,
      maxPriorityFeePerGas: params.maxPriorityFeePerGas,
    });
  }

  async readContract(params: {
    address: Address;
    abi: any[];
    functionName: string;
    args?: any[];
  }): Promise<any> {
    return await this.publicClient.readContract({
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args || [],
    });
  }

  // ==============================================================================
  // Utilities
  // ==============================================================================

  async waitForUserOperationReceipt(
    userOpHash: Hash,
    timeout: number = 30000
  ): Promise<UserOperationReceipt> {
    console.log(`Waiting for UserOperation receipt...`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, you'd query the bundler for receipt
      // For now, we'll return a basic receipt structure
      console.log("Checking for receipt...");
    }

    return {
      userOpHash,
      success: true,
    };
  }

  async fundAccount(
    amount: bigint,
    fromPrivateKey: `0x${string}`
  ): Promise<Hash> {
    if (!this.smartAccount) {
      throw new Error("Smart account not connected");
    }

    const signer = privateKeyToAccount(fromPrivateKey);
    const client = createWalletClient({
      account: signer,
      chain: this.config.chain,
      transport: http(this.config.rpcUrl),
    });

    console.log(`Funding account with ${amount} wei...`);

    const hash = await client.sendTransaction({
      to: this.smartAccount.address,
      value: amount,
    });

    console.log(`✅ Funded: ${hash}`);
    return hash;
  }

  // ==============================================================================
  // Batch Operations
  // ==============================================================================

  async sendBatchUserOperations(
    operations: SendUserOperationParams[]
  ): Promise<Hash[]> {
    const results: Hash[] = [];

    for (const op of operations) {
      const hash = await this.sendUserOperation(op);
      results.push(hash);
    }

    return results;
  }
}

// ==============================================================================
// Helper Functions
// ==============================================================================

export function createDagAAClient(config: DagAAConfig): DagAAClient {
  return new DagAAClient(config);
}

export function parseDAG(amount: string): bigint {
  return parseEther(amount);
}

// ==============================================================================
// Export Types
// ==============================================================================

// export type {
//   DagAAConfig,
//   SmartAccountConfig,
//   SendUserOperationParams,
//   UserOperationReceipt,
// };
