// ==============================================================================
// DAG Kit Backend - Complete Express.js API Server
// Handles OAuth, Turnkey integration, and session management
// ==============================================================================

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables
const config = {
  // Turnkey Configuration
  turnkey: {
    apiBaseUrl: "https://api.turnkey.com",
    organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
    apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
    apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  },

  // OAuth Providers
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:5173/auth/callback",
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
      redirectUri:
        process.env.APPLE_REDIRECT_URI || "http://localhost:5173/auth/callback",
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      redirectUri:
        process.env.DISCORD_REDIRECT_URI ||
        "http://localhost:5173/auth/callback",
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex"),
    accessTokenExpiry: "1h",
    refreshTokenExpiry: "7d",
  },

  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

// ==============================================================================
// MIDDLEWARE
// ==============================================================================

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173", // Vite default port
      "http://localhost:5174",
      config.frontendUrl,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// ==============================================================================
// TURNKEY CLIENT
// ==============================================================================

const stamper = new ApiKeyStamper({
  apiPublicKey: config.turnkey.apiPublicKey,
  apiPrivateKey: config.turnkey.apiPrivateKey,
});

const turnkeyClient = new TurnkeyClient(
  { baseUrl: config.turnkey.apiBaseUrl },
  stamper
);

// ==============================================================================
// TYPES
// ==============================================================================

interface UserData {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: "google" | "apple" | "discord" | "email";
}

interface TurnkeySubOrg {
  subOrganizationId: string;
  privateKeyId: string;
  walletAddress: string;
}

// ==============================================================================
// DATABASE (In-Memory - Replace with Real Database)
// ==============================================================================

interface UserRecord extends UserData {
  subOrganizationId: string;
  privateKeyId: string;
  walletAddress: string;
  createdAt: number;
  refreshToken?: string;
}

const usersDB = new Map<string, UserRecord>();

function saveUser(user: UserRecord) {
  usersDB.set(user.id, user);
}

function getUserById(id: string): UserRecord | undefined {
  return usersDB.get(id);
}

function getUserByEmail(email: string): UserRecord | undefined {
  return Array.from(usersDB.values()).find((u) => u.email === email);
}

// ==============================================================================
// TURNKEY HELPER FUNCTIONS
// ==============================================================================

async function createTurnkeySubOrganization(
  email: string,
  userName?: string
): Promise<TurnkeySubOrg> {
  try {
    // Create sub-organization
    const subOrgResponse = await turnkeyClient.createSubOrganization({
      type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7",
      timestampMs: String(Date.now()),
      organizationId: config.turnkey.organizationId,
      parameters: {
        subOrganizationName: `user-${email}`,
        rootUsers: [
          {
            userName: userName || email,
            userEmail: email,
            apiKeys: [],
            authenticators: [],
            oauthProviders: [],
          },
        ],
        rootQuorumThreshold: 1,
      },
    });

    const subOrgId =
      subOrgResponse.activity.result.createSubOrganizationResultV7
        ?.subOrganizationId;

    if (!subOrgId) {
      throw new Error("Failed to create sub-organization");
    }

    console.log("✅ Created sub-organization:", subOrgId);

    // Create private key in the sub-organization
    const privateKeyResponse = await turnkeyClient.createPrivateKeys({
      type: "ACTIVITY_TYPE_CREATE_PRIVATE_KEYS_V2",
      timestampMs: String(Date.now()),
      organizationId: subOrgId,
      parameters: {
        privateKeys: [
          {
            privateKeyName: `key-${Date.now()}`,
            curve: "CURVE_SECP256K1",
            addressFormats: ["ADDRESS_FORMAT_ETHEREUM"],
            privateKeyTags: [],
          },
        ],
      },
    });

    const privateKeyId =
      privateKeyResponse.activity.result.createPrivateKeysResultV2
        ?.privateKeys?.[0]?.privateKeyId;
    const walletAddress =
      privateKeyResponse.activity.result.createPrivateKeysResultV2
        ?.privateKeys?.[0]?.addresses?.[0]?.address;

    if (!privateKeyId || !walletAddress) {
      throw new Error("Failed to create private key");
    }

    console.log("✅ Created private key:", privateKeyId);
    console.log("✅ Wallet address:", walletAddress);

    return {
      subOrganizationId: subOrgId,
      privateKeyId: privateKeyId,
      walletAddress: walletAddress,
    };
  } catch (error: any) {
    console.error("❌ Turnkey error:", error.message);
    throw error;
  }
}

