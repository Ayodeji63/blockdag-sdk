import { createBundlerClient } from "@aa-sdk/core";
import type { Chain } from "viem";
import { AbstractTransport } from "../abstractTransport";
import { ClientWithAlchemyMethods } from "./types";

export const createAbstractPublicRpcClient = ({
  transport,
  chain,
}: {
  transport: AbstractTransport;
  chain: Chain | undefined;
}): ClientWithAlchemyMethods => {
  return createBundlerClient({
    chain,
    transport,
  });
};
