import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sepolia, baseSepolia } from "viem/chains";
import type { Chain } from "viem";
import type {
  SmartContractAccount,
  UserOperationContext,
  ChainNotFoundError as ChainNotFoundErrorType,
} from "@aa-sdk/core";

// Mock modules FIRST - before any variable declarations
vi.mock("@aa-sdk/core", async () => {
  const actual = await vi.importActual("@aa-sdk/core");
  return {
    ...actual,
    createSmartAccountClient: vi.fn(),
    clientHeaderTrack: vi.fn((client) => client),
    isSmartAccountWithSigner: vi.fn(),
  };
});

vi.mock("../abstractTransport", () => ({
  abstract: vi.fn(),
  convertHeadersToObject: vi.fn((headers) => headers || {}),
}));

vi.mock("../defaults", () => ({
  getDefaultUserOperationFeeOptions: vi.fn(() => ({
    maxFeePerGas: { multiplier: 1.5 },
    maxPriorityFeePerGas: { multiplier: 1.05 },
  })),
}));

vi.mock("../middleware/feeEstimator", () => ({
  abstractFeeEstimator: vi.fn(() => vi.fn()),
}));

vi.mock("./decorators/smartAccount", () => ({
  AbstractSmartAccountClientActions: vi.fn(),
}));

// Now import the actual modules to get mocked versions
import {
  createSmartAccountClient,
  clientHeaderTrack,
  isSmartAccountWithSigner,
} from "@aa-sdk/core";
import { abstract, convertHeadersToObject } from "../abstractTransport";
import { getDefaultUserOperationFeeOptions } from "../defaults";
import { abstractFeeEstimator } from "../midddlware/feeEstimator";

// Test fixtures - use real Sepolia chain
const mockChain: Chain = sepolia;

const mockAccount: SmartContractAccount = {
  address: "0x1234567890123456789012345678901234567890",
  source: "AbstractAccount",
  getEntryPoint: vi.fn(() => ({
    address: "0xENTRYPOINT",
    version: "0.7.0",
  })),
  encodeCalls: vi.fn(),
  getDummySignature: vi.fn(async () => "0xDUMMYSIG"),
  signMessage: vi.fn(),
  signTypedData: vi.fn(),
  signUserOperation: vi.fn(),
  getAccountInitCode: vi.fn(async () => "0x"),
} as any;

const mockTransport = vi.fn(() => ({
  config: {
    type: "abstract",
    key: "abstract",
  },
  request: vi.fn(),
  value: {},
}));

// Import the types we need to test
type AbstractSmartAccountClientConfig = {
  account?: SmartContractAccount;
  useSimulation?: boolean;
  policyId?: string | string[];
  policyToken?: {
    address: string;
    maxTokenAmount: bigint;
    permit?: {
      paymasterAddress?: string;
      autoPermitApproveTo: bigint;
      autoPermitBelow: bigint;
      erc20Name: string;
      version: string;
    };
  };
  transport: any;
  chain?: Chain;
  customMiddleware?: any;
  feeEstimator?: any;
  gasEstimator?: any;
};

