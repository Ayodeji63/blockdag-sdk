import { awakening } from "@dag-kit/kit";
import {
  ApiKeyStamper,
  DEFAULT_ETHEREUM_ACCOUNTS,
  TurnkeyServerClient,
} from "@turnkey/sdk-server";
import { createAccount } from "@turnkey/viem";
import { WalletType } from "@turnkey/wallet-stamper";
import { decode, JwtPayload } from "jsonwebtoken";
import {
  Address,
  createWalletClient,
  getAddress,
  http,
  parseEther,
} from "viem";
import { getDagClient, getTurnkeyWalletClient } from "../lib/web3";

const {
  TURNKEY_API_PUBLIC_KEY,
  TURNKEY_API_PRIVATE_KEY,
  TURNKEY_ORGANIZATION_ID,
  TURNKEY_WARCHEST_API_PUBLIC_KEY,
  TURNKEY_WARCHEST_API_PRIVATE_KEY,
  TURNKEY_WARCHEST_ORGANIZATION_ID,
  WARCHEST_PRIVATE_KEY_ID,
  TURNKEY_API_BASE_URL,
  BASE_URL,
} = process.env;

if (
  !TURNKEY_API_PUBLIC_KEY ||
  !TURNKEY_API_PRIVATE_KEY ||
  !TURNKEY_ORGANIZATION_ID
) {
  throw new Error("Missing required Turnkey environment variables");
}

const stamper = new ApiKeyStamper({
  apiPublicKey: TURNKEY_API_PUBLIC_KEY,
  apiPrivateKey: TURNKEY_API_PRIVATE_KEY,
});

const client = new TurnkeyServerClient({
  apiBaseUrl: TURNKEY_API_BASE_URL || "https://api.turnkey.com",
  organizationId: TURNKEY_ORGANIZATION_ID,
  stamper,
});

function decodeJwt(credential: string): JwtPayload | null {
  const decoded = decode(credential);
  if (decoded && typeof decoded === "object" && "email" in decoded) {
    return decoded as JwtPayload;
  }
  return null;
}

