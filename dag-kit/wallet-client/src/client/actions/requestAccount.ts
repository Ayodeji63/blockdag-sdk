import { BaseError, type SmartContractAccount } from "@aa-sdk/core";
import type { Address } from "abitype";
import deepEqual from "deep-equal"
import { custom } from "viem";
import type { WalletServerRpcSchemaType } from "@alchemy/wallet-api-types/rpc";
import type { InnerWalletApiClient } from "../../types";
import type {createAccount}