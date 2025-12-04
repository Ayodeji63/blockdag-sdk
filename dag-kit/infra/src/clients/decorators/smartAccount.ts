import {
  clientHeaderTrack,
  isSmartAccountWithSigner,
  sendTransaction,
  sendTransactions,
  SendTransactionsParameters,
  sendUserOperation,
  SendUserOperationParameters,
  SendUserOperationResult,
  UserOperationContext,
  UserOperationOverrides,
  type GetEntryPointFromAccount,
  type SmartContractAccount,
} from "@aa-sdk/core";
import { Chain, Client, Hex, SendTransactionParameters, Transport } from "viem";
import { simulateUserOperationsChanges } from "../../actions/simulateUserOperationChanges";
import { SimulateUserOperationAssetChangesResponse } from "../../actions/types";
import { InfraLogger } from "../../metrics";

export type AbstractSmartAccountClientActions<
  TAccount extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  TContext extends UserOperationContext | undefined =
    | UserOperationContext
    | undefined,
  TChain extends Chain | undefined = Chain | undefined,
  TEntryPointVersion extends
    GetEntryPointFromAccount<TAccount> = GetEntryPointFromAccount<TAccount>,
> = {
  simulateUserOperation: (
    args: SendUserOperationParameters<TAccount, TContext>
  ) => Promise<SimulateUserOperationAssetChangesResponse>;
  sendUserOperation: (
    args: SendUserOperationParameters<
      TAccount,
      TContext,
      GetEntryPointFromAccount<TAccount>
    >
  ) => Promise<SendUserOperationResult<TEntryPointVersion>>;
  sendTransaction: <TChainOverride extends Chain | undefined = undefined>(
    args: SendTransactionParameters<TChain, TAccount, TChainOverride>,
    overrides?: UserOperationOverrides<TEntryPointVersion>,
    context?: TContext
  ) => Promise<Hex>;
  sendTransactions: (
    args: SendTransactionsParameters<TAccount, TContext>
  ) => Promise<Hex>;
};

export const abstractActions: <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
  TContext extends UserOperationContext | undefined =
    | UserOperationContext
    | undefined,
>(
  client: Client<TTransport, TChain, TAccount>
) => AbstractSmartAccountClientActions<TAccount, TContext, TChain> = (
  client_
) => ({
  simulateUserOperation: async (args) => {
    const client = clientHeaderTrack(client_, "simulateUserOperation");
    return simulateUserOperationsChanges(client, args);
  },
  async sendUserOperation(args) {
    const client = clientHeaderTrack(client_, "infraSendUserOperation");
    const { account = client.account } = args;

    const result = sendUserOperation(client, args);
    logSendUoEvent(client.chain!.id, account!);
    return result;
  },
  sendTransaction: async (args, overrides, context) => {
    const client = clientHeaderTrack(client_, "sendTransaction");
    const { account = client.account } = args;

    const result = await sendTransaction(client, args, overrides, context);
    logSendUoEvent(client.chain!.id, account as SmartContractAccount);
    return result;
  },
  async sendTransactions(args) {
    const client = clientHeaderTrack(client_, "sendTransactions");
    const { account = client.account } = args;

    const result = sendTransactions(client, args);
    logSendUoEvent(client.chain!.id, account!);
    return result;
  },
});

function logSendUoEvent(chainId: number, account: SmartContractAccount) {
  const signerType = isSmartAccountWithSigner(account)
    ? account.getSigner().signerType
    : "unknown";

  InfraLogger.trackEvent({
    name: "client_send_uo",
    data: {
      chainId,
      signerType: signerType,
      entryPoint: account.getEntryPoint().address,
    },
  });
}
