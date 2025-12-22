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

import { ISigner } from "@dag-kit/signer";

export interface DagAAConfig {
  chain: Chain;
  rpcUrl: string;
  bundlerUrl: string;
  factoryAddress: Address;
  entryPointAddress?: Address;
  paymasterUrl?: string;
}

export interface SmartAccountConfig {
  signer: ISigner;
  accountAddress?: Address;
}

export interface SendUserOperationParams {
  target: Address;
  data?: `0x${string}`;
  value?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
}

export interface UserOperationReceipt {
  userOpHash: Hash;
  transactionHash?: Hash;
  success: boolean;
  blockNumber?: bigint;
  blockHash?: Hash;
}
