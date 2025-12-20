# DAG AA SDK

The **DAG AA SDK** is a powerful TypeScript library designed for interacting with Account Abstraction on BlockDAG networks. Built on top of `viem` and `permissionless.js`, it provides an intuitive interface for managing smart accounts, sending UserOperations, and integrating with Paymasters for gas sponsorship.

## 🚀 Features

- **Smart Account Management**: Easily create or connect to existing Simple Smart Accounts.
- **Bundler Integration**: Seamlessly send UserOperations via Pimlico or other compatible bundlers.
- **Built-in Paymaster Support**: Automated gas sponsorship with robust handling of `BigInt` serialization.
- **High-level Contract Interaction**: simplified `readContract` and `writeContract` methods.
- **Batch Operations**: Support for executing multiple UserOperations in sequence.
- **Developer Friendly**: Inspired by the Alchemy AA SDK for a familiar developer experience.

---

## 📦 Installation

```bash
npm install @dag-kit/kit viem permissionless
# or
yarn add @dag-kit/kit viem permissionless

```

---

---

# Links

### Frontend -> https://blockdag-frontend.vercel.app/

### Demo Video -> https://youtu.be/6pTiK-sjrSE

### Smart Contract Address

- [Factory Address](https://awakening.bdagscan.com/contractOverview/0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3)
- [Paymaster Address](https://awakening.bdagscan.com/searchQuery/0x96d6F32EbfBBc53586Cb6468C13e3b678f817ba0)

### Interaction Smart Contract Address (Shown In Demo Video)

- [Tx-1](https://awakening.bdagscan.com/tx/0x1badc620a5ae2475d3a27eed1f51cf2f8e0e876090c1efb6224b631e6746a12e)

- [Tx-2](https://awakening.bdagscan.com/tx/0x0e37da762ed29240316a8824de74412e4b96c5c740f143f09170686096d51407)

---

## 🛠 Quick Start

### 1. Initialize the Client

```typescript
import { createDagAAClient, parseDAG } from "@dag-kit/kit";
import { mainnet } from "viem/chains";

const client = createDagAAClient({
  chain: mainnet,
  rpcUrl: "https://your-rpc-url.com",
  bundlerUrl: "",
  paymasterUrl: "", // Optional
  factoryAddress: "0x...",
});
```

### 2. Connect a Smart Account

You can connect using a private key. This will either locate your existing account or prepare a new one for deployment.

```typescript
const smartAccountAddress = await client.connectSmartAccount({
  owner: "0x-your-private-key",
});

console.log(`Smart Account Address: ${smartAccountAddress}`);
```

### 3. Send a Sponsored Transaction

If a `paymasterUrl` was provided during initialization, gas sponsorship is handled automatically.

```typescript
const txHash = await client.sendUserOperation({
  target: "0xTargetAddress",
  data: "0x...",
  value: parseDAG("0.1"),
});

console.log(`UserOp sent: ${txHash}`);
```

---

## 📖 API Reference

### Core Methods

| Method                        | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `connectSmartAccount(config)` | Deploys or connects to a Simple Smart Account.    |
| `sendUserOperation(params)`   | Signs and sends a UserOperation to the bundler.   |
| `writeContract(params)`       | Encodes a contract call and sends it as a UserOp. |
| `readContract(params)`        | Performs a standard constant call to a contract.  |
| `getBalance()`                | Returns the native balance of the Smart Account.  |
| `isDeployed()`                | Checks if the Smart Account contract is on-chain. |

### Configuration Options

The `DagAAConfig` object accepts:

- `chain`: The Viem Chain object.
- `rpcUrl`: Standard JSON-RPC endpoint.
- `bundlerUrl`: The ERC-4337 Bundler endpoint.
- `paymasterUrl` (Optional): The endpoint for gas sponsorship.
- `entryPointAddress` (Optional): Defaults to EntryPoint v0.6.

---

## 🔐 Advanced Usage: Batch Operations

You can execute multiple operations in a single flow:

```typescript
const hashes = await client.sendBatchUserOperations([
  { target: "0xAddress1", value: parseDAG("0.05") },
  { target: "0xAddress2", value: parseDAG("0.05") },
]);
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)

---
