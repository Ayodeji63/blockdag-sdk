import {
  InvalidSignerTypeError,
  type SmartContractAccount,
} from "@aa-sdk/core";
import {
  createModularAccountV2,
  createLightAccount,
  createMultiOwnerLightAccount,
  createMultiOwnerModularAccount,
} from "@account-kit/smart-contracts";
import {
  concatHex,
  type Chain,
  type Transport,
  type Address,
  isAddressEqual,
} from "viem";
import { SerializedInitcode } from "@alchemy/wallet-api-types";
import { InternalError, InvalidRequestError } from "ox/RpcResponse";
import { assertNever, isWebAuthnSigner } from "../utils";
import {  } from "../metr";