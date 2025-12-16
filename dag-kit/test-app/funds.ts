import "dotenv/config";
import {
  createWalletClient,
  createPublicClient,
  defineChain,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Your funded wallet private key (the one with DAG balance)
const FUNDER_PRIVATE_KEY =
  "0x5810098e367422376897bb2645c5ada5850a99aeec0505a58d38853ebd7f9f31";

// The smart account address that needs funding
const SMART_ACCOUNT_ADDRESS = "0xd350B7120C161a9ddE61DCEB195a1aE38F124364";

// Amount to send (0.01 DAG should be enough for several transactions)
const AMOUNT = "5";

const awakening = defineChain({
  id: 1043,
  name: "Awakening Testnet",
  nativeCurrency: { decimals: 18, name: "Dag", symbol: "DAG" },
  rpcUrls: { default: { http: ["https://rpc.awakening.bdagscan.com"] } },
  blockExplorers: {
    default: { name: "Explorer", url: "https://awakening.bdagscan.com/" },
  },
});

const publicClient = createPublicClient({
  chain: awakening,
  transport: http(),
});

const account = privateKeyToAccount(FUNDER_PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: awakening,
  transport: http(),
});

console.log("\n=== Funding Smart Account ===");
console.log(`From: ${account.address}`);
console.log(`To: ${SMART_ACCOUNT_ADDRESS}`);
console.log(`Amount: ${AMOUNT} DAG`);

// Check funder balance
const balance = await publicClient.getBalance({
  address: account.address,
});

const balanceInDAG = Number(balance) / 1e18;
console.log(`\nFunder Balance: ${balanceInDAG} DAG`);

if (balance === 0n) {
  console.error("❌ Funder account has no balance!");
}

const amountToSend = parseEther(AMOUNT);
if (balance < amountToSend) {
  console.error(
    `❌ Insufficient balance. Need ${AMOUNT} DAG, have ${balanceInDAG} DAG`
  );
}

// Send funds
try {
  console.log("\nSending transaction...");

  const hash = await walletClient.sendTransaction({
    to: "0x0FB6d53E5F8b88431f561c5D5BD317E0F04E50f4",
    value: amountToSend,
  });

  console.log(`Transaction sent: ${hash}`);
  console.log(`Explorer: https://awakening.bdagscan.com/tx/${hash}`);

  // Wait for confirmation
  console.log("\nWaiting for confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === "success") {
    console.log("✅ Transaction confirmed!");

    // Check new balance
    const newBalance = await publicClient.getBalance({
      address: SMART_ACCOUNT_ADDRESS,
    });
    const newBalanceInDAG = Number(newBalance) / 1e18;
    console.log(`\nSmart Account New Balance: ${newBalanceInDAG} DAG`);
  } else {
    console.error("❌ Transaction failed");
  }
} catch (error) {
  if (error instanceof Error) console.error("❌ Error:", error.message);
}
