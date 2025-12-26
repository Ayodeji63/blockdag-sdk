import React from "react";
import { useWallet, useDagKit } from "@dag-kit/react-rn";
import { createDagAAClient, parseDAG } from "@dag-kit/kit";

export function SendTransaction() {
  const { address, isConnected } = useWallet();
  const { config } = useDagKit();
  const [recipient, setRecipient] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [txHash, setTxHash] = React.useState("");

  const handleSend = async () => {
    if (!isConnected || !address) {
      alert("Please connect wallet first");
      return;
    }

    setLoading(true);
    try {
      // Create DAG AA client
      const dagClient = createDagAAClient({
        chain: config.chain!,
        rpcUrl: config.rpcUrl!,
        bundlerUrl: "https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY",
        paymasterUrl:
          "https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_API_KEY",
        factoryAddress: "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985",
      });

      // Note: You need to pass the signer here
      // This would require modifying the hook to return a signer
      // For now, this is a conceptual example

      // Send transaction
      const hash = await dagClient.sendUserOperation({
        target: recipient as `0x${string}`,
        value: parseDAG(amount),
        data: "0x",
      });

      setTxHash(hash);
      alert(`Transaction sent! Hash: ${hash}`);
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-transaction">
      <h3>Send Transaction</h3>
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="text"
        placeholder="Amount (ETH)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend} disabled={loading || !isConnected}>
        {loading ? "Sending..." : "Send"}
      </button>
      {txHash && (
        <p className="tx-hash">
          Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </p>
      )}
    </div>
  );
}
