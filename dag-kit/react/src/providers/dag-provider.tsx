// Create a new file: providers/dag-client-provider.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./auth-provider";

interface DagClientContextType {
  dagClient: any | null;
  smartAccountAddress: string;
  balance: bigint;
  isDeployed: boolean;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
}

const DagClientContext = createContext<DagClientContextType>({
  dagClient: null,
  smartAccountAddress: "",
  balance: 0n,
  isDeployed: false,
  loading: true,
  error: null,
  refreshBalance: async () => {},
});

export const DagClientProvider = ({ children }: { children: ReactNode }) => {
  const { createSmartAccount } = useAuth();

  const [dagClient, setDagClient] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>("");
  const [balance, setBalance] = useState<bigint>(0n);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = async () => {
    if (dagClient) {
      try {
        const newBalance = await dagClient.getBalance();
        setBalance(newBalance);
      } catch (err) {
        console.error("Failed to refresh balance:", err);
      }
    }
  };

  useEffect(() => {
    const initializeClient = async () => {
      try {
        setLoading(true);
        setError(null);

        const session = localStorage.getItem("Session");
        if (!session) {
          throw new Error("No session found");
        }

        const sessionData = JSON.parse(session);
        if (!sessionData.subOrganizationId) {
          throw new Error("No subOrganizationId found");
        }

        console.log("Initializing DAG client...");
        const accountData = await createSmartAccount(
          sessionData.subOrganizationId
        );

        setDagClient(accountData.dagClient);
        setSmartAccountAddress(accountData.smartAccountAddress);
        setBalance(accountData.balance);
        setIsDeployed(accountData.isDeployed);

        console.log("✅ DAG client initialized successfully");
      } catch (err: any) {
        console.error("Failed to initialize DAG client:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeClient();
  }, [createSmartAccount]);

  return (
    <DagClientContext.Provider
      value={{
        dagClient,
        smartAccountAddress,
        balance,
        isDeployed,
        loading,
        error,
        refreshBalance,
      }}
    >
      {children}
    </DagClientContext.Provider>
  );
};

export const useDagClient = () => {
  const context = useContext(DagClientContext);
  if (!context) {
    throw new Error("useDagClient must be used within DagClientProvider");
  }
  return context;
};
