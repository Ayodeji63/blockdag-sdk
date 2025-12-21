// import { defineChain } from "viem";
// import { createDagAAClient, parseDAG } from "./main";
// import { type Hash } from "viem";
// import { abi } from "./contract";
// import { config as dotenvConfig } from "dotenv";
// dotenvConfig();
// // ==============================================================================
// // Configuration
// // ==============================================================================

// const awakening = defineChain({
//   id: 1043,
//   name: "Awakening Testnet",
//   nativeCurrency: { decimals: 18, name: "Dag", symbol: "DAG" },
//   rpcUrls: { default: { http: ["https://relay.awakening.bdagscan.com"] } },
//   blockExplorers: {
//     default: { name: "Explorer", url: "https://awakening.bdagscan.com/" },
//   },
// });

// // Your contract ABI
// const counterAbi = [
//   {
//     name: "increment",
//     type: "function",
//     stateMutability: "nonpayable",
//     inputs: [],
//     outputs: [],
//   },
//   {
//     name: "counter",
//     type: "function",
//     stateMutability: "view",
//     inputs: [],
//     outputs: [{ name: "", type: "uint256" }],
//   },
// ];

// // ==============================================================================
// // Example 1: Basic Usage
// // ==============================================================================
// const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_2 as `0x${string}`;

// async function basicExample() {
//   console.log("\n📦 Example 1: Basic Usage");
//   console.log("═══════════════════════════\n");

//   // Create the client
//   const client = createDagAAClient({
//     chain: awakening,
//     rpcUrl: "https://relay.awakening.bdagscan.com",
//     bundlerUrl: "http://0.0.0.0:3000",
//     factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
//   });
//   // Connect to your existing smart account
//   await client.connectSmartAccount({
//     owner: PRIVATE_KEY_1,
//     accountAddress: "0x7fd5385efcB7B2898933288948a9496CDc0fA8ee",
//   });

//   // Get account info
//   const address = client.getAddress();
//   const balance = await client.getBalance();
//   const isDeployed = await client.isDeployed();
//   const nonce = await client.getNonce();

//   console.log(`Address: ${address}`);
//   console.log(`Balance: ${Number(balance) / 1e18} DAG`);
//   console.log(`Deployed: ${isDeployed ? "Yes" : "No"}`);
//   console.log(`Nonce: ${nonce}`);
// }

// // ==============================================================================
// // Example 2: Send Simple Transfer
// // ==============================================================================

// async function transferExample() {
//   console.log("\n💸 Example 2: Send Transfer");
//   console.log("═══════════════════════════\n");

//   const client = createDagAAClient({
//     chain: awakening,
//     rpcUrl: "https://relay.awakening.bdagscan.com",
//     bundlerUrl: "http://0.0.0.0:3000",
//     factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
//   });

//   await client.connectSmartAccount({
//     owner: PRIVATE_KEY_1,
//     accountAddress: "0x7fd5385efcB7B2898933288948a9496CDc0fA8ee",
//   });

//   // Send 0.01 DAG to an address
//   const txHash = await client.sendUserOperation({
//     target: "0x1749be926ef79a63a285b01263f7ddc350d435e6",
//     value: parseDAG("1"), // 0.01 DAG
//     maxFeePerGas: 50000000000n,
//     maxPriorityFeePerGas: 50000000000n,
//   });

//   console.log(`Transaction: ${txHash}`);
// }

// // ==============================================================================
// // Example 3: Call Smart Contract (Write)
// // ==============================================================================

// async function contractWriteExample() {
//   console.log("\n📝 Example 3: Contract Write");
//   console.log("═══════════════════════════\n");

//   const client = createDagAAClient({
//     chain: awakening,
//     rpcUrl: "https://relay.awakening.bdagscan.com",
//     bundlerUrl: "http://0.0.0.0:3000",
//     factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
//   });

