import { BaseError as CoreBaseError } from "@aa-sdk/core";

export abstract class BaseError extends CoreBaseError {
  // This version could be different from the aa-core version so we overwrite this here.
  override version = "0.0.1";
}
