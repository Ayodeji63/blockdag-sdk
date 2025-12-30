import express from "express";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  encodeFunctionData,
  type Address,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3001;
const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS as Address;
const PAYMASTER_PRIVATE_KEY = process.env
  .PAYMASTER_PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL || "https://relay.awakening.bdagscan.com";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "1");

if (!PAYMASTER_ADDRESS) {
  console.error("❌ Error: PAYMASTER_ADDRESS is not set in .env file");
  process.exit(1);
}

if (!PAYMASTER_PRIVATE_KEY) {
  console.error("❌ Error: PAYMASTER_PRIVATE_KEY is not set in .env file");
  process.exit(1);
}

// Initialize clients
const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

const paymasterAccount = privateKeyToAccount(PAYMASTER_PRIVATE_KEY);
const walletClient = createWalletClient({
  account: paymasterAccount,
  transport: http(RPC_URL),
});

// Paymaster ABI (simplified - adjust based on your contract)
const paymasterAbi = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IEntryPoint",
        name: "entryPoint_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "enum IPaymaster.PostOpMode",
        name: "mode",
        type: "uint8",
      },
      {
        internalType: "bytes",
        name: "context",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "actualGasCost",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "actualUserOpFeePerGas",
        type: "uint256",
      },
    ],
    name: "postOp",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "userOpHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "gasSponsored",
        type: "uint256",
      },
    ],
    name: "UserOperationSponsored",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
  {
    inputs: [],
    name: "entryPoint",
    outputs: [
      {
        internalType: "contract IEntryPoint",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "sponsorshipDeposit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "callData",
            type: "bytes",
          },
          {
            internalType: "bytes32",
            name: "accountGasLimits",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "preVerificationGas",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "gasFees",
            type: "bytes32",
          },
          {
            internalType: "bytes",
            name: "paymasterAndData",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct PackedUserOperation",
        name: "userOp",
        type: "tuple",
      },
      {
        internalType: "bytes32",
        name: "userOpHash",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "maxCostpure",
        type: "uint256",
      },
    ],
    name: "validatePaymasterUserOp",
    outputs: [
      {
        internalType: "bytes",
        name: "context",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "validationData",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const app = express();
app.use(express.json());
app.use(cors());

// Types
interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
}

interface PaymasterResponse {
  paymasterAndData: string;
  preVerificationGas?: string;
  verificationGasLimit?: string;
  callGasLimit?: string;
}

// Helper: Calculate UserOperation hash
// function getUserOpHash(
//   userOp: UserOperation,
//   entryPoint: Address,
//   chainId: number
// ): Hash {
//   const packedData = encodeFunctionData({
//     abi: paymasterAbi
//     functionName: "hash",
//     args: [
//       {
//         sender: userOp.sender,
//         nonce: userOp.nonce,
//         initCode: userOp.initCode,
//         callData: userOp.callData,
//         callGasLimit: userOp.callGasLimit,
//         verificationGasLimit: userOp.verificationGasLimit,
//         preVerificationGas: userOp.preVerificationGas,
//         maxFeePerGas: userOp.maxFeePerGas,
//         maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
//         paymasterAndData: userOp.paymasterAndData,
//       },
//     ],
//   });

//   return packedData as Hash;
// }

// Sponsorship policy - customize this based on your needs
function shouldSponsor(userOp: UserOperation): boolean {
  // Add your sponsorship logic here
  // Examples:
  // - Whitelist certain addresses
  // - Limit by transaction value
  // - Rate limiting
  // - Require certain contract interactions

  // For now, sponsor everything (NOT RECOMMENDED FOR PRODUCTION)
  return true;
}

// RPC Method: pm_sponsorUserOperation
app.post("/rpc", async (req, res) => {
  const { method, params, id, jsonrpc } = req.body;

  try {
    if (method === "pm_sponsorUserOperation") {
      const [userOp, entryPoint, context] = params;

      // Validate sponsorship
      if (!shouldSponsor(userOp)) {
        return res.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32003,
            message: "User operation not eligible for sponsorship",
          },
        });
      }

      // Check paymaster has enough funds
      const deposit = await publicClient.getBalance({
        address: PAYMASTER_ADDRESS,
      });

      if (deposit < BigInt(1e18)) {
        // Less than 1 DAG
        console.warn("⚠️ Low paymaster deposit:", deposit.toString());
      }

      // Generate paymaster data
      // Format: paymasterAddress + validUntil + validAfter + signature
      const validUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      const validAfter = Math.floor(Date.now() / 1000) - 60; // 1 min ago

      // Simple paymaster data (adjust based on your paymaster implementation)
      const paymasterAndData = `${PAYMASTER_ADDRESS}${validUntil.toString(16).padStart(12, "0")}${validAfter.toString(16).padStart(12, "0")}${"0".repeat(130)}`; // Placeholder signature

      const response: PaymasterResponse = {
        paymasterAndData,
        preVerificationGas: userOp.preVerificationGas.toString(),
        verificationGasLimit: userOp.verificationGasLimit.toString(),
        callGasLimit: userOp.callGasLimit.toString(),
      };

      return res.json({
        jsonrpc: "2.0",
        id,
        result: response,
      });
    }

    if (method === "pm_getPaymasterStubData") {
      // Return stub data for gas estimation
      const [userOp, entryPoint, context] = params;

      const paymasterAndData = `${PAYMASTER_ADDRESS}${"0".repeat(154)}`; // Stub data

      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          paymasterAndData,
        },
      });
    }

    if (method === "pm_getPaymasterData") {
      // Similar to pm_sponsorUserOperation but with different response format
      const [userOp, entryPoint, context] = params;

      const validUntil = Math.floor(Date.now() / 1000) + 3600;
      const validAfter = Math.floor(Date.now() / 1000) - 60;

      const paymasterAndData = `${PAYMASTER_ADDRESS}${validUntil.toString(16).padStart(12, "0")}${validAfter.toString(16).padStart(12, "0")}${"0".repeat(130)}`;

      return res.json({
        jsonrpc: "2.0",
        id,
        result: paymasterAndData,
      });
    }

    // Method not supported
    return res.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: "Method not found",
      },
    });
  } catch (error) {
    console.error("Paymaster error:", error);
    return res.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Internal error",
      },
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", paymaster: PAYMASTER_ADDRESS });
});

// Get paymaster info
app.get("/info", async (req, res) => {
  try {
    const deposit = await publicClient.getBalance({
      address: PAYMASTER_ADDRESS,
    });

    res.json({
      paymasterAddress: PAYMASTER_ADDRESS,
      deposit: deposit.toString(),
      signer: paymasterAccount.address,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch info" });
  }
});

// Fund paymaster (admin endpoint - add auth in production)
app.post("/fund", async (req, res) => {
  const { amount } = req.body; // Amount in DAG

  try {
    const hash = await walletClient.writeContract({
      address: PAYMASTER_ADDRESS,
      abi: paymasterAbi,
      functionName: "deposit",
      value: BigInt(amount) * BigInt(1e18),
    });

    res.json({ hash, message: "Paymaster funded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fund paymaster" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Paymaster service running on http://localhost:${PORT}`);
  console.log(`📍 Paymaster address: ${PAYMASTER_ADDRESS}`);
  console.log(`👤 Signer: ${paymasterAccount.address}`);
});

export default app;