// ==============================================================================
// JWT HELPER FUNCTIONS
// ==============================================================================

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: "access" }, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry,
  } as jwt.SignOptions);
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: "refresh" }, config.jwt.secret, {
    expiresIn: config.jwt.refreshTokenExpiry,
  } as jwt.SignOptions);
}

function verifyToken(token: string): { userId: string; type: string } {
  return jwt.verify(token, config.jwt.secret) as {
    userId: string;
    type: string;
  };
}

// ==============================================================================
// OAUTH HELPER FUNCTIONS
// ==============================================================================

async function exchangeGoogleCode(code: string): Promise<UserData> {
  // Exchange code for tokens
  const tokenResponse = await axios.post(
    "https://oauth2.googleapis.com/token",
    {
      code,
      client_id: config.oauth.google.clientId,
      client_secret: config.oauth.google.clientSecret,
      redirect_uri: config.oauth.google.redirectUri,
      grant_type: "authorization_code",
    }
  );

  const { access_token } = tokenResponse.data;

  // Get user info
  const userResponse = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );

  const { id, email, name, picture } = userResponse.data;

  return {
    id: `google-${id}`,
    email,
    name,
    picture,
    provider: "google",
  };
}

async function exchangeAppleCode(code: string): Promise<UserData> {
  // Apple OAuth implementation
  const tokenResponse = await axios.post(
    "https://appleid.apple.com/auth/token",
    {
      code,
      client_id: config.oauth.apple.clientId,
      client_secret: config.oauth.apple.clientSecret,
      redirect_uri: config.oauth.apple.redirectUri,
      grant_type: "authorization_code",
    }
  );

  // Decode ID token
  const idToken = tokenResponse.data.id_token;
  const decoded: any = jwt.decode(idToken);

  return {
    id: `apple-${decoded.sub}`,
    email: decoded.email,
    name: decoded.name,
    provider: "apple",
  };
}

