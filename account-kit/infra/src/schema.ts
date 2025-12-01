import { ChainSchema } from "@aa-sdk/core";
import type { Chain } from "viem";
import z from "zod";

export const AbstractChainSchema = z.custom<Chain>((chain) => {
  const chain_ = ChainSchema.parse(chain);

  return chain_.rpcUrls.alchemy != null;
}, "chain must include an abstract rpc url. See `defineAlchemyChain` or import a chain from `@account-kit/infra`.");
