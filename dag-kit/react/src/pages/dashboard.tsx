import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { counterAbi, counterAddress } from "@/contracts/counter";

function Dashboard() {
  const { handleLogout, createSmartAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [txHash, setTxHash] = useState<string>("");

  // Store the client instance
  const [dagClient, setDagClient] = useState<any>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>("");
  const [balance, setBalance] = useState<bigint>(0n);

  // Initialize smart account ONCE on component mount
  useEffect(() => {
    const initializeAccount = async () => {
      try {
        setInitializing(true);

        const session = localStorage.getItem("Session");
        if (!session) {
          throw new Error("No session found. Please login again.");
        }

        const sessionData = JSON.parse(session);

        if (!sessionData.subOrganizationId) {
          throw new Error("No subOrganizationId found in session");
        }

        console.log("Initializing smart account...");
        const accountData = await createSmartAccount(
          sessionData.subOrganizationId
        );

        // Store the client and account info
        setDagClient(accountData.dagClient);
        setSmartAccountAddress(accountData.smartAccountAddress);
        setBalance(accountData.balance);

        console.log(
          "Smart account initialized:",
          accountData.smartAccountAddress
        );

        if (accountData.balance === 0n) {
          console.warn(
            `⚠️ Warning: Account has 0 balance. Fund it at: ${accountData.smartAccountAddress}`
          );
        }
      } catch (error: any) {
        console.error("Failed to initialize smart account:", error);
        alert(`Initialization error: ${error.message}`);
      } finally {
        setInitializing(false);
      }
    };

    initializeAccount();
  }, []); // Run only once on mount

  const handleTx = async () => {
    if (!dagClient) {
      alert("Smart account not initialized. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending transaction...");

      const hash = await dagClient.writeContract({
        address: counterAddress,
        abi: counterAbi,
        functionName: "increment",
        args: [],
      });

      console.log("Transaction Hash:", hash);
      setTxHash(hash);

      alert(`Transaction successful! Hash: ${hash}`);
      console.log(`Explorer: https://awakening.bdagscan.com/tx/${hash}`);

      // Optionally refresh balance after transaction
      const newBalance = await dagClient.getBalance();
      setBalance(newBalance);
    } catch (error: any) {
      console.error("Transaction error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing smart account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Account Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold mb-2">Account Info</h2>
        <p className="text-sm text-gray-600 break-all mb-1">
          <span className="font-medium">Address:</span> {smartAccountAddress}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Balance:</span> {balance.toString()} wei
        </p>
        {balance === 0n && (
          <p className="text-sm text-red-600 mt-2">
            ⚠️ Please fund your account to send transactions
          </p>
        )}
      </div>

      <div className="space-y-4">
        <Button onClick={handleTx} disabled={loading} className="w-full">
          {loading ? "Processing..." : "Increment Counter"}
        </Button>

        {txHash && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold">Transaction Successful!</p>
            <a
              href={`https://awakening.bdagscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm break-all"
            >
              {txHash}
            </a>
          </div>
        )}

        <Button onClick={handleLogout} variant="outline" className="w-full">
          Logout
        </Button>
      </div>
    </div>
  );
}

export default Dashboard;
