// import { awakening } from "../chains";
// import { createDagAAClient, parseDAG } from "./main";
// import { generatePrivateKey } from "viem/accounts";
// import { config as dotenvConfig } from "dotenv";
// dotenvConfig();

// const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_1 as `0x${string}`;
// const ownerPrivy = generatePrivateKey();

// (async () => {
//   console.log("Sending Simple Transaction");

//   const client = createDagAAClient({
//     chain: awakening.chain_config,
//     rpcUrl: "https://rpc.awakening.bdagscan.com",
//     bundlerUrl: awakening.bundler_rpc,
//     factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
//     paymasterUrl: "http://localhost:3001/rpc",
//   });

//   await client.connectSmartAccount({
//     owner: "0x6b0f66a03b67d7b9eaa6c31123ffe5bf2ee58eb40ab86c8a14d6f1294838b0c8",
//     // accountAddress: "0xDe10aaC59f659fA154C063153AB3f7Cca1fb23A5",
//   });

//   // Send 0.01 DAG to an address
//   const txHash = await client.sendUserOperation({
//     target: "0x1749be926ef79a63a285b01263f7ddc350d435e6",
//     value: parseDAG("0"), // 0.01 DAG
//     maxFeePerGas: 50000000000n,
//     maxPriorityFeePerGas: 50000000000n,
//   });

//   console.log(`Transaction: ${txHash}`);

//   console.log("\n📦 Example : Batch Operations");
//   console.log("═══════════════════════════\n");

//   // await client.connectSmartAccount({
//   //   owner: PRIVATE_KEY_2,
//   //   accountAddress: "0x7fd5385efcB7B2898933288948a9496CDc0fA8ee",
//   // });

//   // // Send multiple operations
//   // const hashes = await client.sendBatchUserOperations([
//   //   {
//   //     target: "0x1749be926ef79a63a285b01263f7ddc350d435e6",
//   //     value: parseDAG("0.5"),
//   //   },
//   //   {
//   //     target: "0x8371e519177f81b93287f750dcd06ce894c12cc5",
//   //     value: parseDAG("0.5"),
//   //   },
//   // ]);

//   // console.log(`Sent ${hashes.length} operations`);
//   // hashes.forEach((hash, i) => {
//   //   console.log(`  ${i + 1}. ${hash}`);
//   // });
// })();
