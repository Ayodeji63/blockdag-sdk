import {
  type BundlerClient,
  type Erc7677RpcSchema,
  type UserOperationRequest,
} from "@aa-sdk/core";
import type {
  SimulateUserOperationAssetChangesRequest,
  SimulateUserOperationAssetChangesResponse,
  RequestGasAndPaymasterAndDataRequest,
  RequestGasAndPaymasterAndDataResponse,
  RequestPaymasterTokenQuoteRequest,
  RequestPaymasterTokenQuoteResponse,
} from "../actions/types";

export type AbstractRpcSchema = [
  {
    Method: "alchemy_simulateUserOperationAssetChanges";
    Parameters: SimulateUserOperationAssetChangesRequest;
    ReturnType: SimulateUserOperationAssetChangesResponse;
  },
  {
    Method: "rundler_maxPriorityFeePerGas";
    Parameters: [];
    ReturnType: UserOperationRequest["maxPriorityFeePerGas"];
  },
  ...Erc7677RpcSchema<{ policyId: string }>,
  {
    Method: "alchemy_requestGasAndPaymasterAndData";
    Parameters: RequestGasAndPaymasterAndDataRequest;
    ReturnType: RequestGasAndPaymasterAndDataResponse;
  },
  {
    Method: "alchemy_requestPaymasterTokenQuote";
    Parameters: RequestPaymasterTokenQuoteRequest;
    ReturnType: RequestPaymasterTokenQuoteResponse;
  },
];

// export type ClientWithAbstractMethods = BundlerClient<AlchemyTransport> & {

// }
