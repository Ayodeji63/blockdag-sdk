# DAG Paymaster Service

A production-ready paymaster service for sponsoring user operations in ERC-4337 account abstraction on the DAG blockchain. This service enables gasless transactions by sponsoring gas fees for user operations.

## Overview

The paymaster service implements the ERC-4337 paymaster interface, allowing users to execute transactions without holding native tokens for gas fees. It provides JSON-RPC endpoints for bundlers to request gas sponsorship and includes admin endpoints for managing paymaster deposits.

## Features

- **Gas Sponsorship**: Automatically sponsor gas fees for eligible user operations
- **Multiple RPC Methods**: Support for `pm_sponsorUserOperation`, `pm_getPaymasterStubData`, and `pm_getPaymasterData`
- **Customizable Policies**: Flexible sponsorship rules (whitelist, rate limiting, transaction filtering)
- **Deposit Management**: Built-in endpoints to fund and monitor paymaster balance
- **Health Monitoring**: Real-time balance tracking and health checks
- **Production Ready**: CORS enabled, error handling, and JSON-RPC 2.0 compliant

## Installation

```bash
npm install express viem cors dotenv
npm install --save-dev @types/express @types/cors
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Server Configuration
PORT=3001

# Paymaster Configuration
PAYMASTER_ADDRESS=0x1234567890123456789012345678901234567890
PAYMASTER_PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Blockchain Configuration
RPC_URL=https://rpc.awakening.bdagscan.com
CHAIN_ID=1

# Optional: Security
ADMIN_API_KEY=your_secure_admin_key
```

### Required Variables

| Variable                | Description                         | Example          |
| ----------------------- | ----------------------------------- | ---------------- |
| `PAYMASTER_ADDRESS`     | Deployed paymaster contract address | `0x123...`       |
| `PAYMASTER_PRIVATE_KEY` | Private key of paymaster signer     | `0xabc...`       |
| `RPC_URL`               | Blockchain RPC endpoint             | `https://rpc...` |
| `CHAIN_ID`              | Network chain ID                    | `1`              |

## Quick Start

### 1. Start the Server

```bash
npm run start
# or
node dist/paymaster-service.js
```

### 2. Verify Health

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "ok",
  "paymaster": "0x1234567890123456789012345678901234567890"
}
```

### 3. Check Paymaster Info

```bash
curl http://localhost:3001/info
```

Expected response:

```json
{
  "paymasterAddress": "0x1234567890123456789012345678901234567890",
  "deposit": "1000000000000000000",
  "signer": "0xabcdef1234567890abcdef1234567890abcdef12"
}
```

## API Endpoints

### JSON-RPC Endpoints

#### POST `/rpc`

Main endpoint for paymaster operations. Supports multiple methods:

##### 1. `pm_sponsorUserOperation`

Sponsor a user operation and return paymaster data.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "pm_sponsorUserOperation",
  "params": [
    {
      "sender": "0x...",
      "nonce": "0x0",
      "initCode": "0x",
      "callData": "0x...",
      "callGasLimit": "0x30000",
      "verificationGasLimit": "0x50000",
      "preVerificationGas": "0x10000",
      "maxFeePerGas": "0x3b9aca00",
      "maxPriorityFeePerGas": "0x3b9aca00",
      "paymasterAndData": "0x",
      "signature": "0x..."
    },
    "0xEntryPointAddress",
    {}
  ]
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "paymasterAndData": "0x1234...abcd",
    "preVerificationGas": "65536",
    "verificationGasLimit": "327680",
    "callGasLimit": "196608"
  }
}
```

##### 2. `pm_getPaymasterStubData`

Get stub data for gas estimation before actual sponsorship.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "pm_getPaymasterStubData",
  "params": [
    {
      "sender": "0x...",
      "nonce": "0x0",
      "callData": "0x..."
    },
    "0xEntryPointAddress",
    {}
  ]
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "paymasterAndData": "0x1234000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  }
}
```

##### 3. `pm_getPaymasterData`

Get complete paymaster data string.

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "pm_getPaymasterData",
  "params": [
    {
      "sender": "0x...",
      "nonce": "0x0"
    },
    "0xEntryPointAddress",
    {}
  ]
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": "0x1234567890123456789012345678901234567890000000000174876e8000000000174876e74..."
}
```

