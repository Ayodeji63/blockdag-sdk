import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatEther,
  http,
  parseEther,
  parseGwei,
} from "viem";
import { awakening } from "../chains";
import { privateKeyToAccount } from "viem/accounts";
import { entryPoint06Address } from "viem/account-abstraction";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { abi } from "./contract";

const { bundler_rpc, chain_config } = awakening;
const FACTORY_ADDRESS = "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3";
const adminKey =
  "0x6b0f66a03b67d7b9eaa6c31123ffe5bf2ee58eb40ab86c8a14d6f1294838b0c8";

const publicClient = createPublicClient({
  chain: awakening.chain_config,
  transport: http(awakening.chain_config.rpcUrls.default.http[0]),
});

const walletClient = createWalletClient({
  account: privateKeyToAccount(adminKey),
  chain: chain_config,
  transport: http(chain_config.rpcUrls.default.http[0]),
});

const account = await toSimpleSmartAccount({
  client: publicClient,
  owner: privateKeyToAccount(adminKey),
  factoryAddress: FACTORY_ADDRESS,
  entryPoint: {
    address: entryPoint06Address,
    version: "0.6",
  },
  index: 100n,
});

console.log("Account Address: %s", account.address);
// Check if account is deployed
let code = await publicClient.getCode({
  address: account.address,
});

let isDeployed = code && code !== "0x";
console.log(
  `Deployment Status: ${isDeployed ? "✅ Deployed" : "⚠️ Not deployed"}`
);

if (!isDeployed) {
  const fundTx = await walletClient.sendTransaction({
    to: account.address,
    value: parseEther("10"),
    chain: undefined,
  });

  await publicClient.waitForTransactionReceipt({
    hash: fundTx,
    timeout: 120_000,
    pollingInterval: 5_000,
  });
  console.log("Account funded");
}

console.log("\n==== Sending Test UserOperation =====");
const cd = encodeFunctionData({
  abi,
  functionName: "increment",
  args: [],
});

const smartAccountClient = createSmartAccountClient({
  bundlerTransport: http(bundler_rpc),
  chain: awakening,
  account,
});

// Simple test: send 0 ETH to self (just to test the flow)
try {
  // Get current gas prices from the bundler
  const dagClient = createPimlicoClient({
    transport: http(bundler_rpc),
    entryPoint: {
      address: entryPoint06Address,
      version: "0.6",
    },
  });

  const balance = await publicClient.getBalance({
    address: account.address,
  });
  const balanceInETH = Number(balance) / 1e18;

  const gasPrices = await dagClient.getUserOperationGasPrice();
  console.log("Using gas prices:", gasPrices.fast);

  const SAFE_GAS_PRICE = parseGwei("50"); // 100 Gwei

  console.log("SAFE gas prices:", formatEther(SAFE_GAS_PRICE));

  const txHash = await smartAccountClient.sendTransaction({
    to: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3", // Send to self
    value: 0n,
    data: cd,
    maxFeePerGas: SAFE_GAS_PRICE,
    maxPriorityFeePerGas: SAFE_GAS_PRICE,
    // Keep your high limits
    callGasLimit: 150000n,
    verificationGasLimit: 500000n, // Bumped for safety
    preVerificationGas: 100000n,
  });

  console.log(`\n✅ Success!`);
  console.log(`UserOperation Hash: ${txHash}`);
  console.log(`Transaction: https://awakening.bdagscan.com/tx/${txHash}`);

  // Wait a moment for the transaction to be included
  console.log("\nWaiting for transaction to be mined...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const newBalance = await publicClient.getBalance({
    address: account.address,
  });
  const newBalanceInETH = Number(newBalance) / 1e18;
  console.log(`\nFinal Balance: ${newBalanceInETH} ETH`);
  console.log(`Gas Cost: ${balanceInETH - newBalanceInETH} ETH`);

  console.log("\n🎉 Account Abstraction is working on Awakening!");
  console.log(
    "This proves your setup is correct - the issue is specific to Awakening testnet."
  );
} catch (error: any) {
  console.error("\n❌ Transaction failed:");
  console.error(error.message);

  if (error.details) {
    console.error("\nDetails:", error.details);
  }
}