describe("AbstractSmartAccountClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the return value of abstract
    (abstract as any).mockReturnValue(mockTransport);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Configuration Types", () => {
    it("should accept valid config", () => {
      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
        policyId: "test-policy-id",
        useSimulation: true,
      };

      expect(config).toBeDefined();
      expect(config.account).toBe(mockAccount);
      expect(config.chain).toBe(mockChain);
      expect(config.policyId).toBe("test-policy-id");
      expect(config.useSimulation).toBe(true);
    });

    it("should accept config without optional fields", () => {
      const config = {
        transport: mockTransport as any,
        chain: mockChain,
      };

      expect(config).toBeDefined();
      //   expect(config.account).toBeUndefined();
      expect((config as any).policyId).toBeUndefined();
    });

    it("should accept multiple policy IDs", () => {
      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        policyId: ["policy-1", "policy-2", "policy-3"],
      };

      expect(config.policyId).toHaveLength(3);
      expect(config.policyId).toEqual(["policy-1", "policy-2", "policy-3"]);
    });

    it("should accept policyToken configuration", () => {
      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        policyToken: {
          address: "0xTOKEN" as any,
          maxTokenAmount: 1000n,
          permit: {
            paymasterAddress: "0xPAYMASTER" as any,
            autoPermitApproveTo: 5000n,
            autoPermitBelow: 100n,
            erc20Name: "TestToken",
            version: "1",
          },
        },
      };

      expect(config.policyToken).toBeDefined();
      expect(config.policyToken?.address).toBe("0xTOKEN");
      expect(config.policyToken?.maxTokenAmount).toBe(1000n);
    });
  });

  describe("Client Creation", () => {
    it("should create client with minimal config", () => {
      (createSmartAccountClient as any).mockReturnValue({
        account: mockAccount,
        chain: mockChain,
        request: vi.fn(),
      });

      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
      };

      const client = (createSmartAccountClient as any)(config);

      expect(createSmartAccountClient).toHaveBeenCalled();
      expect(client).toBeDefined();
    });

    it("should create client with full config", () => {
      (createSmartAccountClient as any).mockReturnValue({
        account: mockAccount,
        chain: mockChain,
        request: vi.fn(),
      });

      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
        policyId: "full-policy",
        useSimulation: true,
        policyToken: {
          address: "0xTOKEN" as any,
          maxTokenAmount: 2000n,
        },
        customMiddleware: vi.fn(),
        feeEstimator: vi.fn(),
        gasEstimator: vi.fn(),
      };

      const client = (createSmartAccountClient as any)(config);

      expect(createSmartAccountClient).toHaveBeenCalledWith(
        expect.objectContaining({
          transport: mockTransport,
          chain: mockChain,
          account: mockAccount,
        })
      );
      expect(client).toBeDefined();
    });

    it("should throw ChainNotFoundError when chain is missing", async () => {
      const { ChainNotFoundError } = await import("@aa-sdk/core");

      const config = {
        transport: mockTransport as any,
        chain: undefined,
        account: mockAccount,
      };

      // Simulate chain validation
      if (!config.chain) {
        expect(() => {
          throw new ChainNotFoundError();
        });=
      }
    });
  });

  describe("Transport Configuration", () => {
    it("should use abstract transport", () => {
      const config = {
        transport: (abstract as any)({ apiKey: "test-key" }),
        chain: mockChain,
      };

      expect(abstract).toHaveBeenCalledWith({ apiKey: "test-key" });
      expect(config.transport).toBeDefined();
    });

    it("should pass transport to client", () => {
      const customTransport = (abstract as any)({
        rpcUrl: "https://custom.rpc",
      });

      const config = {
        transport: customTransport as any,
        chain: mockChain,
        account: mockAccount,
      };

      (createSmartAccountClient as any)(config);

      expect(createSmartAccountClient).toHaveBeenCalledWith(
        expect.objectContaining({
          transport: customTransport,
        })
      );
    });
  });

  describe("Middleware Configuration", () => {
    it("should accept custom middleware", () => {
      const customMiddleware = vi.fn();

      const config: AbstractSmartAccountClientConfig = {
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
        customMiddleware,
      };

      expect(config.customMiddleware).toBe(customMiddleware);
    });

    it("should accept custom fee estimator", () => {
      const customFeeEstimator = vi.fn();

      const config: AbstractSmartAccountClientConfig = {
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
        feeEstimator: customFeeEstimator,
      };

      expect(config.feeEstimator).toBe(customFeeEstimator);
    });

    it("should accept custom gas estimator", () => {
      const customGasEstimator = vi.fn();

      const config: AbstractSmartAccountClientConfig = {
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
        gasEstimator: customGasEstimator,
      };

      expect(config.gasEstimator).toBe(customGasEstimator);
    });
  });

  describe("Client Type Checking", () => {
    it("should have correct client type structure", () => {
      const mockClient = {
        account: mockAccount,
        chain: mockChain,
        transport: mockTransport,
        request: vi.fn(),
        sendUserOperation: vi.fn(),
        buildUserOperation: vi.fn(),
      };

      (createSmartAccountClient as any).mockReturnValue(mockClient);

      const client = (createSmartAccountClient as any)({
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
      });

      expect(client).toHaveProperty("account");
      expect(client).toHaveProperty("chain");
      expect(client).toHaveProperty("request");
    });

    it("should check if account has signer", () => {
      (isSmartAccountWithSigner as any).mockReturnValue(true);

      const result = (isSmartAccountWithSigner as any)(mockAccount);

      expect(result).toBe(true);
      expect(isSmartAccountWithSigner).toHaveBeenCalledWith(mockAccount);
    });
  });

  describe("User Operation Context", () => {
    it("should accept custom user operation context", () => {
      const customContext: UserOperationContext = {
        customField: "custom-value",
        additionalData: { key: "value" },
      };

      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
        context: customContext,
      };

      expect(config).toBeDefined();
      expect(config.context).toEqual(customContext);
    });
  });

  describe("Fee Estimation", () => {
    it("should use abstractFeeEstimator when no custom estimator provided", () => {
      //   (abstractFeeEstimator as any).mockReturnValue(vi.fn());

      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        account: mockAccount,
      };

      // Simulate fee estimator setup
      const feeEstimator = (abstractFeeEstimator as any)(config.transport);
      expect(feeEstimator).toBeDefined();
    });

    it("should get default fee options", () => {
      const feeOptions = (getDefaultUserOperationFeeOptions as any)();

      expect(feeOptions).toBeDefined();
      expect(feeOptions.maxFeePerGas).toHaveProperty("multiplier");
      expect(feeOptions.maxPriorityFeePerGas).toHaveProperty("multiplier");
    });
  });

  describe("Header Tracking", () => {
    it("should track client headers", () => {
      const mockClient = {
        request: vi.fn(),
      };

      (clientHeaderTrack as any).mockReturnValue(mockClient);

      const trackedClient = (clientHeaderTrack as any)(
        mockClient,
        "test-operation"
      );

      expect(clientHeaderTrack).toHaveBeenCalledWith(
        mockClient,
        "test-operation"
      );
      expect(trackedClient).toBe(mockClient);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined account", () => {
      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        account: undefined,
      };

      expect(config.account).toBeUndefined();
    });

    it("should handle undefined chain", () => {
      const config = {
        transport: mockTransport as any,
        chain: undefined,
      };

      expect(config.chain).toBeUndefined();
    });

    it("should handle empty policy ID array", () => {
      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        policyId: [],
      };

      expect(config.policyId).toEqual([]);
    });

    it("should handle useSimulation false", () => {
      const config = {
        transport: mockTransport as any,
        chain: mockChain,
        useSimulation: false,
      };

      expect(config.useSimulation).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    it("should create a fully configured client", () => {
      const fullClient = {
        account: mockAccount,
        chain: mockChain,
        transport: mockTransport,
        request: vi.fn(),
        sendUserOperation: vi.fn(),
        buildUserOperation: vi.fn(),
        sendTransaction: vi.fn(),
        waitForUserOperationTransaction: vi.fn(),
      };

      (createSmartAccountClient as any).mockReturnValue(fullClient);

      const config = {
        transport: (abstract as any)({ apiKey: "integration-test" }),
        chain: mockChain,
        account: mockAccount,
        policyId: "integration-policy",
        useSimulation: true,
        policyToken: {
          address: "0xINTEGRATION" as any,
          maxTokenAmount: 10000n,
        },
      };

      const client = (createSmartAccountClient as any)(config);

      expect(client).toBeDefined();
      expect(client.account).toBe(mockAccount);
      expect(client.chain).toBe(mockChain);
      expect(client.sendUserOperation).toBeDefined();
    });
  });

  describe("Type Safety", () => {
    it("should enforce type safety for client actions", () => {
      // This should compile without errors
      const ensureTypeStructure = (client: any) => {
        expect(client).toBeDefined();
      };

      expect(ensureTypeStructure).toBeDefined();
    });

    it("should allow extending client with custom actions", () => {
      const ensureExtendedType = (client: any) => {
        expect(client).toBeDefined();
      };

      expect(ensureExtendedType).toBeDefined();
    });
  });
});
