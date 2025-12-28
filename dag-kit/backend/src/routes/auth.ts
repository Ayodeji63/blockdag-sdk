import express from "express";
import * as turnkeyService from "../services/turnkey.services";

const router = express.Router();

// Initialize email authentication
router.post("/email/init", async (req, res) => {
  try {
    const { email, targetPublicKey, baseUrl } = req.body;

    if (!email || !targetPublicKey) {
      return res
        .status(400)
        .json({ error: "Email and targetPublicKey are required" });
    }

    const result = await turnkeyService.initEmailAuth({
      email,
      targetPublicKey,
      baseUrl,
    });

    res.json(result);
  } catch (error: any) {
    console.error("[initEmailAuth] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
router.post("/otp/verify", async (req, res) => {
  try {
    const { otpId, otpCode, publicKey } = req.body;

    if (!otpId || !otpCode) {
      return res.status(400).json({ error: "otpId and otpCode are required" });
    }

    const result = await turnkeyService.verifyOtp({
      otpId,
      otpCode,
      publicKey,
    });

    res.json(result);
  } catch (error: any) {
    console.error("[verifyOtp] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// OTP Login
router.post("/otp/login", async (req, res) => {
  try {
    const { publicKey, verificationToken, email } = req.body;

    if (!publicKey || !verificationToken || !email) {
      return res.status(400).json({
        error: "publicKey, verificationToken, and email are required",
      });
    }

    const result = await turnkeyService.otpLogin({
      publicKey,
      verificationToken,
      email,
    });

    res.json(result);
  } catch (error: any) {
    console.error("[otpLogin] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// OAuth Login
router.post("/oauth", async (req, res) => {
  try {
    const { credential, publicKey, subOrgId } = req.body;

    if (!credential || !publicKey || !subOrgId) {
      return res.status(400).json({
        error: "credential, publicKey, and subOrgId are required",
      });
    }

    const result = await turnkeyService.oauth({
      credential,
      publicKey,
      subOrgId,
    });

    res.json(result);
  } catch (error: any) {
    console.error("[oauth] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create user sub-organization
router.post("/suborg/create", async (req, res) => {
  try {
    const { email, passkey, oauth, wallet } = req.body;

    const result = await turnkeyService.createUserSubOrg({
      email,
      passkey,
      oauth,
      wallet,
    });

    res.json(result);
  } catch (error: any) {
    console.error("[createUserSubOrg] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get sub-organization ID
router.post("/suborg/id", async (req, res) => {
  try {
    const { email, publicKey, username, oidcToken } = req.body;

    if (!email && !publicKey && !username && !oidcToken) {
      return res.status(400).json({
        error: "One of email, publicKey, username, or oidcToken is required",
      });
    }

    const subOrgId = await turnkeyService.getSubOrgId({
      email,
      publicKey,
      username,
      oidcToken,
    });

    res.json({ subOrgId });
  } catch (error: any) {
    console.error("[getSubOrgId] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Exchange Facebook token
router.post("/facebook/exchange-token", async (req, res) => {
  try {
    const { code, codeVerifier } = req.body;

    if (!code || !codeVerifier) {
      return res
        .status(400)
        .json({ error: "code and codeVerifier are required" });
    }

    const idToken = await turnkeyService.exchangeToken(code, codeVerifier);
    res.json({ idToken });
  } catch (error: any) {
    console.error("[exchangeToken] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
