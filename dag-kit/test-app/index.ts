import { createDagAAClient, awakening, parseDAG } from "@dag-kit/kit";
import { abi, nftAbi, nftAddress, tokenAbi, tokenAddress } from "./contract";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { randomBytes } from "crypto";
import { encodeFunctionData, formatEther } from "viem";
import { hash } from "crypto";
import process from "process";
// This private key will ALWAYS map to the same smart account
const OWNER_PRIVATE_KEY = generatePrivateKey();

const getSmartAccount = async () => {
  const client = createDagAAClient({
    chain: awakening.chain_config,
    rpcUrl: "https://rpc.awakening.bdagscan.com",
    bundlerUrl: awakening.bundler_rpc,
    factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
    paymasterUrl: "http://localhost:3001/rpc",
  });

  const account = await client.connectSmartAccount({
    owner: OWNER_PRIVATE_KEY,
  });

  // Debug: Check what's in the account object
  console.log("Account object:", account);
  console.log("Account keys:", Object.keys(account));

  // Try different ways to get the address
  const smartAccountAddress =
    client.account?.address || (await client.getAddress());

  console.log("Smart Account Address:", smartAccountAddress);

  return { account, client, smartAccountAddress };
};

// Transaction 1
const tx = async () => {
  const { account, client, smartAccountAddress } = await getSmartAccount();

  const txHash = await client.writeContract({
    address: "0x692e69cA1Fe89eF72ca94B0E3a32A92835501a08",
    abi: abi,
    functionName: "increment",
    args: [], // Use smartAccountAddress here
  });

  console.log(`Explorer: https://awakening.bdagscan.com/tx/${txHash}`);
};

const mintToken = async () => {
  const { account, client } = await getSmartAccount();

  const txHash = await client.writeContract({
    address: tokenAddress,
    abi: tokenAbi,
    functionName: "mintToken",
    args: [client.getAddress(), parseDAG("2")],
  });

  console.log(`Explorer: https://awakening.bdagscan.com/tx/${txHash}`);
};

const batchToken = async () => {
  const { client } = await getSmartAccount();
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  console.log("Address", account.address);
  const cd = encodeFunctionData({
    abi: tokenAbi,
    functionName: "approve",
    args: [account.address, parseDAG("2")],
  });

  const cd2 = encodeFunctionData({
    abi: tokenAbi,
    functionName: "mintToken",
    args: [account.address, parseDAG("10")],
  });
  const txHashes = await client.sendBatchUserOperations([
    {
      target: tokenAddress,
      data: cd,
    },
    {
      target: tokenAddress,
      data: cd2,
    },
  ]);

  txHashes.forEach((hash, i) => {
    console.log(`Explorer: https://awakening.bdagscan.com/tx/${hash}`);
  });

  const balance = await client.readContract({
    address: tokenAddress,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [account.address],
  });

  console.log(`Account address is given as ${formatEther(balance)}`);
};

const main = async () => {
  //   await tx().catch(console.error);
  //   await mintToken().catch(console.error);
  await batchToken().catch(console.error);

  process.exit(1);
};

main();
