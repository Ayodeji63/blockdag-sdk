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
import { abstract, convertHeadersToObject type AbstractTransport } from "../abstractTransport";
import { getDefaultUserOperationFeeOptions } from "../defaults";
import { abstractFeeEstimator } from "../midddlware/feeEstimator";
import { PolicyToken } from "../midddlware/gasManager";
import { AbstractSmartAccountClientActions } from "./decorators/smartAccount";
import { AbstractRpcSchema } from "./types";


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

