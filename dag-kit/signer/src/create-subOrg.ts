import { TurnkeyClient } from "@turnkey/http";
import { createApiKeyStamper } from "./index.js";
import dotenv from "dotenv";

dotenv.config();

const PARENT_PUBLIC_KEY = process.env.PUBLIC_KEY || "";
const PARENT_PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const PARENT_ORG_ID = process.env.ORG_ID || "";

async function createSubOrgWithCredentials() {
  try {
    console.log("Creating sub-org with initial credentials...");

    // Authenticate with parent org
    const parentStamper = await createApiKeyStamper(
      PARENT_PUBLIC_KEY,
      PARENT_PRIVATE_KEY
    );

    const turnkeyClient = new TurnkeyClient(
      { baseUrl: "https://api.turnkey.com" },
      parentStamper
    );

    // Generate key pair for initial API key in sub-org
    const { generateP256KeyPair } = await import("@turnkey/crypto");
    const keyPair = generateP256KeyPair();

    console.log("\n📝 Generated key pair for sub-org:");
    console.log("Public Key:", keyPair.publicKey);
    console.log("Private Key:", keyPair.privateKey);
    console.log("\n⚠️ SAVE THESE KEYS! You won't see the private key again.\n");

    // Create sub-org with initial root user and API key
    const response = await turnkeyClient.createSubOrganization({
      type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7",
      timestampMs: String(Date.now()),
      organizationId: PARENT_ORG_ID,
      parameters: {
        subOrganizationName: `BlockDAG Sub-Org ${Date.now()}`,
        rootQuorumThreshold: 1,
        rootUsers: [
          {
            userName: "Root User",
            userEmail: "", // Optional
            apiKeys: [
              {
                apiKeyName: "Initial API Key",
                publicKey: keyPair.publicKey,
                curveType: "API_KEY_CURVE_P256",
              },
            ],
            authenticators: [], // Empty array if not using passkeys
            oauthProviders: [], // Empty array if not using OAuth
          },
        ],
      },
    });

    console.log("\n✅ Sub-Org Creation Response:", response);

    const subOrgId =
      response.activity.result.createSubOrganizationResultV7?.subOrganizationId;
    const rootUserIds =
      response.activity.result.createSubOrganizationResultV7?.rootUserIds;

    console.log("\n✅ Sub-Org Created Successfully!");
    console.log("Sub-Org ID:", subOrgId);
    console.log("Root User IDs:", rootUserIds);

    console.log("\n📋 Add these to your .env file:");
    console.log(`SUB_ORG_ID=${subOrgId}`);
    console.log(`SUB_ORG_PUBLIC_KEY=${keyPair.publicKey}`);
    console.log(`SUB_ORG_PRIVATE_KEY=${keyPair.privateKey}`);

    return {
      subOrgId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

(async () => {
  await createSubOrgWithCredentials();
})();
