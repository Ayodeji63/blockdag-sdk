// Test if paymaster service is working

async function testPaymasterService() {
  const PAYMASTER_URL = "http://localhost:3001/rpc";

  console.log("Testing paymaster service...");

  // Test 1: Health check
  try {
    const healthResponse = await fetch("http://localhost:3001/health");
    const health = await healthResponse.json();
    console.log("✅ Health check passed:", health);
  } catch (error) {
    console.error("❌ Health check failed:", error);
    console.error("Is the paymaster service running? Run: pnpm start");
    process.exit(1);
  }

  // Test 2: Get paymaster info
  try {
    const infoResponse = await fetch("http://localhost:3001/info");
    const info = await infoResponse.json();
    console.log("✅ Paymaster info:", info);
  } catch (error) {
    console.error("❌ Failed to get paymaster info:", error);
  }

  // Test 3: Test pm_getPaymasterStubData
  const mockUserOp = {
    sender: "0xCa28afE1e9Fb8B9AF996c97F3dc291bE54EAEe4E",
    nonce: "0x0",
    initCode: "0x",
    callData: "0x",
    callGasLimit: "0x30d40",
    verificationGasLimit: "0x30d40",
    preVerificationGas: "0x30d40",
    maxFeePerGas: "0xba43b7400",
    maxPriorityFeePerGas: "0xba43b7400",
    paymasterAndData: "0x",
    signature: "0x",
  };

  try {
    const response = await fetch(PAYMASTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "pm_getPaymasterStubData",
        params: [mockUserOp, "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", {}],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ pm_getPaymasterStubData failed:", data.error);
    } else {
      console.log("✅ pm_getPaymasterStubData success:", data.result);
    }
  } catch (error) {
    console.error("❌ pm_getPaymasterStubData request failed:", error);
  }

  // Test 4: Test pm_sponsorUserOperation
  try {
    const response = await fetch(PAYMASTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "pm_sponsorUserOperation",
        params: [mockUserOp, "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", {}],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ pm_sponsorUserOperation failed:", data.error);
    } else {
      console.log("✅ pm_sponsorUserOperation success:");
      console.log("   paymasterAndData:", data.result.paymasterAndData);
    }
  } catch (error) {
    console.error("❌ pm_sponsorUserOperation request failed:", error);
  }

  console.log("\n✅ Paymaster tests complete!");
}

testPaymasterService().catch(console.error);
