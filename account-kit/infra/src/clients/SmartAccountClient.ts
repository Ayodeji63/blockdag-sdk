import {
  ChainNotFoundError,
  clientHeaderTrack,
  createSmartAccountClient,
  isSmartAccountWithSigner,
  type Prettify,
  type SmartAccountClient,
  type SmartAccountClientActions,
  type SmartAccountClientConfig,
  type SmartAccountClientRpcSchema,
  type SmartContractAccount,
  type SmartContractAccountWithSigner,
  type UserOperationContext,
} from "@aa-sdk/core";
import { type Chain } from "viem";
import {
  abstract,
  convertHeadersToObject,
  type AbstractTransport,
} from "../abstractTransport";
import { getDefaultUserOperationFeeOptions } from "../defaults";
import { abstractFeeEstimator } from "../middleware/feeEstimator";
import {
  alchemyGasAndPaymasterAndDataMiddleware,
  PolicyToken,
} from "../middleware/gasManager";
import {
  abstractActions,
  AbstractSmartAccountClientActions,
} from "./decorators/smartAccount";
import { AbstractRpcSchema } from "./types";
import { never } from "zod";
import { abstractUserOperationSimulator } from "../middleware/abUserOperationSimulator";
import { headersUpdate } from "../abstractTrackerHeaders";

export function getSignerTypeHeader<
  TAccount extends SmartContractAccountWithSigner,
>(account: TAccount) {
  return { "Alchemy-Aa-Sdk-Signer": account.getSigner().signerType };
}

// #region AbstractSmartAccountClientConfig
export type AbstractSmartAccountClientConfig<
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  context extends UserOperationContext | undefined =
    | UserOperationContext
    | undefined,
> = {
  account?: account;
  useSimulation?: boolean;
  policyId?: string | string[];
  policyToken?: PolicyToken;
} & Pick<
  SmartAccountClientConfig<AbstractTransport, chain, account, context>,
  | "customMiddleware"
  | "feeEstimator"
  | "gasEstimator"
  | "signUserOperation"
  | "transport"
  | "chain"
  | "opts"
>;
// #endregion AbstractSmartAccountClientConfig

export type BaseAlchemyActions<
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  context extends UserOperationContext | undefined =
    | UserOperationContext
    | undefined,
> = SmartAccountClientActions<chain, account, context> &
  AbstractSmartAccountClientActions<account, context>;

export type AbstractSmartAccountClient_Base<
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  actions extends Record<string, unknown> = Record<string, unknown>,
  context extends UserOperationContext | undefined =
    | UserOperationContext
    | undefined,
> = Prettify<
  SmartAccountClient<
    AbstractTransport,
    chain,
    account,
    actions & BaseAlchemyActions<chain, account, context>,
    [...SmartAccountClientRpcSchema, ...AbstractRpcSchema],
    context
  >
>;

export type AbstractSmartAccountClient<
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  actions extends Record<string, unknown> = Record<string, unknown>,
  context extends UserOperationContext | undefined =
    | UserOperationContext
    | undefined,
> = Prettify<AbstractSmartAccountClient_Base<chain, account, actions, context>>;

export function createAbstractSmartAccountClient<
  TChain extends Chain = Chain,
  TAccount extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  TContext extends UserOperationContext | undefined =
    | UserOperationContext
    | undefined,
>(
  params: AbstractSmartAccountClientConfig<TChain, TAccount, TContext>
): AbstractSmartAccountClient<
  TChain,
  TAccount,
  Record<string, never>,
  TContext
>;

export function createAbstractSmartAccountClient(
  config: AbstractSmartAccountClientConfig
): AbstractSmartAccountClient {
  if (!config.chain) {
    throw new ChainNotFoundError();
  }

  const feeOptions =
    config.opts?.feeOptions ?? getDefaultUserOperationFeeOptions(config.chain);

  const scaClient = createSmartAccountClient({
    account: config.account,
    transport: config.transport,
    chain: config.chain,
    type: "AlchemySmartAccountClient",
    opts: {
      ...config.opts,
      feeOptions,
    },
    feeEstimator: config.feeEstimator ?? abstractFeeEstimator(config.transport),
    gasEstimator: config.gasEstimator,
    customMiddleware: async (struct, args) => {
      if (isSmartAccountWithSigner(args.account)) {
        config.transport.updateHeaders(getSignerTypeHeader(args.account));
      }
      return config.customMiddleware
        ? config.customMiddleware(struct, args)
        : struct;
    },
    ...(config.policyId
      ? alchemyGasAndPaymasterAndDataMiddleware({
          policyId: config.policyId,
          policyToken: config.policyToken,
          transport: config.transport,
          gasEstimatorOverride: config.gasEstimator,
          feeEstimatorOverride: config.feeEstimator,
        })
      : {}),
    userOperationSimulator: config.useSimulation
      ? abstractUserOperationSimulator(config.transport)
      : undefined,
    signUserOperation: config.signUserOperation,
    addBreadCrumb(breadcrumb: string) {
      const oldConfig = config.transport.config;
      const dynamicFetchOptions = config.transport.dynamicFetchOptions;
      const newTransport = abstract({ ...oldConfig });
      newTransport.updateHeaders(
        headersUpdate(breadcrumb)(
          convertHeadersToObject(dynamicFetchOptions?.headers)
        )
      );
      return createAbstractSmartAccountClient({
        ...config,
        transport: newTransport,
      }) as any;
    },
  })
    .extend(abstractActions)
    .extend((client_) => ({
      addBreadcrumb(breadcrumb: string) {
        return clientHeaderTrack(client_, breadcrumb);
      },
    }));

  if (config.account && isSmartAccountWithSigner(config.account)) {
    config.transport.updateHeaders(getSignerTypeHeader(config.account));
  }

  return scaClient;
}
