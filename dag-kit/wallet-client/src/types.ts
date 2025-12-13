import type { SmartContractAccount } from "@aa-sdk/core";
import type { AlchemyTransport } from "@account-kit/infra";
import type {
  Address,
  Chain,
  Client,
  Hex,
  JsonRpcAccount,
  Transport,
} from "viem";
import type { RequestAccountParams } from "./client/actions/requestAccount.ts";
import type { WalletServerViemRpcSchema } from "@alchemy/wallet-api-types/rpc";

export type CreateInnerClientParams<
  TAccount extends Address | undefined = Address | undefined,
> = {
  chain: Chain;
  transport: AlchemyTransport;
  policyIds?: string[];
  account?: TAccount | Address | undefined;
};
/**
 * This type definition creates a reusable base type for wallet API clients wiht flexible extension capabilities.
 * It's a generic type alias that wraps the `Client` type from the viem library, providing a standardized structure for your wallet's RPC communication later.
 */
export type InnerWalletApiClientBase<
  TExtend extends { [key: string]: unknown } | undefined =
    | { [key: string]: unknown }
    | undefined,
> = Client<
  Transport,
  Chain,
  JsonRpcAccount<Address> | undefined, // The accounnt that signs transactions, means it's an accout that communicates via JSON-RPC protocol with an Ethereum address. The ` | undefied ` allows for clinet without an account (useful during initialization)
  WalletServerViemRpcSchema, // This defines which RPC methods the client can call, Instead of generic blockchain methods, this schema specifies wallet-specific RPC operations. This ensures type safety - TypeScript only let you call methods that actually exist.
  { policyIds?: string[] } & TExtend
>;

export type CachedAccount = {
  account: SmartContractAccount;
  requestParams: RequestAccountParams;
};

export type InternalState = {
  setAccount: (account: CachedAccount) => void;
  getAccount: () => CachedAccount | undefined;
};

export type InnerWalletApiClient = InnerWalletApiClientBase<{
  internal: InternalState;
}>;

export type WithoutChainId<T> = T extends { chainId: Hex }
  ? Omit<T, "chainId">
  : T;

export type WithoutRawPayload<T> = T extends { rawPayload: Hex }
  ? Omit<T, "rawPayload">
  : T;
