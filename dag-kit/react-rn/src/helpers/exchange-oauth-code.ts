import { DagKitConfig, Session, SocialProvider, User } from "../types";

export async function exchangeOAuthCode(
  code: string,
  provider: SocialProvider,
  config?: DagKitConfig
): Promise<{ user: User; session: Session }> {
  // if (!config?.turnkeyApiUrl) {
  //   throw new Error("turnkeyApiUrl is required for OAuth exchange");
  // }

  const response = await fetch(`http://localhost:3000/api/oauth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, provider }),
  });

  const text = await response.text();

  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Backend returned invalid JSON");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Failed to exchange OAuth code");
  }

  const user: User = {
    id: data.userId,
    email: data.email,
    name: data.name,
    picture: data.picture,
    provider,
    walletAddress: data.walletAddress,
    createdAt: Date.now(),
  };

  const session: Session = {
    userId: data.userId,
    turnkeyOrganizationId: data.turnkeyOrganizationId,
    turnkeyPrivateKeyId: data.turnkeyPrivateKeyId,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
    isActive: true,
  };

  return { user, session };
}