//   await client.connectSmartAccount({
//     owner: PRIVATE_KEY_1,
//     accountAddress: "0x7fd5385efcB7B2898933288948a9496CDc0fA8ee",
//   });

//   // Call increment() on counter contract
//   const txHash = await client.writeContract({
//     address: "0x692e69cA1Fe89eF72ca94B0E3a32A92835501a08",
//     abi,
//     functionName: "increment",
//     maxFeePerGas: 50000000000n,
//     maxPriorityFeePerGas: 50000000000n,
//   });

//   console.log(`Transaction: ${txHash}`);
//   console.log(`https://awakening.bdagscan.com/tx/${txHash}`);
// }

// // ==============================================================================
// // Example 4: Read Contract Data
// // ==============================================================================

// async function contractReadExample() {
//   console.log("\n🔍 Example 4: Contract Read");
//   console.log("═══════════════════════════\n");

//   const client = createDagAAClient({
//     chain: awakening,
//     rpcUrl: "https://relay.awakening.bdagscan.com",
//     bundlerUrl: "http://0.0.0.0:3000",
//     factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
//   });

//   await client.connectSmartAccount({
//     owner: PRIVATE_KEY_1,
//     accountAddress: "0x7fd5385efcB7B2898933288948a9496CDc0fA8ee",
//   });

//   // Read counter value
//   const counterValue = await client.readContract({
//     address: "0x692e69cA1Fe89eF72ca94B0E3a32A92835501a08",
//     abi,
//     functionName: "getNum",
//   });

//   console.log(`Counter value: ${counterValue}`);
// }

// // ==============================================================================
// // Example 5: Batch Operations
// // ==============================================================================

// async function batchExample() {
//   console.log("\n📦 Example 5: Batch Operations");
//   console.log("═══════════════════════════\n");

//   const client = createDagAAClient({
//     chain: awakening,
//     rpcUrl: "https://relay.awakening.bdagscan.com",
//     bundlerUrl: "http://0.0.0.0:3000",
//     factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
//   });

//   await client.connectSmartAccount({
//     owner: PRIVATE_KEY_1,
//     accountAddress: "0x7fd5385efcB7B2898933288948a9496CDc0fA8ee",
//   });

//   // Send multiple operations
//   const hashes = await client.sendBatchUserOperations([
//     {
//       target: "0x1749be926ef79a63a285b01263f7ddc350d435e6",
//       value: parseDAG("0.5"),
//     },
//     {
//       target: "0x8371e519177f81b93287f750dcd06ce894c12cc5",
//       value: parseDAG("0.5"),
//     },
//   ]);

//   console.log(`Sent ${hashes.length} operations`);
//   hashes.forEach((hash, i) => {
//     console.log(`  ${i + 1}. ${hash}`);
//   });
// }

// // ==============================================================================
// // Example 6: Fund Account
// // ==============================================================================

// async function fundingExample() {
//   console.log("\n💰 Example 6: Fund Account");
//   console.log("═══════════════════════════\n");

//   const client = createDagAAClient({
//     chain: awakening,
//     rpcUrl: "https://relay.awakening.bdagscan.com",
//     bundlerUrl: "http://0.0.0.0:3000",
//     factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
//   });

//   await client.connectSmartAccount({
//     owner: PRIVATE_KEY_1,
//     accountAddress: "0x7fd5385efcB7B2898933288948a9496CDc0fA8ee",
//   });

//   // Fund from EOA
//   const txHash = await client.fundAccount(
//     parseDAG("1"), // 1 DAG
//     "0x5810098e367422376897bb2645c5ada5850a99aeec0505a58d38853ebd7f9f31" // From this private key
//   );

//   console.log(`Funded: ${txHash}`);
// }

// // ==============================================================================
// // Run Examples
// // ==============================================================================

// async function main() {
//   try {
//     // Run the example you want
//     // await basicExample();
//     // await transferExample();
//     // await contractWriteExample();
//     await contractReadExample();
//     // await batchExample();
//     // await fundingExample();
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// main();
