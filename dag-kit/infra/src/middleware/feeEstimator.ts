import type { ClientMiddlewareFn } from "@aa-sdk/core";
import {
  applyUserOpOverrideOrFeeOption,
  bigIntMultiply,
  clientHeaderTrack,
} from "@aa-sdk/core";
import { AbstractTransport } from "../abstractTransport";

export const abstractFeeEstimator: (
  transport: AbstractTransport
) => ClientMiddlewareFn =
  (transport) =>
  async (struct, { overrides, feeOptions, client: client_ }) => {
    const client = clientHeaderTrack(client_, "AbstractFeeEstimator");
    const transport_ = transport({ chain: client.chain });

    let [block, maxPriorityFeePerGasEstimate] = await Promise.all([
      client.getBlock({ blockTag: "latest" }),

      transport_.request({
        method: "rundler_maxPriorityFeePerGas",
        params: [],
      }),
    ]);

    const baseFeePerGas = block.baseFeePerGas;
    if (baseFeePerGas == null) {
      throw new Error("baseFeePerGas is null");
    }

    const maxPriorityFeePerGas = applyUserOpOverrideOrFeeOption(
      maxPriorityFeePerGasEstimate,
      overrides?.maxPriorityFeePerGas,
      feeOptions?.maxPriorityFeePerGas
    );
    const maxFeePerGas = applyUserOpOverrideOrFeeOption(
      bigIntMultiply(baseFeePerGas, 1.5) + BigInt(maxPriorityFeePerGas),
      overrides?.maxFeePerGas,
      feeOptions?.maxFeePerGas
    );

    return {
      ...struct,
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  };
