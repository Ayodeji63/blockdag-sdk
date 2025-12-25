import { awakening, createDagAAClient, parseDAG } from "@dag-kit/kit";
import {
  createTurnkeySigner,
  createWebAuthnStamper,
  createIframeStamper,
  createApiKeyStamper,
} from "./index";
import { sepolia } from "viem/chains";

const PUBLIC_KEY = process.env.PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const org_Id = process.env.ORG_ID;
async function exampleWithWebAuthn() {
  console.log("Setting up Turnkey with webAuthn (Passkey)...");

  //   const stamper = await createWebAuthnStamper();

  const stamper2 = await createApiKeyStamper(PUBLIC_KEY, PRIVATE_KEY!);
  const turnkeySigner = createTurnkeySigner({
    chain: awakening.chain_config,
    rpcUrl: "https://rpc.awakening.bdagscan.com",
    turnkeyConfig: {
      baseUrl: "https://api.turnkey.com",
      organizationId: org_Id!,
      stamper: stamper2,
    },
  });

  await turnkeySigner.connect();

  const signerAddress = await turnkeySigner.getAddress();
  console.log("Signer Address:", signerAddress);

  const dagClient = createDagAAClient({
    chain: awakening.chain_config,
    rpcUrl: "https://rpc.awakening.bdagscan.com",
    bundlerUrl: awakening.bundler_rpc,
    paymasterUrl: "http://localhost:3001/rpc",
    factoryAddress: "0x8FaB6DF00085eb05D5F2C1FA46a6E539587ae3f3",
  });

  const smartAccountAddress = await dagClient.connectSmartAccount({
    signer: turnkeySigner!,
  });

  console.log("Smart Account Address:", smartAccountAddress);

  const isDeployed = await dagClient.isDeployed();
  console.log("Is Smart Account Deployed:", isDeployed);

  const balance = await dagClient.getBalance();
  console.log("Balance:", balance.toString(), "wei");
}

(async () => {
  exampleWithWebAuthn();
})();
