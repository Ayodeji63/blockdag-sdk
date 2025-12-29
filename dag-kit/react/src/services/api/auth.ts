import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Initialize email authentication
export const initEmailAuth = async ({
  email,
  targetPublicKey,
  baseUrl,
}: {
  email: string;
  targetPublicKey: string;
  baseUrl?: string;
}) => {
  try {
    const { data } = await apiClient.post("/auth/email/init", {
      email,
      targetPublicKey,
      baseUrl,
    });
    return data;
  } catch (error) {
    console.error("initEmailAuth error:", error);
    throw error;
  }
};

// Verify OTP
export const verifyOtp = async ({
  otpId,
  otpCode,
  publicKey,
}: {
  otpId: string;
  otpCode: string;
  publicKey: string;
}) => {
  const { data } = await apiClient.post("/auth/otp/verify", {
    otpId,
    otpCode,
    publicKey,
  });
  console.log("verifyOtp data:", data);
  return data;
};

// OTP Login
export const otpLogin = async ({
  email,
  publicKey,
  verificationToken,
}: {
  email: string;
  publicKey: string;
  verificationToken: string;
}) => {
  const { data } = await apiClient.post("/auth/otp/login", {
    email,
    publicKey,
    verificationToken,
  });
  return data;
};

// OAuth Login
export const oauth = async ({
  credential,
  publicKey,
  subOrgId,
}: {
  credential: string;
  publicKey: string;
  subOrgId: string;
}) => {
  const { data } = await apiClient.post("/auth/oauth", {
    credential,
    publicKey,
    subOrgId,
  });
  return data;
};

// Create user sub-organization
export const createUserSubOrg = async (params: {
  email?: string;
  passkey?: {
    challenge: string;
    attestation: any;
  };
  oauth?: {
    oidcToken: string;
    providerName: string;
  };
  wallet?: {
    publicKey: string;
    type: string;
  };
}) => {
  const { data } = await apiClient.post("/auth/suborg/create", params);
  return data;
};

// Get sub-organization ID
export const getSubOrgId = async (params: {
  email?: string;
  publicKey?: string;
  username?: string;
  oidcToken?: string;
}) => {
  const { data } = await apiClient.post("/auth/suborg/id", params);
  return data;
};

// Exchange Facebook token
export const exchangeFacebookToken = async (
  code: string,
  codeVerifier: string
) => {
  const { data } = await apiClient.post("/auth/facebook/exchange-token", {
    code,
    codeVerifier,
  });
  return data;
};

// Get user
export const getUser = async (userId: string, subOrgId: string) => {
  const { data } = await apiClient.get(`/turnkey/user/${userId}/${subOrgId}`);
  return data;
};

// Get authenticators
export const getAuthenticators = async (userId: string, subOrgId: string) => {
  const { data } = await apiClient.get(
    `/turnkey/authenticators/${userId}/${subOrgId}`
  );
  return data;
};

// Get authenticator
export const getAuthenticator = async (
  authenticatorId: string,
  subOrgId: string
) => {
  const { data } = await apiClient.get(
    `/turnkey/authenticator/${authenticatorId}/${subOrgId}`
  );
  return data;
};

// Get wallets with accounts
export const getWalletsWithAccounts = async (organizationId: string) => {
  const { data } = await apiClient.get(`/wallet/wallets/${organizationId}`);
  return data;
};

// Get specific wallet
export const getWallet = async (walletId: string, organizationId: string) => {
  const { data } = await apiClient.get(
    `/wallet/wallet/${walletId}/${organizationId}`
  );
  return data;
};

// Fund wallet
export const fundWallet = async (address: string) => {
  const { data } = await apiClient.post("/wallet/fund", { address });
  return data;
};

export default apiClient;