### REST Endpoints

#### GET `/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "paymaster": "0x1234567890123456789012345678901234567890"
}
```

#### GET `/info`

Get paymaster information including deposit balance.

**Response:**

```json
{
  "paymasterAddress": "0x1234567890123456789012345678901234567890",
  "deposit": "1000000000000000000",
  "signer": "0xabcdef1234567890abcdef1234567890abcdef12"
}
```

#### POST `/fund`

Fund the paymaster with native tokens (admin endpoint).

**Request:**

```json
{
  "amount": "10"
}
```

**Response:**

```json
{
  "hash": "0xtransactionhash...",
  "message": "Paymaster funded successfully"
}
```

## Paymaster Data Format

The `paymasterAndData` field contains:

```
paymasterAddress (20 bytes) + validUntil (6 bytes) + validAfter (6 bytes) + signature (65 bytes)
```

Example breakdown:

```
0x1234567890123456789012345678901234567890  // Paymaster address (40 hex chars)
000000017487                                // validUntil timestamp (12 hex chars)
000000017486                                // validAfter timestamp (12 hex chars)
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000  // Signature placeholder (130 hex chars)
```

## Customizing Sponsorship Policy

The `shouldSponsor()` function determines which operations to sponsor. Customize it based on your needs:

### Example: Whitelist Addresses

```typescript
const WHITELISTED_ADDRESSES = new Set([
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
]);

function shouldSponsor(userOp: UserOperation): boolean {
  return WHITELISTED_ADDRESSES.has(userOp.sender.toLowerCase());
}
```

### Example: Rate Limiting

```typescript
const sponsorshipTracker = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 10;

function shouldSponsor(userOp: UserOperation): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;

  const requests = sponsorshipTracker.get(userOp.sender) || [];
  const recentRequests = requests.filter((time) => time > hourAgo);

  if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  recentRequests.push(now);
  sponsorshipTracker.set(userOp.sender, recentRequests);

  return true;
}
```

### Example: Transaction Value Limit

```typescript
function shouldSponsor(userOp: UserOperation): boolean {
  // Extract value from callData
  const value = extractValue(userOp.callData);

  // Only sponsor transactions under 1 DAG
  if (value > BigInt(1e18)) {
    return false;
  }

  return true;
}
```

### Example: Contract Interaction Filtering

```typescript
const ALLOWED_CONTRACTS = new Set([
  "0x3333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444",
]);

function shouldSponsor(userOp: UserOperation): boolean {
  // Extract target contract from callData
  const target = extractTarget(userOp.callData);

  return ALLOWED_CONTRACTS.has(target.toLowerCase());
}
```

## Integration with DAG Kit

### Client Configuration

```typescript
import { createDagAAClient } from "@dag-kit/kit";

const dagClient = createDagAAClient({
  chain: awakening.chain_config,
  rpcUrl: "https://rpc.awakening.bdagscan.com",
  bundlerUrl: "http://localhost:3000",
  paymasterUrl: "http://localhost:3001/rpc", // Your paymaster service
  factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
});
```

### Sending Sponsored Transactions

```typescript
// The paymaster will automatically sponsor this transaction
const txHash = await dagClient.sendTransaction({
  to: "0x...",
  value: parseDAG("0.1"),
  data: "0x",
});

console.log("Transaction sponsored and sent:", txHash);
```

## Monitoring and Maintenance

### Monitor Paymaster Balance

```bash
# Create a monitoring script
curl http://localhost:3001/info | jq '.deposit'
```

### Low Balance Alert

```typescript
// Add to your paymaster service
const MIN_BALANCE = BigInt(1e18); // 1 DAG