async function exchangeDiscordCode(code: string): Promise<UserData> {
  // Exchange code for tokens
  const tokenResponse = await axios.post(
    "https://discord.com/api/oauth2/token",
    new URLSearchParams({
      client_id: config.oauth.discord.clientId,
      client_secret: config.oauth.discord.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.oauth.discord.redirectUri,
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  const { access_token } = tokenResponse.data;

  // Get user info
  const userResponse = await axios.get("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const { id, email, username, avatar } = userResponse.data;

  return {
    id: `discord-${id}`,
    email,
    name: username,
    picture: avatar
      ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
      : undefined,
    provider: "discord",
  };
}

// ==============================================================================
// API ROUTES
// ==============================================================================

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// ==============================================================================
// OAuth Credentials Endpoint
// ==============================================================================

app.get("/api/oauth/credentials", (req: Request, res: Response) => {
  const { provider } = req.query;

  const credentials: any = {
    google: {
      clientId: config.oauth.google.clientId,
      redirectUri: config.oauth.google.redirectUri,
    },
    apple: {
      clientId: config.oauth.apple.clientId,
      redirectUri: config.oauth.apple.redirectUri,
    },
    discord: {
      clientId: config.oauth.discord.clientId,
      redirectUri: config.oauth.discord.redirectUri,
    },
  };

  if (!provider || !credentials[provider as string]) {
    return res.status(400).json({ error: "Invalid provider" });
  }

  res.json(credentials[provider as string]);
});

// ==============================================================================
// OAuth Exchange Endpoint
// ==============================================================================

app.post("/api/oauth/exchange", async (req: Request, res: Response) => {
  const { code, provider } = req.body;

  if (!code || !provider) {
    return res.status(400).json({ error: "Missing code or provider" });
  }

  try {
    // Exchange code for user data based on provider
    let userData: UserData;

    switch (provider) {
      case "google":
        userData = await exchangeGoogleCode(code);
        break;
      case "apple":
        userData = await exchangeAppleCode(code);
        break;
      case "discord":
        userData = await exchangeDiscordCode(code);
        break;
      default:
        return res.status(400).json({ error: "Unsupported provider" });
    }

    console.log("📧 User data from OAuth:", userData);

    // Check if user exists
    let user = getUserById(userData.id);

    if (!user) {
      // Create new user - setup Turnkey sub-org
      console.log("🔑 Creating new Turnkey sub-organization...");
      const turnkeyData = await createTurnkeySubOrganization(
        userData.email,
        userData.name
      );

      user = {
        ...userData,
        ...turnkeyData,
        createdAt: Date.now(),
      };

      saveUser(user);
      console.log("✅ New user created:", user.id);
    } else {
      console.log("✅ Existing user found:", user.id);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update refresh token
    user.refreshToken = refreshToken;
    saveUser(user);

    // Return session data
    res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      walletAddress: user.walletAddress,
      turnkeyOrganizationId: user.subOrganizationId,
      turnkeyPrivateKeyId: user.privateKeyId,
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    });
  } catch (error: any) {
    console.error("❌ OAuth exchange error:", error);
    res.status(500).json({ error: error.message || "OAuth exchange failed" });
  }
});

// ==============================================================================
// Email/Password Authentication
// ==============================================================================

app.post("/api/auth/email/signup", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Check if user exists
    if (getUserByEmail(email)) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password (use bcrypt in production)
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Create Turnkey sub-org
    const turnkeyData = await createTurnkeySubOrganization(email, name);

    // Create user
    const user: UserRecord = {
      id: `email-${crypto.randomBytes(16).toString("hex")}`,
      email,
      name,
      provider: "email",
      ...turnkeyData,
      createdAt: Date.now(),
    };

    saveUser(user);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    saveUser(user);

    res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      walletAddress: user.walletAddress,
      turnkeyOrganizationId: user.subOrganizationId,
      turnkeyPrivateKeyId: user.privateKeyId,
      accessToken,
      refreshToken,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ error: error.message || "Signup failed" });
  }
});

app.post("/api/auth/email/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Find user
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password (implement proper verification in production)
    // const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    // if (passwordHash !== user.passwordHash) { ... }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshToken = refreshToken;
    saveUser(user);

    res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      walletAddress: user.walletAddress,
      turnkeyOrganizationId: user.subOrganizationId,
      turnkeyPrivateKeyId: user.privateKeyId,
      accessToken,
      refreshToken,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// ==============================================================================
// Token Refresh Endpoint
// ==============================================================================

app.post("/api/auth/refresh", (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const { userId } = verifyToken(refreshToken);
    const user = getUserById(userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    user.refreshToken = newRefreshToken;
    saveUser(user);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("❌ Token refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ==============================================================================
// Protected Route Example (with Auth Middleware)
// ==============================================================================

function authenticate(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  try {
    const { userId } = verifyToken(token);
    (req as any).userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/api/user/profile", authenticate, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = getUserById(userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    provider: user.provider,
    walletAddress: user.walletAddress,
    createdAt: user.createdAt,
  });
});

// ==============================================================================
// ERROR HANDLER
// ==============================================================================

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ==============================================================================
// START SERVER
// ==============================================================================

app.listen(PORT, () => {
  console.log(`🚀 DAG Kit Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
});

export default app;
