import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { TurnkeyClient } from "@turnkey/http";
import { WebauthnStamper } from "@turnkey/webauthn-stamper";
import { createAccount } from "@turnkey/viem";
import {
  createWalletClient,
  http,
  type Chain,
  type Address,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";

export type SocialProvider =
  | "google"
  | "apple"
  | "facebook"
  | "discord"
  | "twitter"
  // | "passkey"
  | "email";

export interface User {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  provider: SocialProvider;
  walletAddress?: Address;
  createdAt: number;
  subOrganizationId?: string;
  privateKeyId?: string;
}

export interface Session {
  userId: string;
  turnkeyOrganizationId: string;
  turnkeyPrivateKeyId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  isActive: boolean;
}

export interface DagKitConfig {
  turnkeyApiUrl?: string;
  turnkeyOrganizationId: string;
  chain?: Chain;
  rpcUrl?: string;
  enabledProviders?: SocialProvider[];
  appearance?: {
    mode?: "light" | "dark";
    logo?: string;
    brandColor?: string;
  };
}
