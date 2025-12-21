// import "dotenv/config";
// import { toSimpleSmartAccount } from "permissionless/accounts";
// import {
//   createPublicClient,
//   createWalletClient,
//   http,
//   parseEther,
//   encodeFunctionData,
//   defineChain,
// } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { createPimlicoClient } from "permissionless/clients/pimlico";
// import { entryPoint06Address } from "viem/account-abstraction";
// import { createSmartAccountClient } from "permissionless";
// import { abi } from "./contract";

// // Configuration
// const adminKey =
//   "0x5810098e367422376897bb2645c5ada5850a99aeec0505a58d38853ebd7f9f31";
// const FACTORY_ADDRESS = "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3"; // Your factory
// const TARGET_ADDRESS = "0x7fd5385efcB7B2898933288948a9496CDc0fA8ee"; // Your desired address

// // BlockDAG Awakening Testnet
// const awakening = defineChain({
//   id: 1043,
//   name: "Awakening Testnet",
//   nativeCurrency: { decimals: 18, name: "Dag", symbol: "DAG" },
//   rpcUrls: { default: { http: ["https://relay.awakening.bdagscan.com"] } },
//   blockExplorers: {
//     default: { name: "Explorer", url: "https://awakening.bdagscan.com/" },
//   },
// });

// const localBundler = "http://0.0.0.0:3000/";

// console.log("\n🔍 Using Your Existing Address");
// console.log("=================================\n");

// const publicClient = createPublicClient({
//   chain: awakening,
//   transport: http(awakening.rpcUrls.default.http[0]),
// });

// const walletClient = createWalletClient({
//   account: privateKeyToAccount(adminKey),
//   chain: awakening,
//   transport: http(awakening.rpcUrls.default.http[0]),
// });

// console.log(`Target Address: ${TARGET_ADDRESS}`);
// console.log(`Owner: ${privateKeyToAccount(adminKey).address}`);
// console.log(`Factory: ${FACTORY_ADDRESS}\n`);

// // Step 1: Create account using the specific address
// // Since the account is already deployed, we just need to reference it
// const account = await toSimpleSmartAccount({
//   client: publicClient,
//   owner: privateKeyToAccount(adminKey),
//   factoryAddress: FACTORY_ADDRESS,
//   entryPoint: {
//     address: entryPoint06Address,
//     version: "0.6",
//   },
//   address: TARGET_ADDRESS, // Use the existing address directly
// });

// console.log("=== Smart Account Information ===");
// console.log(`Address: ${account.address}`);
// console.log(
//   `Explorer: https://awakening.bdagscan.com/address/${account.address}`
// );
// console.log("✅ Using your existing account\n");

// // Check if deployed
// const code = await publicClient.getCode({
//   address: account.address,
// });

// const isDeployed = code && code !== "0x";
// console.log(
//   `Deployment Status: ${isDeployed ? "✅ Deployed" : "⚠️ Not deployed"}`
// );

// // Check balance
// const balance = await publicClient.getBalance({
//   address: account.address,
// });

// const balanceInDAG = Number(balance) / 1e18;
// console.log(`Balance: ${balanceInDAG} DAG`);

// if (!isDeployed) {
//   console.log("\n⚠️ Account not deployed yet.");
//   console.log("The account should already be deployed based on the explorer.");
//   console.log("If you need to deploy it, do so manually first.\n");
// }

// // Step 3: Test bundler connection
// console.log("=== Testing Bundler ===");
// try {
//   const dagClient = createPimlicoClient({
//     transport: http(localBundler),
//     entryPoint: {
//       address: entryPoint06Address,
//       version: "0.6",
//     },
//   });

//   const gasPrice = await dagClient.getUserOperationGasPrice();
//   console.log("✅ Bundler responding");
//   console.log(`Gas Price: ${gasPrice.fast.maxFeePerGas} wei\n`);
// } catch (error: any) {
//   console.error("❌ Bundler not responding:", error.message);
//   console.log("\n💡 Start Alto bundler:");
//   console.log(`./alto \\
//   --entrypoints "${entryPoint06Address}" \\
//   --executor-private-keys "${adminKey}" \\
//   --utility-private-key "${adminKey}" \\
//   --rpc-url "https://relay.awakening.bdagscan.com" \\
//   --port 3000 \\
//   --safe-mode false \\
//   --dangerous-skip-user-operation-validation true`);
//   process.exit(1);
// }

// // Step 4: Send test UserOperation
// console.log("=== Sending Test UserOperation ===");

// const smartAccountClient = createSmartAccountClient({
//   bundlerTransport: http(localBundler),
//   chain: awakening,
//   account,
// });

// const cd = encodeFunctionData({
//   abi,
//   functionName: "decrement",
//   args: [],
// });

// try {
//   // Simple test: send 0 value to self
//   const txHash = await smartAccountClient.sendTransaction({
//     to: "0x692e69cA1Fe89eF72ca94B0E3a32A92835501a08",
//     value: 0n,
//     data: cd,
//     maxFeePerGas: 50000000000n, // 50 gwei
//     maxPriorityFeePerGas: 50000000000n, // 50 gwei
//     callGasLimit: 150000n,
//     verificationGasLimit: 500000n,
//     preVerificationGas: 100000n,
//   });

//   console.log(`\n✅ Success!`);
//   console.log(`UserOperation Hash: ${txHash}`);
//   console.log(`Explorer: https://awakening.bdagscan.com/tx/${txHash}`);

//   console.log("\n⏳ Waiting for confirmation...");
//   await new Promise((resolve) => setTimeout(resolve, 5000));

//   const newBalance = await publicClient.getBalance({
//     address: account.address,
//   });
//   const newBalanceInDAG = Number(newBalance) / 1e18;
//   console.log(`\nFinal Balance: ${newBalanceInDAG} DAG`);
//   console.log(`Gas Cost: ${balanceInDAG - newBalanceInDAG} DAG`);

//   console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//   console.log("🎉 Success! Your account is ready for reuse.");
//   console.log(`   Address: ${TARGET_ADDRESS}`);
//   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

//   const result = await publicClient.readContract({
//     address: "0x692e69cA1Fe89eF72ca94B0E3a32A92835501a08",
//     abi: abi,
//     functionName: "getNum",
//   });

//   console.log("Result is given as", result);
// } catch (error: any) {
//   console.error("\n❌ Transaction failed:");
//   console.error(error.message);

//   if (error.message?.includes("Missing or invalid parameters")) {
//     console.log("\n⚠️ This is the known Awakening RPC issue.");
//     console.log("The RPC cannot properly handle eth_call for UserOperations.");
//     console.log(
//       "\nYour setup is correct - the issue is with Awakening's RPC implementation."
//     );
//   }

//   if (error.details) {
//     console.log("\nDetails:", error.details);
//   }
// }

// // Instructions for reuse
// console.log("\n💾 To reuse this address in future scripts:");
// console.log(`
// const account = await toSimpleSmartAccount({
//   client: publicClient,
//   owner: privateKeyToAccount(adminKey),
//   factoryAddress: "${FACTORY_ADDRESS}",
//   entryPoint: {
//     address: entryPoint06Address,
//     version: "0.6",
//   },
//   address: "${TARGET_ADDRESS}", // Your existing account
// });
// `);
