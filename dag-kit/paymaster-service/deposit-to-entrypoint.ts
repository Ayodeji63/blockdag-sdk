import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

const ENTRYPOINT_ADDRESS =
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as Address;
const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS as Address;
const PAYMASTER_PRIVATE_KEY = process.env
  .PAYMASTER_PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL || "https://rpc.awakening.bdagscan.com";

// EntryPoint ABI (deposit function)
const entryPointAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "depositTo",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
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
] as const;

const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

const paymasterAccount = privateKeyToAccount(PAYMASTER_PRIVATE_KEY);
const walletClient = createWalletClient({
  account: paymasterAccount,
  transport: http(RPC_URL),
});

async function checkBalance() {
  const balance = await publicClient.readContract({
    address: ENTRYPOINT_ADDRESS,
    abi: entryPointAbi,
    functionName: "balanceOf",
    args: [PAYMASTER_ADDRESS],
  });

  console.log(`\n💰 Current EntryPoint deposit for paymaster: ${balance} wei`);
  console.log(`   (${Number(balance) / 1e18} tokens)\n`);

  return balance;
}

async function depositToEntryPoint(amountInTokens: string) {
  try {
    console.log(`\n🔄 Depositing ${amountInTokens} tokens to EntryPoint...`);

    const hash = await walletClient.writeContract({
      address: ENTRYPOINT_ADDRESS,
      abi: entryPointAbi,
      functionName: "depositTo",
      args: [PAYMASTER_ADDRESS],
      value: parseEther(amountInTokens),
    });

    console.log(`✅ Transaction sent: ${hash}`);
    console.log(`⏳ Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`✅ Deposit confirmed in block ${receipt.blockNumber}`);

    // Check new balance
    await checkBalance();
  } catch (error) {
    console.error("❌ Deposit failed:", error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log("🚀 EntryPoint Deposit Tool");
  console.log("=".repeat(50));
  console.log(`EntryPoint: ${ENTRYPOINT_ADDRESS}`);
  console.log(`Paymaster: ${PAYMASTER_ADDRESS}`);
  console.log(`Signer: ${paymasterAccount.address}`);

  // Check current balance
  await checkBalance();

  // Deposit amount (change this value)
  const depositAmount = "0.1"; // Deposit 0.1 tokens (adjust as needed)

  await depositToEntryPoint(depositAmount);
}

main().catch(console.error);
