# BlockDAG-SDK Signer

A TypeScript implementation of a blockchain signer using Turnkey's infrastructure for secure key management and transaction signing.

## Overview

The Turnkey Signer provides a secure way to manage Ethereum-compatible blockchain accounts using Turnkey's key management service. It supports multiple authentication methods and integrates seamlessly with the viem library for blockchain interactions.

## Features

- **Secure Key Management**: Leverage Turnkey's infrastructure for private key storage and signing
- **Multiple Authentication Methods**: Support for WebAuthn, iframe-based, and API key authentication
- **EVM Compatible**: Works with any EVM-compatible blockchain through viem
- **Account Management**: Create and manage private keys within Turnkey organizations
- **Flexible Configuration**: Support for existing keys or automatic key generation

## Installation

```bash
npm install viem @dag-kit/signer
```

## Usage

### Basic Setup

```typescript
import { createTurnkeySigner } from "@dag-kit/signer";
import { mainnet } from "viem/chains";

const signer = createTurnkeySigner({
  chain: mainnet,
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY", // optional
  turnkeyConfig: {
    baseUrl: "https://api.turnkey.com",
    organizationId: "your-org-id",
    privateKeyId: "your-private-key-id", // optional
    stamper: stamper, // See authentication methods below
  },
});

await signer.connect();
```

### Authentication Methods

#### 1. WebAuthn Stamper (Passkey/Biometric)

```typescript
import { createWebAuthnStamper } from "@dag-kit/signer";

const stamper = await createWebAuthnStamper();
```

#### 2. Iframe Stamper

```typescript
import { createIframeStamper } from "@dag-kit/signer";

const stamper = await createIframeStamper("https://auth.turnkey.com");
```

**Required HTML:**

```html
<div id="turnkey-iframe-container"></div>
```

#### 3. API Key Stamper

```typescript
import { createApiKeyStamper } from "@dag-kit/signer";

const stamper = await createApiKeyStamper(
  "your-api-public-key",
  "your-api-private-key"
);
```

### Signing Operations

#### Sign a Message

```typescript
const signature = await signer.signMessage("Hello, World!");
```

#### Sign Typed Data (EIP-712)

```typescript
const signature = await signer.signTypedData({
  domain: {
    name: "MyApp",
    version: "1",
    chainId: 1,
  },
  types: {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
  },
  primaryType: "Person",
  message: {
    name: "Alice",
    wallet: "0x...",
  },
});
```

### Account Information

```typescript
// Get account address
const address = await signer.getAddress();

// Get account object
const account = await signer.getAccount();

// Get wallet client
const walletClient = await signer.getWalletClient();

// Check if connected
const isReady = await signer.isReady();
```

### Key Management

#### List Private Keys

```typescript
const keys = await signer.listPrivateKeys();
console.log("Available keys:", keys);
```

#### Auto-generate Key

If no `privateKeyId` is provided in the config, a new key will be automatically created on connect:

```typescript
const signer = createTurnkeySigner({
  chain: mainnet,
  turnkeyConfig: {
    baseUrl: "https://api.turnkey.com",
    organizationId: "your-org-id",
    stamper: stamper,
    // No privateKeyId - will create new key
  },
});

await signer.connect(); // Creates new key automatically
```

### Session Management

```typescript
// Disconnect
await signer.disconnect();

// Refresh session
await signer.refreshSession();

// Check session status
const isActive = signer.isSessionActive();
```

## Configuration Options

### TurnkeySignerConfig

| Property        | Type     | Required | Description                                       |
| --------------- | -------- | -------- | ------------------------------------------------- |
| `chain`         | `Chain`  | Yes      | The blockchain network (from viem/chains)         |
| `rpcUrl`        | `string` | No       | Custom RPC endpoint (defaults to chain's default) |
| `turnkeyConfig` | `object` | Yes      | Turnkey-specific configuration                    |

### TurnkeyConfig

| Property         | Type     | Required | Description                                      |
| ---------------- | -------- | -------- | ------------------------------------------------ |
| `baseUrl`        | `string` | Yes      | Turnkey API base URL                             |
| `organizationId` | `string` | Yes      | Your Turnkey organization ID                     |
| `privateKeyId`   | `string` | No       | Existing private key ID (creates new if omitted) |
| `stamper`        | `any`    | Yes      | Authentication stamper instance                  |

## Advanced Features

### Creating Sub-Organization API Keys

```typescript
// Internal method for creating API keys in sub-organizations
const apiKeys = await signer._createApiKeys("sub-org-id");
console.log("API Key ID:", apiKeys.apiKeyId);
console.log("Public Key:", apiKeys.publicKey);
```

## Error Handling

```typescript
try {
  await signer.connect();
  const signature = await signer.signMessage("Test message");
} catch (error) {
  console.error("Signing failed:", error);
}
```

## ISigner Interface

The TurnkeySigner implements the ISigner interface with the following methods:

- `connect(): Promise<void>`
- `disconnect(): Promise<void>`
- `isReady(): Promise<boolean>`
- `getAccount(): Promise<Account>`
- `getWalletClient(): Promise<WalletClient>`
- `getAddress(): Promise<Address>`
- `signMessage(message: string | Uint8Array): Promise<Hex>`
- `signTypedData(typedData: any): Promise<Hex>`
- `isSessionActive(): boolean`
- `refreshSession(): Promise<void>`

## Security Considerations

- Private keys never leave Turnkey's secure infrastructure
- All signing operations are performed server-side
- Stampers provide secure authentication without exposing credentials
- Use WebAuthn stamper for the highest security in browser environments

## License

MIT
