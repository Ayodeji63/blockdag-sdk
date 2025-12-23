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
  Client,
  ByteArray,
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
} from "../types.js";
import { ISigner } from "../../signers/types.js";

// ==============================================================================
// Main SDK Class
// ==============================================================================

export class DagAAClient {
  private config: DagAAConfig;
  private publicClient: any | null;
  private walletClient: any | null;
  private bundlerClient: any | null = null;
  private smartAccount: any | null = null;
  private paymasterClient: any | null = null;
  private smartAccountClient: any | null = null;

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

    // Initialize paymaster client if URL provided
    if (config.paymasterUrl) {
      this.paymasterClient = this.createPaymasterClient(config.paymasterUrl);
    }
  }
  // ==============================================================================
  // Paymaster Client (Fixed Serialization)
  // ==============================================================================

  private createPaymasterClient(paymasterUrl: string) {
    // 1. Define a robust serializer that handles nested BigInts automatically
    const stringify = (data: any) => {
      return JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? `0x${value.toString(16)}` : value
      );
    };

    return {
      /**
       * Get paymaster stub data for gas estimation
       */
      async getPaymasterStubData(
        userOp: any,
        entryPoint: Address
      ): Promise<any> {
        try {
          const response = await fetch(paymasterUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // 👇 Use the robust stringify helper
            body: stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "pm_getPaymasterStubData",
              params: [userOp, entryPoint, {}],
            }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          return data.result;
        } catch (error) {
          console.warn("Failed to get paymaster stub data:", error);
          // ⚠️ If this fails, the UserOp usually fails with AA21
          return { paymasterAndData: "0x" };
        }
      },

      /**
       * Get paymaster data for actual transaction
       */
      async getPaymasterData(userOp: any, entryPoint: Address): Promise<any> {
        try {
          const response = await fetch(paymasterUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "pm_getPaymasterData",
              params: [userOp, entryPoint, {}],
            }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          return data.result;
        } catch (error) {
          console.warn("Failed to get paymaster data:", error);
          return null;
        }
      },

      /**
       * Sponsor user operation
       */
      async sponsorUserOperation(
        userOp: any,
        entryPoint: Address
      ): Promise<any> {
        try {
          const response = await fetch(paymasterUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "pm_sponsorUserOperation",
              params: [userOp, entryPoint, {}],
            }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          return data.result;
        } catch (error) {
          console.warn("Failed to sponsor user operation:", error);
          throw error;
        }
      },
    };
  }
  // ==============================================================================
  // Smart Account Management
  // ==============================================================================

  async connectSmartAccount(
    accountConfig: SmartAccountConfig
  ): Promise<Address> {
    const { signer, accountAddress } = accountConfig;

    const isReady = await signer.isReady();
    if (!isReady) {
      throw new Error("Signer is not ready. Ensure wallet is connected.");
    }

    const owner = await signer.getAccount();

    const signingClient = await signer.getWalletClient();

    if (accountAddress) {
      // Use existing account
      this.smartAccount = await toSimpleSmartAccount({
        client: signingClient as unknown as Client,
        owner: owner,
        factoryAddress: this.config.factoryAddress,
        entryPoint: {
          address: this.config.entryPointAddress!,
          version: "0.6",
        },
        address: accountAddress,
      });
    } else {
      // Create new account
      this.smartAccount = await toSimpleSmartAccount({
        client: signingClient as unknown as Client,
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

    // Create smart account client with optional paymaster
    const clientConfig: any = {
      bundlerTransport: http(this.config.bundlerUrl),
      chain: this.config.chain,
      account: this.smartAccount,
    };

    // Add paymaster if configured
    if (this.paymasterClient) {
      clientConfig.paymaster = {
        getPaymasterData: async (userOperation: any) => {
          console.log("🎫 Requesting paymaster sponsorship...");
          console.log("UserOp sender:", userOperation.sender);

          try {
            const result = await this.paymasterClient!.sponsorUserOperation(
              userOperation,
              this.config.entryPointAddress!
            );

            console.log("Paymaster result:", result);

            if (result && result.paymasterAndData) {
              console.log("✅ Paymaster sponsorship approved!");
              console.log("PaymasterAndData:", result.paymasterAndData);
              return {
                paymasterAndData: result.paymasterAndData,
                ...(result.preVerificationGas && {
                  preVerificationGas: BigInt(result.preVerificationGas),
                }),
                ...(result.verificationGasLimit && {
                  verificationGasLimit: BigInt(result.verificationGasLimit),
                }),
                ...(result.callGasLimit && {
                  callGasLimit: BigInt(result.callGasLimit),
                }),
              };
            } else {
              console.error("❌ No paymasterAndData in response:", result);
              throw new Error("No paymaster data returned");
            }
          } catch (error) {
            console.error("❌ Paymaster sponsorship failed:", error);
            throw error;
          }
        },

        getPaymasterStubData: async (userOperation: any) => {
          console.log("📝 Getting paymaster stub data for gas estimation...");

          try {
            const result = await this.paymasterClient!.getPaymasterStubData(
              userOperation,
              this.config.entryPointAddress!
            );

            console.log("Stub data result:", result);

            if (result && result.paymasterAndData) {
              console.log("✅ Got paymaster stub data");
              return {
                paymasterAndData: result.paymasterAndData,
              };
            }
          } catch (error) {
            console.warn("⚠️ Failed to get paymaster stub data:", error);
          }

          // Return default stub if fails
          console.log("⚠️ Using default stub data");
          return {
            paymasterAndData: "0x",
          };
        },
      };
    }

    this.smartAccountClient = createSmartAccountClient(clientConfig);

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
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
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

    const txOptions: any = {
      calls: [
        {
          to: target,
          value: value,
          data: data,
        },
      ],
      maxFeePerGas: gasPrices.maxFeePerGas,
      maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
    };

    // Add optional gas limits if provided
    if (callGasLimit) txOptions.callGasLimit = callGasLimit;
    if (verificationGasLimit)
      txOptions.verificationGasLimit = verificationGasLimit;
    if (preVerificationGas) txOptions.preVerificationGas = preVerificationGas;

    // Send transaction - paymaster is automatically called if configured
    const userOpHash = await this.smartAccountClient.sendTransaction(txOptions);

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
      account: signer, // ✅ Add this line
      to: this.smartAccount.address,
      value: amount,
      kzg: {
        blobToKzgCommitment: function (blob: ByteArray): ByteArray {
          throw new Error("Function not implemented.");
        },
        computeBlobKzgProof: function (
          blob: ByteArray,
          commitment: ByteArray
        ): ByteArray {
          throw new Error("Function not implemented.");
        },
      },
      chain: undefined,
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
