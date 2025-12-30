import { awakening, createDagAAClient } from "@dag-kit/kit";
import { createTurnkeySigner, createApiKeyStamper } from "./index.js";
import dotenv from "dotenv";

dotenv.config();

const PUBLIC_KEY =
  process.env.PUBLIC_KEY ||
  "0274c3a3f0c5dbd9737d39628af4615ceb799df320a9f8816e716254b40f387678";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "72ae2bd2ed49396c8c365437efd7c0b852e3d57d87a3a7ddd39b017a8812ce8b";
const PARENT_ORG_ID = process.env.ORG_ID || "";
const SUB_ORG_ID = "cbd7f611-c518-4333-8dd2-5fa77027375e";

async function exampleWithWebAuthn() {
  console.log("Setting up Turnkey with API Key...");

  // ✅ Validate environment variables
  if (!PUBLIC_KEY || !PRIVATE_KEY || !PARENT_ORG_ID) {
    throw new Error(
      "Missing required environment variables: PUBLIC_KEY, PRIVATE_KEY, or ORG_ID"
    );
  }

  console.log("Public Key (first 10 chars):", PUBLIC_KEY.substring(0, 10));
  console.log("Private Key (first 10 chars):", PRIVATE_KEY.substring(0, 10));
  console.log("Parent Organization ID:", PARENT_ORG_ID);
  console.log("Sub Organization ID:", SUB_ORG_ID);

  // ✅ Validate key formats
  if (PUBLIC_KEY.length !== 66) {
    throw new Error(
      `Invalid public key length: ${PUBLIC_KEY.length} (expected 66)`
    );
  }

  if (PRIVATE_KEY.length !== 64) {
    throw new Error(
      `Invalid private key length: ${PRIVATE_KEY.length} (expected 64)`
    );
  }

  if (!PUBLIC_KEY.startsWith("02") && !PUBLIC_KEY.startsWith("03")) {
    throw new Error(
      "Invalid public key format: must start with 02 or 03 (compressed format)"
    );
  }

  try {
    // ============================================
    // STEP 1: Authenticate with PARENT ORG
    // ============================================
    console.log("\n📌 Step 1: Connecting to Parent Org...");
    const parentStamper = await createApiKeyStamper(PUBLIC_KEY, PRIVATE_KEY);

    const parentTurnkeySigner = createTurnkeySigner({
      chain: awakening.chain_config,
      rpcUrl: "https://rpc.awakening.bdagscan.com",
      turnkeyConfig: {
        baseUrl: "https://api.turnkey.com",
        organizationId: PARENT_ORG_ID,
        stamper: parentStamper,
      },
    });

    await parentTurnkeySigner.connect();
    console.log("✅ Connected to Parent Org");

    // ============================================
    // STEP 2: Create API Keys for SUB-ORG
    // ============================================
    console.log("\n📌 Step 2: Creating API Keys for Sub-Org...");
    const { apiKeyId, privateKey, publicKey } =
      await parentTurnkeySigner._createApiKeys(SUB_ORG_ID);

    console.log("✅ Sub-Org API Keys Created");
    console.log("  - API Key ID:", apiKeyId);
    console.log("  - Public Key (first 10):", publicKey.substring(0, 10));

    // ============================================
    // STEP 3: Authenticate with SUB-ORG
    // ============================================
    console.log("\n📌 Step 3: Connecting to Sub-Org with new API keys...");
    const subOrgStamper = await createApiKeyStamper(publicKey, privateKey);

    const subOrgTurnkeySigner = createTurnkeySigner({
      chain: awakening.chain_config,
      rpcUrl: "https://rpc.awakening.bdagscan.com",
      turnkeyConfig: {
        baseUrl: "https://api.turnkey.com",
        organizationId: SUB_ORG_ID,
        stamper: subOrgStamper,
      },
    });

    await subOrgTurnkeySigner.connect();

    const signerAddress = await subOrgTurnkeySigner.getAddress();
    console.log("✅ Sub-Org Signer Address:", signerAddress);

    // ============================================
    // STEP 4: Create Smart Account with Sub-Org Signer
    // ============================================
    console.log("\n📌 Step 4: Creating Smart Account...");
    const dagClient = createDagAAClient({
      chain: awakening.chain_config,
      rpcUrl: "https://rpc.awakening.bdagscan.com",
      bundlerUrl: awakening.bundler_rpc,
      paymasterUrl: "http://localhost:3001/rpc",
      factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
    });

    const smartAccountAddress = await dagClient.connectSmartAccount({
      signer: subOrgTurnkeySigner,
    });

    console.log("✅ Smart Account Address:", smartAccountAddress);

    // ============================================
    // STEP 5: Check Smart Account Status
    // ============================================
    console.log("\n📌 Step 5: Checking Smart Account Status...");
    const isDeployed = await dagClient.isDeployed();
    console.log("Is Smart Account Deployed:", isDeployed);

    const balance = await dagClient.getBalance();
    console.log("Balance:", balance.toString(), "wei");

    console.log("\n✅ All steps completed successfully!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

(async () => {
  await exampleWithWebAuthn();
})();
