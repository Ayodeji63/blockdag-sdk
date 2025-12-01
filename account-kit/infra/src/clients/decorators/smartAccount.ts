import { isSmartAccountWithSigner, sendTransaction, sendTransactions, sendUserOperation, UserOperationContext, type GetEntryPointFromAccount, type SmartContractAccount } from "@aa-sdk/core";
import { Chain } from "viem";

export type AbstractSmartAccountClientActions<TAccount extends SmartContractAccount | undefined = | SmartContractAccount | undefined, 
TContext extends UserOperationContext | undefined = | UserOperationContext | undefined, TChain extends Chain | undefined = Chain | undefined, TEntryPointVersion extends GetEntryPointFromAccount<TAccount> = GetEntryPointFromAccount<TAccount>> = {
    
}
