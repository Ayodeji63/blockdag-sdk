import { ToWebAuthnAccountParameters } from "viem/account-abstraction";

export type WebAuthnSigner = {
  credential: ToWebAuthnAccountParameters["credential"];
  getFn?: ToWebAuthnAccountParameters["getFn"] | undefined;
  rpId?: ToWebAuthnAccountParameters["rpId"] | undefined;
};
