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
import