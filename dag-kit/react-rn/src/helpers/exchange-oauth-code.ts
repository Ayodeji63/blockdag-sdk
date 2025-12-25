import { DagKitConfig, Session, SocialProvider, User } from "../types";

export async function exchangeOAuthCode(
  code: string,
  provider: SocialProvider,
  config?: DagKitConfig
): Promise<{ user: User; session: Session }> {
  // Call your backend to exchange code for tokens
  const response = await fetch(
    `${config?.turnkeyApiUrl || ""}/api/oauth/exchange`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        provider,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to exchange OAuth code");
  }

  const data = await response.json();

  // Transform response to User and Session
  const user: User = {
    id: data.userId,
    email: data.email,
    name: data.name,
    picture: data.picture,
    provider: provider,
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
