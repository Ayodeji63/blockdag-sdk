import {
  ChainNotFoundError,
  ConnectionConfigSchema,
  split,
  type ConnectionConfig,
  type NoUndefined,
} from "@aa-sdk/core";
import {
  createTransport,
  http,
  type Chain,
  type EIP1193RequestFn,
  type HttpTransportConfig,
  type PublicRpcSchema,
  type Transport,
  type TransportConfig,
} from "viem";
import { AbstractRpcSchema } from "./clients/types";
import { AbstractChainSchema } from "./schema";

type Never<T> = T extends object
  ? {
      [K in keyof T]?: never;
    }
  : never;

type AbstractConnectionConfig = ConnectionConfig;

type SplitTransportConfig = {
  abstractConnection: AbstractConnectionConfig;
  nodeRpcUrl: string;
};

const abstractMethods = [
  "eth_sendUserOperation",
  "eth_estimateUserOperationGas",
  "eth_getUserOperationReceipt",
  "eth_getUserOperationByHash",
  "eth_supportedEntryPoints",
  "rundler_maxPriorityFeePerGas",
  "pm_getPaymasterData",
  "pm_getPaymasterStubData",
  "alchemy_requestGasAndPaymasterAndData",
];

const chainAgnosticMethods = [
  "wallet_prepareCalls",
  "wallet_sendPreparedCalls",
  "wallet_requestAccount",
  "wallet_createAccount",
  "wallet_listAccounts",
  "wallet_createSession",
  "wallet_getCallsStatus",
  "wallet_requestQuote_v0",
];

export type AbstractTransportConfig = (
  | (AbstractConnectionConfig & Never<SplitTransportConfig>)
  | (SplitTransportConfig & Never<AbstractConnectionConfig>)
) & {
  retryCount?: TransportConfig["retryCount"] | undefined;
  retryDelay?: TransportConfig["retryDelay"] | undefined;
  fetchOptions?: NoUndefined<HttpTransportConfig["fetchOptions"]> | undefined;
};

type AbstractTransportBase = Transport<
  "abstract",
  {
    abstractRpcUrl: string;
    fetchOptions?: AbstractTransportConfig["fetchOptions"];
  },
  EIP1193RequestFn<[...PublicRpcSchema, ...AbstractRpcSchema]>
>;

export type AbstractTransport = AbstractTransportBase & {
  updateHeaders(newHeaders: HeadersInit): void;
  config: AbstractTransportConfig;
  dynamicFetchOptions: AbstractTransportConfig["fetchOptions"];
};

export function isAbstractTransport(
  transport: Transport,
  chain: Chain
): transport is AbstractTransport {
  return transport({ chain }).config.type === "abstract";
}

/**
 * Creates an Abstract Transport with the specified configuration optionss.
 * When sending all traffic to Abstract, you must pass in one of rpcUrl, apiKey, or jwt.
 * If you want to send Bundler and Paymaster traffic to Abstract and Node traffice to a different RPC, you must pass in alchemyConnection and nodeRpcUrl.
 */

export function abstract(config: AbstractTransportConfig): AbstractTransport {
  const { retryDelay, retryCount = 0 } = config;

  // we create a copy here in case we create a split transport down below
  // we don't want to add abstrct headers to 3rd party nodes
  const fetchOptions = { ...config.fetchOptions };

  const connectionConfig = ConnectionConfigSchema.parse(
    config.abstractConnection ?? config
  );

  const headersAsObject = convertHeadersToObject(fetchOptions?.headers);

  fetchOptions.headers = {
    ...headersAsObject,
    "BlockDag-AA-sdk-Version": "1.0.0",
  };

  if (connectionConfig.jwt != null || connectionConfig.apiKey != null) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${
        connectionConfig.jwt ?? connectionConfig.apiKey
      }`,
    };
  }

  const transport: AbstractTransportBase = (opts) => {
    const { chain: chain_ } = opts;
    if (!chain_) {
      throw new ChainNotFoundError();
    }

    const chain = AbstractChainSchema.parse(chain_);

    const rpcUrl =
      connectionConfig.rpcUrl == null
        ? chain.rpcUrls.alchemy!.http[0]
        : connectionConfig.rpcUrl;

    const chainAgnosticRpcUrl =
      connectionConfig.rpcUrl == null
        ? "https://api.g.alchemy.com/v2"
        : (connectionConfig.chainAgnosticUrl ?? connectionConfig.rpcUrl);

    const innterTransport = (() => {
      // mutateRem
      if (config.abstractConnection && config.nodeRpcUrl) {
        /**
         * Split mode: If both `alchemyConnection` and `nodeRpcUrl` are provided,
         * 1. Route alchemyMethods -> Alchemy bundler RPC
         * 2. Route chainAgnosticMethods -> Alchemy chain-agnostic RPC
         * 3. Fallback all other methods to Custom Node RPC
         */
        return split({
          overrides: [
            {
              methods: abstractMethods,
              transport: http(rpcUrl, { fetchOptions, retryCount }),
            },
            {
              methods: chainAgnosticMethods,
              transport: http(chainAgnosticRpcUrl, {
                fetchOptions,
                retryCount,
                retryDelay,
              }),
            },
          ],
          fallback: http(config.nodeRpcUrl, {
            fetchOptions: config.fetchOptions,
            retryCount,
            retryDelay,
          }),
        });
      }

      return split({
        overrides: [
          {
            methods: chainAgnosticMethods,
            transport: http(chainAgnosticRpcUrl, {
              fetchOptions,
              retryCount,
              retryDelay,
            }),
          },
        ],
        fallback: http(rpcUrl, { fetchOptions, retryCount, retryDelay }),
      });
    })();

    return createTransport(
      {
        key: "abstract",
        name: "Abstract Transport",
        request: innterTransport({
          ...opts,
          retryCount: 0,
        }).request,
        retryCount: 0,
        retryDelay,
        type: "abstract",
      },
      {
        abstractRpcUrl: rpcUrl,
        fetchOptions,
      }
    );
  };

  return Object.assign(transport, {
    dynamicFetchOptions: fetchOptions,
    updateHeaders(newHeaders_: HeadersInit) {
      const newHeaders = convertHeadersToObject(newHeaders_);

      fetchOptions.headers = {
        ...fetchOptions.headers,
        ...newHeaders,
      };
    },
    config,
  });
}

export const convertHeadersToObject = (
  headers?: HeadersInit
): Record<string, string> => {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    const headersObject = {} as Record<string, string>;
    headers.forEach((value, key) => {
      headersObject[key] = value;
    });
    return headersObject;
  }

  if (Array.isArray(headers)) {
    return headers.reduce(
      (acc, header) => {
        acc[header[0]] = header[1];
        return acc;
      },
      {} as Record<string, string>
    );
  }

  return headers;
};
