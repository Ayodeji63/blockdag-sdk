import { type SmartContractAccount } from "@aa-sdk/core";
import type { Chain, Client, Transport } from "viem";
import type { AbstractSmartAccountClient } from "./SmartAccountClient";

export function isAbstractSmartAccountClient<
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartContractAccount | undefined =
    | SmartContractAccount
    | undefined,
>(
  client: Client<Transport, TChain, TAccount, any>
): client is AbstractSmartAccountClient<TChain, TAccount> {
  return client.transport.type === "abstract";
}
