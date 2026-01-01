import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NFT } from "@/data/nfts";
import { Sparkles, Heart, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";
import { nftAbi, nftAddress } from "@/contracts/counter";
import { transactionType, useAuth } from "@/providers/auth-provider";
import { encodeFunctionData } from "viem";
import { parseDAG } from "@dag-kit/kit";

interface NFTCardProps {
  nft: NFT;
  onMint?: (nft: NFT) => void;
}

const NFTCard = ({ nft, onMint }: NFTCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const { dagClient, address, batchTransaction, setBatchTransaction } =
    useAuth();

  const handleMintNow = async () => {
    if (!dagClient) {
      toast.error("Smart account not initialized. Please refresh the page.");
      return;
    }

    if (!address || !nftAddress || !nftAbi) {
      toast.error("Missing required contract information");
      return;
    }

    setIsMinting(true);

    try {
      console.log("🚀 Minting NFT immediately...");

      const hash = await dagClient.writeContract({
        address: nftAddress,
        abi: nftAbi,
        functionName: "safeMint",
        args: [address, nft.image || ""],
        value: parseDAG(nft.price),
      });

      console.log("✅ Transaction Hash:", hash);

      // Save to transaction history
      const storageKey = `transaction_history_${address}`;
      const stored = localStorage.getItem(storageKey);
      const history = stored ? JSON.parse(stored) : [];

      const newTx = {
        hash,
        timestamp: Date.now(),
        status: "success",
        type: "NFT Mint",
        target: nftAddress,
      };

      const updatedHistory = [newTx, ...history].slice(0, 20); // Keep last 20
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

      toast.success(`Successfully minted ${nft.name}!`, {
        description: "The NFT has been added to your collection.",
        action: {
          label: "View",
          onClick: () =>
            window.open(`https://awakening.bdagscan.com/tx/${hash}`, "_blank"),
        },
      });

      onMint?.(nft);

      // Refresh balance
      const newBalance = await dagClient.getBalance();
      console.log("New balance:", newBalance);
    } catch (error: any) {
      console.error("❌ Transaction error:", error);

      // Save failed transaction to history
      const storageKey = `transaction_history_${address}`;
      const stored = localStorage.getItem(storageKey);
      const history = stored ? JSON.parse(stored) : [];

      const failedTx = {
        hash: "",
        timestamp: Date.now(),
        status: "failed",
        type: "NFT Mint",
        target: nftAddress,
      };

      const updatedHistory = [failedTx, ...history].slice(0, 20);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

      let errorMessage = "Transaction failed";

      if (error.message.includes("0x118cdaa7")) {
        errorMessage =
          "Account validation failed. The contract may not recognize your account.";
      } else if (error.message.includes("execution reverted")) {
        errorMessage =
          "Contract execution failed. Check if you're eligible to mint.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees.";
      } else if (error.message) {
        errorMessage = error.message.split("\n")[0];
      }

      toast.error("Minting Failed", {
        description: errorMessage,
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleAddToBatch = () => {
    if (!address || !nftAddress || !nftAbi) {
      toast.error("Missing required contract information");
      return;
    }

    try {
      // Encode the function call
      const callData = encodeFunctionData({
        abi: nftAbi,
        functionName: "safeMint",
        args: [address, nft.image || ""],
      });

      // Create a unique ID for this transaction
      const newId =
        batchTransaction.length > 0
          ? Math.max(...batchTransaction.map((tx: { id: any }) => tx.id)) + 1
          : 1;

      // Add to batch
      const newTransaction = {
        id: newId,
        name: transactionType.NFT,
        data: callData,
        value: 0n, // NFT minting typically doesn't require sending value
        target: nftAddress,
      };

      setBatchTransaction([...batchTransaction, newTransaction]);

      toast.success(`Added ${nft.name} to batch`, {
        description: `Batch now contains ${batchTransaction.length + 1} transaction${batchTransaction.length + 1 > 1 ? "s" : ""}`,
      });

      console.log("✅ Added to batch:", newTransaction);
    } catch (error: any) {
      console.error("❌ Error adding to batch:", error);
      toast.error("Failed to add to batch", {
        description: error.message,
      });
    }
  };

  return (
    <div className="group relative glass rounded-2xl overflow-hidden nft-card-hover gradient-border">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />

        {/* Overlay actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-card/80 transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? "fill-accent text-accent" : "text-foreground"
              }`}
            />
          </button>
          <button className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-card/80 transition-colors">
            <ExternalLink className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Collection badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium glass">
            {nft.collection}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-heading font-semibold text-lg text-foreground truncate">
            {nft.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {nft.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Creator</p>
            <p className="text-sm font-medium text-foreground">
              @{nft.creator}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-lg font-bold gradient-text">{nft.price} DAG</p>
          </div>
        </div>

        {nft.owned ? (
          <Button variant="secondary" className="w-full" disabled>
            Owned
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleAddToBatch}
              disabled={isMinting}
            >
              <Plus className="w-4 h-4" />
              Add to Batch
            </Button>
            <Button
              variant="mint"
              className="flex-1 gap-2"
              onClick={handleMintNow}
              disabled={isMinting}
            >
              {isMinting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Mint Now
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTCard;
