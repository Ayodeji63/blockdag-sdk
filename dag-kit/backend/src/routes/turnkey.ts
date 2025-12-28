import express from "express";
import * as turnkeyService from "../services/turnkey.services";

const router = express.Router();

// Get user
router.get("/user/:userId/:subOrgId", async (req, res) => {
  try {
    const { userId, subOrgId } = req.params;

    const result = await turnkeyService.getUser(userId, subOrgId);
    res.json(result);
  } catch (error: any) {
    console.error("[getUser] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get authenticators
router.get("/authenticators/:userId/:subOrgId", async (req, res) => {
  try {
    const { userId, subOrgId } = req.params;

    const authenticators = await turnkeyService.getAuthenticators(
      userId,
      subOrgId
    );
    res.json({ authenticators });
  } catch (error: any) {
    console.error("[getAuthenticators] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get authenticator
router.get("/authenticator/:authenticatorId/:subOrgId", async (req, res) => {
  try {
    const { authenticatorId, subOrgId } = req.params;

    const authenticator = await turnkeyService.getAuthenticator(
      authenticatorId,
      subOrgId
    );
    res.json({ authenticator });
  } catch (error: any) {
    console.error("[getAuthenticator] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
