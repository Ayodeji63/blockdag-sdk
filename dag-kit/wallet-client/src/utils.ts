import { isHex, sliceHex, toHex, type Hex } from "viem";
import type { SmartAccountSigner } from "@aa-sdk/core";
import type { WebAuthnPublicKey } from "@alchemy/wallet-api-types";
import type { ToWebAuthnAccountParameters } from "viem/account-abstraction";
import type { WebauthnSigInner } from "@alchemy/wallet-api-types";
import type { WebAuthnSigner } from "./client";

export type Expect<T extends true> = T;

export const assertNever = (_val: never, msg: string): never => {
  throw new Error(msg);
};

export const castToHex = (val: string | number | bigint | Hex): Hex => {
  if (isHex(val)) {
    return val;
  }
  return toHex(val);
};

export function isWebAuthnSigner(
  signer: SmartAccountSigner | WebAuthnSigner
): signer is WebAuthnSigner {
  return "credential" in signer;
}

export function credentialToWebAuthnPublicKey(
  credential: ToWebAuthnAccountParameters["credential"]
): WebAuthnPublicKey {
  const { x, y } = {
    x: sliceHex(credential.publicKey, 0, 32, { strict: true }),
    y: sliceHex(credential.publicKey, 32, 64, { strict: true }),
  };

  return {
    x,
    y,
  };
}
