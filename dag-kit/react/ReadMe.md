# DAG Kit React Integration

A comprehensive React integration for DAG blockchain with Turnkey authentication, smart account management, and transaction handling.

## Overview

This package provides React providers and hooks for integrating DAG blockchain functionality with Turnkey's secure key management. It includes authentication flows, smart account creation, and batch transaction management.

## Features

- **Email Authentication**: OTP-based email login with Turnkey
- **Smart Account Management**: Automatic smart account creation and deployment
- **Session Management**: Secure session handling with expiry warnings
- **Batch Transactions**: Support for batching NFT and token transactions
- **Balance Tracking**: Real-time balance monitoring
- **React Context API**: Easy state management across your app

## Installation

```bash
npm install @dag-kit/signer @dag-kit/kit viem
```

## Setup

### 1. Environment Variables

Create a `.env` file in your project root:

```env
VITE_TURNKEY_PUBLIC_KEY=your_turnkey_public_key
VITE_TURNKEY_PRIVATE_KEY=your_turnkey_private_key
VITE_TURNKEY_ORG_ID=your_organization_id
VITE_API_BASE_URL=http://localhost:5000/api
```

### 2. Wrap Your App with Providers

```tsx
import { AuthProvider } from "./providers/auth-provider";
import { DagClientProvider } from "./providers/dag-client-provider";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DagClientProvider>{/* Your app components */}</DagClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## Authentication Provider

### Usage

```tsx
import { useAuth } from "./providers/auth-provider";

function LoginComponent() {
  const {
    state,
    initEmailLogin,
    completeEmailAuth,
    handleLogout,
    address,
    dagClient,
  } = useAuth();

  const handleLogin = async (email: string) => {
    const otpId = await initEmailLogin(email);
    // Store otpId and navigate to verification page
  };

  const handleVerify = async (otpId: string, code: string, email: string) => {
    const result = await completeEmailAuth({ otpId, code, email });
    // User is now logged in with smart account created
  };

  return (
    <div>
      {state.loading && <p>Loading...</p>}
      {state.error && <p>Error: {state.error}</p>}
      {address && <p>Smart Account: {address}</p>}
    </div>
  );
}
```

### Available Methods

#### `initEmailLogin(email: string)`

Initiates email authentication by sending OTP.

```tsx
const otpId = await initEmailLogin("user@example.com");
```

#### `completeEmailAuth({ otpId, code, email })`

Completes authentication and creates smart account.

```tsx
const result = await completeEmailAuth({
  otpId: "otp_123",
  code: "123456",
  email: "user@example.com",
});
```

#### `createSmartAccount(subOrgId: string)`

Creates and deploys a smart account for the user.

```tsx
const accountData = await createSmartAccount(subOrgId);
// Returns: { signerAddress, smartAccountAddress, isDeployed, balance, dagClient }
```

#### `handleLogout()`

Logs out the user and clears session data.

```tsx
await handleLogout();
```

### Auth State

```tsx
interface AuthState {
  loading: boolean;
  error: string;
  user: UserSession | null;
  sessionExpiring: boolean;
}
```

### Batch Transactions

```tsx
const { batchTransaction, setBatchTransaction } = useAuth();

// Add transaction to batch
setBatchTransaction((prev) => [
  ...prev,
  {
    id: Date.now(),
    name: transactionType.TOKEN,
    data: "0x...",
    value: parseDAG("1.0"),
    target: "0x...",
  },
]);
```

## DAG Client Provider

### Usage

```tsx
import { useDagClient } from "./providers/dag-client-provider";

function WalletComponent() {
  const {
    dagClient,
    smartAccountAddress,
    balance,
    isDeployed,
    loading,
    error,
    refreshBalance,
  } = useDagClient();

  useEffect(() => {
    if (dagClient) {
      console.log("Smart Account:", smartAccountAddress);
      console.log("Balance:", balance.toString());
    }
  }, [dagClient]);

  return (
    <div>
      {loading && <p>Loading wallet...</p>}
      {error && <p>Error: {error}</p>}
      {smartAccountAddress && (
        <div>
          <p>Address: {smartAccountAddress}</p>
          <p>Balance: {balance.toString()} wei</p>
          <p>Deployed: {isDeployed ? "Yes" : "No"}</p>
          <button onClick={refreshBalance}>Refresh Balance</button>
        </div>
      )}
    </div>
  );
}
```

### Available Properties

- `dagClient`: Instance of DAG AA Client for transactions
- `smartAccountAddress`: User's smart account address
- `balance`: Current balance in wei
- `isDeployed`: Whether smart account is deployed
- `loading`: Loading state during initialization
- `error`: Error message if initialization fails
- `refreshBalance()`: Function to refresh account balance

## API Client

The API client handles backend communication for authentication and wallet operations.

### Available Functions

#### Authentication

```tsx
import * as authApi from "./services/api/auth";