setInterval(async () => {
  const deposit = await publicClient.getBalance({
    address: PAYMASTER_ADDRESS,
  });

  if (deposit < MIN_BALANCE) {
    console.error("⚠️ ALERT: Low paymaster balance:", deposit.toString());
    // Send notification (email, Slack, etc.)
  }
}, 60000); // Check every minute
```

### Fund Paymaster Automatically

```typescript
async function autoFundPaymaster() {
  const deposit = await publicClient.getBalance({
    address: PAYMASTER_ADDRESS,
  });

  if (deposit < MIN_BALANCE) {
    console.log("Auto-funding paymaster...");

    const hash = await walletClient.writeContract({
      address: PAYMASTER_ADDRESS,
      abi: paymasterAbi,
      functionName: "deposit",
      value: BigInt(10e18), // Fund with 10 DAG
    });

    console.log("Funded paymaster:", hash);
  }
}
```

## Error Handling

### Common Errors

| Error Code | Message                     | Solution                 |
| ---------- | --------------------------- | ------------------------ |
| `-32003`   | User operation not eligible | Check sponsorship policy |
| `-32601`   | Method not found            | Verify RPC method name   |
| `-32000`   | Internal error              | Check paymaster balance  |

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32003,
    "message": "User operation not eligible for sponsorship"
  }
}
```

## Security Best Practices

### 1. Add Authentication for Admin Endpoints

```typescript
function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

app.post("/fund", requireAuth, async (req, res) => {
  // Fund logic
});
```

### 2. Implement Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/rpc", limiter);
```

### 3. Validate User Operations

```typescript
function validateUserOp(userOp: UserOperation): boolean {
  // Check required fields
  if (!userOp.sender || !userOp.callData) {
    return false;
  }

  // Validate gas limits
  if (userOp.callGasLimit < BigInt(21000)) {
    return false;
  }

  // Add more validation
  return true;
}
```

### 4. Use HTTPS in Production

```typescript
import https from "https";
import fs from "fs";

const httpsOptions = {
  key: fs.readFileSync("path/to/private-key.pem"),
  cert: fs.readFileSync("path/to/certificate.pem"),
};

https.createServer(httpsOptions, app).listen(443);
```

## Testing

### Test Sponsorship Request

```bash
curl -X POST http://localhost:3001/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "pm_sponsorUserOperation",
    "params": [
      {
        "sender": "0x1234567890123456789012345678901234567890",
        "nonce": "0x0",
        "initCode": "0x",
        "callData": "0x",
        "callGasLimit": "0x30000",
        "verificationGasLimit": "0x50000",
        "preVerificationGas": "0x10000",
        "maxFeePerGas": "0x3b9aca00",
        "maxPriorityFeePerGas": "0x3b9aca00",
        "paymasterAndData": "0x",
        "signature": "0x"
      },
      "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      {}
    ]
  }'
```

### Test Fund Endpoint

```bash
curl -X POST http://localhost:3001/fund \
  -H "Content-Type: application/json" \
  -d '{"amount": "1"}'
```

## Deployment

### Using PM2

```bash
npm install -g pm2

# Start service
pm2 start dist/paymaster-service.js --name paymaster

# Monitor
pm2 logs paymaster

# Auto-restart on crash
pm2 startup
pm2 save
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/paymaster-service.js"]
```

```bash
docker build -t paymaster-service .
docker run -p 3001:3001 --env-file .env paymaster-service
```

## Troubleshooting

### "Low paymaster deposit" Warning

**Solution:** Fund the paymaster using the `/fund` endpoint or directly deposit to the contract.

### "Method not found" Error

**Solution:** Ensure you're using the correct RPC method names (`pm_sponsorUserOperation`, `pm_getPaymasterStubData`, `pm_getPaymasterData`).

### User Operations Not Being Sponsored

**Solution:** Check the `shouldSponsor()` function logic and verify the user operation meets your sponsorship criteria.

### Connection Refused

**Solution:** Verify the RPC_URL is correct and the blockchain node is accessible.

## Performance Optimization

### Enable Caching

```typescript
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 60 }); // 60 second TTL

app.post("/rpc", async (req, res) => {
  const cacheKey = JSON.stringify(req.body);
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  // Process request
  const result = await processRequest(req.body);
  cache.set(cacheKey, result);

  res.json(result);
});
```

## License

[MIT]

## Support

For issues and questions:

- DAG Blockchain Documentation: [Your docs URL]
- ERC-4337 Specification: https://eips.ethereum.org/EIPS/eip-4337
