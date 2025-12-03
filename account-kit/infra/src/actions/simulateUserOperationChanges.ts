import {
  AccountNotFoundError,
  IncompatibleClientError,
  SendUserOperationParameters,
  SmartContractAccount,
  deepHexlify,
} from "@aa-sdk/core";
import type { Chain, Client, Transport } from "viem";
import { AbstractRpcSchema } from "../clients/types";
import { SimulateUserOperationAssetChangesResponse } from "./types";
import { isAbstractSmartAccountClient } from "../clients/isAbstractSmartAccountClient";

/**
 * The simulateUserOperationChanges function allows developers to preview the effects of a user operation (transaction) without actually sending it to the blockchain. Think of it as a "dry run" that shows what assets will change.
 */
export const simulateUserOperationsChanges: <
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
>(
  client: Client<Transport, TChain, TAccount, AbstractRpcSchema>,
  args: SendUserOperationParameters<TAccount>
) => Promise<SimulateUserOperationAssetChangesResponse> = async (
  client,
  { account = client.account, overrides, ...params }
) => {
  if (!account) {
    throw new AccountNotFoundError();
  }

  if (!isAbstractSmartAccountClient(client)) {
    throw new IncompatibleClientError(
      "AbstractSmartAccountClient",
      "SimulateUserOperationChanges",
      client
    );
  }

  const uoStruct = deepHexlify(
    await client.buildUserOperation({
      ...params,
      account,
      overrides,
    })
  );

  return client.request({
    method: "alchemy_simulateUserOperationAssetChanges",
    params: [uoStruct, account.getEntryPoint().address],
  });
};