export const exchangeToken = async (code: string, codeVerifier: string) => {
  const graphAPIVersion = process.env.FACEBOOK_GRAPH_API_VERSION;
  const url = `https://graph.facebook.com/v${graphAPIVersion}/oauth/access_token`;
  const clientID = process.env.FACEBOOK_CLIENT_ID;
  const redirectURI = `${BASE_URL}/oauth-callback/facebook`;

  const params = new URLSearchParams({
    client_id: clientID!,
    redirect_uri: redirectURI,
    code: code,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  const idToken = data.id_token;

  if (!idToken) {
    throw new Error("id_token not found in response");
  }

  return idToken;
};

export const createUserSubOrg = async ({
  email,
  passkey,
  oauth,
  wallet,
}: {
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
    type: WalletType;
  };
}) => {
  const authenticators = passkey
    ? [
        {
          authenticatorName: "Passkey",
          challenge: passkey.challenge,
          attestation: passkey.attestation,
        },
      ]
    : [];

  const oauthProviders = oauth
    ? [
        {
          providerName: oauth.providerName,
          oidcToken: oauth.oidcToken,
        },
      ]
    : [];

  const apiKeys = wallet
    ? [
        {
          apiKeyName: "Wallet Auth - Embedded Wallet",
          publicKey: wallet.publicKey,
          curveType:
            wallet.type === WalletType.Ethereum
              ? ("API_KEY_CURVE_SECP256K1" as const)
              : ("API_KEY_CURVE_ED25519" as const),
        },
      ]
    : [];

  let userEmail = email;
  if (oauth) {
    const decoded = decodeJwt(oauth.oidcToken);
    if (decoded?.email) {
      userEmail = decoded.email;
    }
  }

  const subOrganizationName = `Sub Org - ${userEmail}`;
  const userName = userEmail ? userEmail.split("@")?.[0] || userEmail : "";

  const subOrg = await client.createSubOrganization({
    organizationId: TURNKEY_ORGANIZATION_ID!,
    subOrganizationName,
    rootUsers: [
      {
        userName,
        userEmail,
        oauthProviders,
        authenticators,
        apiKeys,
      },
    ],
    rootQuorumThreshold: 1,
    wallet: {
      walletName: "Default Wallet",
      accounts: DEFAULT_ETHEREUM_ACCOUNTS,
    },
  });

  const userId = subOrg.rootUserIds?.[0];
  if (!userId) {
    throw new Error("No root user ID found");
  }

  const { user } = await client.getUser({
    organizationId: subOrg.subOrganizationId,
    userId,
  });

  return { subOrg, user };
};

export const oauth = async ({
  credential,
  publicKey,
  subOrgId,
}: {
  credential: string;
  publicKey: string;
  subOrgId: string;
}) => {
  const oauthResponse = await client.oauthLogin({
    oidcToken: credential,
    publicKey,
    organizationId: subOrgId,
  });

  return {
    userId: oauthResponse.activity.votes?.[0]?.userId,
    session: oauthResponse.session,
    organizationId: subOrgId,
  };
};

const getMagicLinkTemplate = (
  action: string,
  email: string,
  method: string,
  publicKey: string,
  baseUrl: string = BASE_URL || "http://localhost:3000"
) =>
  `${baseUrl}/email-${action}?userEmail=${email}&continueWith=${method}&publicKey=${publicKey}&credentialBundle=%s`;

export const createDagSmartAccountOnServer = async ({
  subOrgId,
  privateKeyId,
}: {
  subOrgId: string;
  privateKeyId: string;
}) => {
  const dagClient = getDagClient();

  const stamper = new ApiKeyStamper({
    apiPublicKey: TURNKEY_API_PUBLIC_KEY!,
    apiPrivateKey: TURNKEY_API_PRIVATE_KEY!,
  });

  const serverClient = new TurnkeyServerClient({
    apiBaseUrl: TURNKEY_API_BASE_URL || "https://api.turnkey.com",
    organizationId: subOrgId,
    stamper,
  });

  const turnkeyAccount = await createAccount({
    client: serverClient,
    organizationId: subOrgId,
    signWith: privateKeyId,
  });

  const turnkeySigner = {
    async isReady() {
      return true;
    },
    async getAccount() {
      return turnkeyAccount;
    },
    async getAddress() {
      return turnkeyAccount.address;
    },
    async getWalletClient() {
      return createWalletClient({
        account: turnkeyAccount,
        chain: awakening.chain_config!,
        transport: http("https://relay.awakening.bdagscan.com"),
      });
    },
  };

  const smartAccountAddress = await dagClient.connectSmartAccount({
    signer: turnkeySigner,
  });

  return { smartAccountAddress };
};

export const initEmailAuth = async ({
  email,
  targetPublicKey,
  baseUrl,
}: {
  email: string;
  targetPublicKey: string;
  baseUrl?: string;
}) => {
  let organizationId = await getSubOrgIdByEmail(email);

  if (!organizationId) {
    const { subOrg } = await createUserSubOrg({ email });
    organizationId = subOrg.subOrganizationId;
  }

  const magicLinkTemplate = getMagicLinkTemplate(
    "auth",
    email,
    "email",
    targetPublicKey,
    baseUrl
  );

  if (organizationId?.length) {
    const authResponse = await client.initOtp({
      userIdentifier: targetPublicKey,
      otpType: "OTP_TYPE_EMAIL" as const,
      contact: email,
      emailCustomization: {
        magicLinkTemplate,
      },
    });
    return authResponse;
  }
};

export const verifyOtp = async ({
  otpId,
  otpCode,
  publicKey,
}: {
  otpId: string;
  otpCode: string;
  publicKey: string;
}) => {
  return await client.verifyOtp({ otpId, otpCode });
};

export const otpLogin = async ({
  publicKey,
  verificationToken,
  email,
}: {
  publicKey: string;
  verificationToken: string;
  email: string;
}) => {
  const subOrgId = await getSubOrgIdByEmail(email);

  if (!subOrgId) {
    throw new Error("Could not find suborg by email");
  }

  const sessionResponse = await client.otpLogin({
    verificationToken,
    publicKey,
    organizationId: subOrgId,
  });

  const { smartAccountAddress } = await createDagSmartAccountOnServer({
    subOrgId: subOrgId,
    privateKeyId: TURNKEY_API_PRIVATE_KEY!,
  });

  return {
    userId: sessionResponse.activity.votes[0]?.userId,
    session: sessionResponse.session,
    organizationId: subOrgId,
    smartAccountAddress,
  };
};

export async function getSubOrgId(param: {
  email?: string;
  publicKey?: string;
  username?: string;
  oidcToken?: string;
}): Promise<string> {
  let filterType: string;
  let filterValue: string;

  if (param.email) {
    filterType = "EMAIL";
    filterValue = param.email;
  } else if (param.publicKey) {
    filterType = "PUBLIC_KEY";
    filterValue = param.publicKey;
  } else if (param.username) {
    filterType = "USERNAME";
    filterValue = param.username;
  } else if (param.oidcToken) {
    filterType = "OIDC_TOKEN";
    filterValue = param.oidcToken;
  } else {
    throw new Error("Invalid parameter");
  }

  const { organizationIds } = await client.getSubOrgIds({
    organizationId: TURNKEY_ORGANIZATION_ID!,
    filterType,
    filterValue,
  });

  return organizationIds[0];
}

export const getSubOrgIdByEmail = async (email: string) => {
  return getSubOrgId({ email });
};

export const getSubOrgIdByPublicKey = async (publicKey: string) => {
  return getSubOrgId({ publicKey });
};

export const getSubOrgIdByUsername = async (username: string) => {
  return getSubOrgId({ username });
};

export const getUser = async (userId: string, subOrgId: string) => {
  return client.getUser({
    organizationId: subOrgId,
    userId,
  });
};

export async function getWalletsWithAccounts(organizationId: string) {
  const { wallets } = await client.getWallets({ organizationId });

  return await Promise.all(
    wallets.map(async (wallet) => {
      const { accounts } = await client.getWalletAccounts({
        organizationId,
        walletId: wallet.walletId,
      });

      const accountsWithBalance = accounts
        .filter((account) => account.curve === "CURVE_SECP256K1")
        .map(({ address, ...account }) => ({
          ...account,
          address: getAddress(address),
          balance: undefined,
        }));

      return { ...wallet, accounts: accountsWithBalance };
    })
  );
}

export const getWallet = async (walletId: string, organizationId: string) => {
  const [{ wallet }, { accounts }] = await Promise.all([
    client.getWallet({ walletId, organizationId }),
    client.getWalletAccounts({ walletId, organizationId }),
  ]);

  const mappedAccounts = accounts.map(({ address, ...account }) => ({
    ...account,
    address: getAddress(address),
    balance: undefined,
  }));

  return { ...wallet, accounts: mappedAccounts };
};

export const getAuthenticators = async (userId: string, subOrgId: string) => {
  const { authenticators } = await client.getAuthenticators({
    organizationId: subOrgId,
    userId,
  });
  return authenticators;
};

export const getAuthenticator = async (
  authenticatorId: string,
  subOrgId: string
) => {
  const { authenticator } = await client.getAuthenticator({
    organizationId: subOrgId,
    authenticatorId,
  });
  return authenticator;
};

export const fundWallet = async (address: Address) => {
  const value = parseEther("0.001");

  const warchestStamper = new ApiKeyStamper({
    apiPublicKey: TURNKEY_WARCHEST_API_PUBLIC_KEY!,
    apiPrivateKey: TURNKEY_WARCHEST_API_PRIVATE_KEY!,
  });

  const warchestClient = new TurnkeyServerClient({
    apiBaseUrl: TURNKEY_API_BASE_URL || "https://api.turnkey.com",
    organizationId: TURNKEY_WARCHEST_ORGANIZATION_ID!,
    stamper: warchestStamper,
  });

  const walletClient = await getTurnkeyWalletClient(
    warchestClient,
    WARCHEST_PRIVATE_KEY_ID!
  );

  const txHash = await walletClient.sendTransaction({
    to: address,
    value,
  });

  return txHash;
};
