import {
  createPublicClient,
  http,
  Hex,
  encodeFunctionData,
  type PublicClient,
  type WalletClient,
  createWalletClient,
  custom,
  keccak256,
  encodePacked,
  toBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// --- CONFIGURATION ---
// You need these specific addresses deployed on BlockDag
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // Replace with BlockDag address
const FACTORY_ADDRESS = "0x9406Cc6185a3469062968407C165Da4219552961"; // Replace with BlockDag SimpleAccountFactory

// --- ABI SNIPPETS (Minimal) ---
const factoryAbi = [
  {
    name: "createAccount",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "salt", type: "uint256" },
    ],
    outputs: [{ name: "ret", type: "address" }],
    stateMutability: "nonpayable",
  },
] as const;

const accountAbi = [
  {
    name: "execute",
    type: "function",
    inputs: [
      { name: "dest", type: "address" },
      { name: "value", type: "uint256" },
      { name: "func", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// --- INTERFACES ---
interface UserOperation {
  sender: Hex;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}

export class BlockDagSDK {
  private client: PublicClient;
  private bundlerUrl: string;
  private chainId: number;

  constructor(rpcUrl: string, bundlerUrl: string, chainId: number) {
    this.bundlerUrl = bundlerUrl;
    this.chainId = chainId;
    this.client = createPublicClient({
      transport: http(rpcUrl),
    });
  }

  // 1. CREATE ACCOUNT HELPER
  // Calculates the address of the smart account (counterfactual)
  async getAccountAddress(
    ownerPrivateKey: Hex,
    salt: bigint = 0n
  ): Promise<Hex> {
    const owner = privateKeyToAccount(ownerPrivateKey);

    // In a real SDK, we would use `readContract` but factories usually use CREATE2
    // For this minimal version, we will ask the node to simulate the call to get the address
    const result = await this.client.readContract({
      address: FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: "createAccount",
      args: [owner.address, salt],
    });

    return result;
  }

  // 2. BUILD AND SEND TRANSACTION
  async sendTransaction(
    ownerPrivateKey: Hex,
    to: Hex,
    value: bigint,
    data: Hex = "0x"
  ) {
    const owner = privateKeyToAccount(ownerPrivateKey);
    const sender = await this.getAccountAddress(ownerPrivateKey);

    // A. Check if account is deployed (to determine initCode)
    const code = await this.client.getBytecode({ address: sender });
    let initCode: Hex = "0x";

    if (!code) {
      // Account not deployed, generate initCode
      const factoryData = encodeFunctionData({
        abi: factoryAbi,
        functionName: "createAccount",
        args: [owner.address, 0n],
      });
      initCode = encodePacked(
        ["address", "bytes"],
        [FACTORY_ADDRESS, factoryData]
      );
    }

    // B. Encode the actual action (Execute)
    const callData = encodeFunctionData({
      abi: accountAbi,
      functionName: "execute",
      args: [to, value, data],
    });

    // C. Build the Partial UserOp
    // NOTE: In a real app, you MUST estimate gas properly via the bundler.
    // We are using hardcoded safety values for this minimal example.
    const userOp: any = {
      sender,
      nonce: BigInt(0), // Fetch real nonce from EntryPoint contract in prod
      initCode,
      callData,
      callGasLimit: BigInt(50000),
      verificationGasLimit: BigInt(100000),
      preVerificationGas: BigInt(50000),
      maxFeePerGas: BigInt(1000000000), // Check BlockDag gas price
      maxPriorityFeePerGas: BigInt(1000000000),
      paymasterAndData: "0x",
      signature: "0x",
    };

    // D. Hash and Sign (The core magic)
    const userOpHash = this.hashUserOp(
      userOp,
      ENTRY_POINT_ADDRESS,
      this.chainId
    );
    const signature = await owner.signMessage({ message: { raw: userOpHash } });
    userOp.signature = signature;

    // E. Send to Bundler
    return await this.submitToBundler(userOp);
  }

  // Helper: Hashing per ERC-4337 rules
  private hashUserOp(op: UserOperation, entryPoint: Hex, chainId: number): Hex {
    const packed = encodePacked(
      [
        "address",
        "uint256",
        "bytes32",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes32",
      ],
      [
        op.sender,
        op.nonce,
        keccak256(op.initCode),
        keccak256(op.callData),
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        keccak256(op.paymasterAndData),
      ]
    );

    const enc = encodePacked(
      ["bytes32", "address", "uint256"],
      [keccak256(packed), entryPoint, BigInt(chainId)]
    );

    return keccak256(enc);
  }

  // Helper: JSON-RPC Call to Bundler
  private async submitToBundler(userOp: any) {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendUserOperation",
      params: [userOp, ENTRY_POINT_ADDRESS],
    });

    const response = await fetch(this.bundlerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    return await response.json();
  }
}
