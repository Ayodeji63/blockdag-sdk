import express from "express";
import * as turnkeyService from "../services/turnkey.services";

const router = express.Router();

// Get wallets with accounts
router.get("/wallets/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;

    const wallets = await turnkeyService.getWalletsWithAccounts(organizationId);
    res.json({ wallets });
  } catch (error: any) {
    console.error("[getWalletsWithAccounts] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific wallet
router.get("/wallet/:walletId/:organizationId", async (req, res) => {
  try {
    const { walletId, organizationId } = req.params;

    const wallet = await turnkeyService.getWallet(walletId, organizationId);
    res.json({ wallet });
  } catch (error: any) {
    console.error("[getWallet] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fund wallet
router.post("/fund", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required" });
    }

    const txHash = await turnkeyService.fundWallet(address);
    res.json({ txHash });
  } catch (error: any) {
    console.error("[fundWallet] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
