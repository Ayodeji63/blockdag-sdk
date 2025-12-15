import type { SmartAccountSigner } from "@aa-sdk/core";
import type { AlchemyTransport } from "@account-kit/infra";
import {
  type Address,
  type Chain,
  type Prettify,
  type Transport,
  createClient,
  custom,
  type JsonRpcAccount,
} from "viem";
import type { InnerWalletApiClientBase } from "../types.ts";
import {
  smartWalletClientActions,
  type SmartWalletActions,
} from "./decorator.ts";
import { Provider, RpcSchema } from "ox";
import type {
  WalletServerRpcSchemaType,
  WalletServerViemRpcSchema,
} from "@alchemy/wallet-api-types/rpc";
import { internalStateDecorator } from "../internal/decorator.ts";
import { metrics } from "../metrics.js";
import type { ToWebAuthnAccountParameters } from "viem/account-abstraction";

export type WebAuthnSigner = {
  credential: ToWebAuthnAccountParameters["credential"];
  getFn?: ToWebAuthnAccountParameters["getFn"] | undefined;
  rpId?: ToWebAuthnAccountParameters["rpId"] | undefined;
};

export type SmartWalletSigner = SmartAccountSigner<any> | WebAuthnSigner;

export type SmartWalletClientParams<
  TAccount extends Address | undefined = Address | undefined,
> = Prettify<
  {
    transport: AlchemyTransport;
    chain: Chain;
    signer: SmartWalletSigner;
    account?: TAccount | Address | undefined;
  } & (
    | { policyId?: string; policyIds?: never }
    | { policyIds?: string[]; policyId?: never }
  )
>;

/**
 * This type definition creates the primary interface for interacting with smart accounts in your SDK, it's a specialized version of `InnerWalletApiclientBase, that combines the base client infastructure with wallet-specific actions, forming the complete client that developers use to manage smart accounts
 */
export type SmartWalletClient<
  TAccount extends Address | undefined = Address | undefined,
> = InnerWalletApiClientBase<SmartWalletActions<TAccount>>;

/**
 * Creates a smart wallet client that can be used to interact with a smart account.
 *
 * @param {SmartWalletClientParams} params - The parameters for creating the smart wallet client
 * @param {AlchemyTransport} params.transport - The Alchemy transport to use
 * @param {Chain} params.chain - The chain to use
 * @param {SmartAccountSigner | WebAuthnSigner} params.signer - The signer to use for the smart account
 * @param {string} [params.policyId] - The policy ID for gas sponsorship (optional)
 * @param {Address} [params.account] - The smart account address to use (optional)
 * @returns {SmartWalletClient} - A viem-compatible client
 *
 * @example
 * ```ts
 * import { LocalAccountSigner } from "@aa-sdk/core";
 * import { alchemy, arbitrumSepolia } from "@account-kit/infra";
 * import { generatePrivateKey } from "viem/accounts";
 * import { createSmartWalletClient } from "@account-kit/wallet-client";
 *
 * const signer = LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey());
 * const transport = alchemy({
 *   apiKey: "your-alchemy-api-key",
 * });
 * const client = createSmartWalletClient({
 *   transport,
 *   chain: arbitrumSepolia,
 *   signer,
 * });
 * ```
 */
export function createSmartWalletClient<
  TAccount extends Address | undefined = undefined,
>(params: SmartWalletClientParams<TAccount>): SmartWalletClient<TAccount>;

export function createSmartWalletClient(
  params: SmartWalletClientParams
): SmartWalletClient {
  const { transport, chain, account, signer } = params;

  const policyIds = params.policyId
    ? [params.policyId]
    : params.policyIds
      ? params.policyIds
      : undefined;

  const innerClient = createClient<
    // Viem's function to create a blockChain client with specific type parameters
    Transport,
    Chain,
    JsonRpcAccount<Address> | undefined,
    WalletServerViemRpcSchema
  >({
    transport: (opts) =>
      custom(
        Provider.from(transport(opts), {
          schema: RpcSchema.from<WalletServerRpcSchemaType>(),
        })
      )(opts),
    chain,
    account,
  }).extend(() => ({
    policyIds,
    internal: internalStateDecorator(),
  }));

  metrics.trackEvent({
    name: "client_created",
    data: {
      chainId: params.chain.id,
    },
  });

  return innerClient.extend((client) =>
    smartWalletClientActions(client, signer)
  );
}

// Example usage:
// const clientWithoutAccount = createSmartWalletClient({
//   transport: alchemy({ apiKey: "123" }),
//   chain: baseSepolia,
//   signer: createDummySigner(zeroAddress),
// });

// const account1 = await clientWithoutAccount.requestAccount();

// const clientWithAccount = createSmartWalletClient({
//   transport: alchemy({ apiKey: "123" }),
//   chain: baseSepolia,
//   signer: createDummySigner(zeroAddress),
//   account: zeroAddress,
// });

// const account2 = await clientWithAccount.requestAccount();
