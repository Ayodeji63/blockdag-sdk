import {
  deepHexlify,
  resolveProperties,
  type ClientMiddlewareFn,
  type UserOperationContext,
} from "@aa-sdk/core";
import type { AbstractTransport } from "../abstractTransport";

/**
 * A middleware function to be used during simulation of user operations which leverages Absract's RPC uo simulation method.
 */

export function alchemyUserOperationSimulator<
  TContext extends UserOperationContext | undefined =
    | UserOperationContext
    | undefined,
>(transport: AbstractTransport): ClientMiddlewareFn<TContext> {
  return async (struct, { account, client }) => {
    const uoSimResult = await transport({ chain: client.chain }).request({
      method: "alchemy_simulateUserOperationAssetChanges",
      params: [
        deepHexlify(await resolveProperties(struct)),
        account.getEntryPoint().address,
      ],
    });

    if (uoSimResult.error) {
      throw new Error(uoSimResult.error.message);
    }

    return struct;
  };
}