// Initialize email auth
const result = await authApi.initEmailAuth({
  email: "user@example.com",
  targetPublicKey: publicKey,
  baseUrl: "https://api.turnkey.com",
});

// Verify OTP
const verification = await authApi.verifyOtp({
  otpId: "otp_123",
  otpCode: "123456",
  publicKey: publicKey,
});

// Create sub-organization
const subOrg = await authApi.createUserSubOrg({
  email: "user@example.com",
});
```

#### Wallet Operations

```tsx
// Get wallets
const wallets = await authApi.getWalletsWithAccounts(organizationId);

// Get specific wallet
const wallet = await authApi.getWallet(walletId, organizationId);

// Fund wallet
await authApi.fundWallet(address);
```

## Complete Example

```tsx
import { useAuth } from "./providers/auth-provider";
import { useDagClient } from "./providers/dag-client-provider";
import { useState } from "react";

function DashboardPage() {
  const { state, handleLogout } = useAuth();
  const { smartAccountAddress, balance, isDeployed, refreshBalance } =
    useDagClient();

  const [sending, setSending] = useState(false);

  const sendTransaction = async () => {
    if (!dagClient) return;

    setSending(true);
    try {
      const txHash = await dagClient.sendTransaction({
        to: "0x...",
        value: parseDAG("0.1"),
        data: "0x",
      });
      console.log("Transaction sent:", txHash);
      await refreshBalance();
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>

      {state.loading && <p>Loading...</p>}

      {state.sessionExpiring && (
        <div className="warning">Your session is about to expire!</div>
      )}

      <div className="wallet-info">
        <p>Address: {smartAccountAddress}</p>
        <p>Balance: {balance.toString()} wei</p>
        <p>Status: {isDeployed ? "Deployed" : "Not Deployed"}</p>
      </div>

      <button onClick={sendTransaction} disabled={sending}>
        {sending ? "Sending..." : "Send Transaction"}
      </button>

      <button onClick={refreshBalance}>Refresh Balance</button>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

## Transaction Types

```tsx
export enum transactionType {
  NFT = "NFT",
  TOKEN = "TOKEN",
}

export interface BatchTransactionType {
  id: number;
  name: transactionType;
  data: any;
  value: any;
  target: Address;
}
```

## Session Management

Sessions automatically expire after 15 minutes (900 seconds). A warning is displayed 30 seconds before expiry.

```tsx
const { state } = useAuth();

if (state.sessionExpiring) {
  // Show warning to user
  alert("Your session is about to expire!");
}
```

## Error Handling

```tsx
const { state, initEmailLogin } = useAuth();

try {
  await initEmailLogin(email);
} catch (error) {
  console.error("Login failed:", error);
}

// Or use state.error
if (state.error) {
  console.error("Auth error:", state.error);
}
```

## TypeScript Support

All providers and hooks are fully typed:

```tsx
interface UserSession {
  id: string;
  name: string;
  email: string;
  organization: {
    organizationId: string;
    organizationName: string;
  };
}

interface DagClientContextType {
  dagClient: any | null;
  smartAccountAddress: string;
  balance: bigint;
  isDeployed: boolean;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
}
```

## Best Practices

1. **Always check loading states** before performing operations
2. **Handle errors gracefully** with try-catch blocks
3. **Store session data securely** in localStorage
4. **Refresh balance** after transactions
5. **Clear sensitive data** on logout
6. **Validate environment variables** before initialization

## Troubleshooting

### "Invalid sub-organization ID"

- Ensure the sub-org was created successfully
- Check that you're using the correct sub-org ID, not parent org ID

### "Failed to create private key"

- Verify API credentials have correct permissions
- Check that the organization ID is valid

### "Smart account has 0 balance"

- Fund the smart account address before sending transactions
- Use the `fundWallet` API endpoint for testing

### Session expiry issues

- Implement refresh logic when `sessionExpiring` is true
- Call `refreshSession()` to renew authentication

## Security Considerations

- Never expose private keys in client code
- Use environment variables for sensitive data
- Implement proper session timeout handling
- Validate all user inputs before API calls
- Use HTTPS in production environments

## License

[MIT]
