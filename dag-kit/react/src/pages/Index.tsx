import { useState } from "react";
import Header from "@/components/Header";
import NFTCard from "@/components/NFTCard";
import { nfts, NFT } from "@/data/nfts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame, TrendingUp, Clock, Sparkles, Coins, Plus } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";
import { transactionType, useAuth } from "@/providers/auth-provider";
import { tokenAbi, tokenAddress } from "@/contracts/counter";
import { PopUpModal } from "@/components/popup";
import { toast } from "sonner";
import { encodeFunctionData, parseUnits } from "viem";

const Index = () => {
  const [mintedNFTs, setMintedNFTs] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "available" | "owned">("all");
  const [darkMode, setDarkMode] = useState(true);
  const {
    isModalOpen,
    setIsModalOpen,
    dagClient,
    address,
    batchTransaction,
    setBatchTransaction,
  } = useAuth();

  // Token minting state
  const [tokenAmount, setTokenAmount] = useState("");
  const [isMintingToken, setIsMintingToken] = useState(false);

  const handleMint = (nft: NFT) => {
    setMintedNFTs((prev) => [...prev, nft.id]);
  };

  const handleMintTokenNow = async () => {
    if (!dagClient) {
      toast.error("Smart account not initialized");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsMintingToken(true);

    try {
      // Parse amount to wei (assuming 18 decimals)
      const amount = parseUnits(tokenAmount, 18);

      console.log("🪙 Minting tokens immediately...");
      console.log("Amount:", tokenAmount, "tokens");
      console.log("Amount in wei:", amount.toString());

      const hash = await dagClient.writeContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "mint_",
        args: [address, amount],
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
        type: "Token Mint",
        target: tokenAddress,
        value: tokenAmount,
      };

      const updatedHistory = [newTx, ...history].slice(0, 20);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

      toast.success(`Successfully minted ${tokenAmount} tokens!`, {
        description: "Tokens have been added to your wallet.",
        action: {
          label: "View",
          onClick: () =>
            window.open(`https://awakening.bdagscan.com/tx/${hash}`, "_blank"),
        },
      });

      // Reset input
      setTokenAmount("");

      // Refresh balance
      const newBalance = await dagClient.getBalance();
      console.log("New balance:", newBalance);
    } catch (error: any) {
      console.error("❌ Token mint error:", error);

      // Save failed transaction to history
      const storageKey = `transaction_history_${address}`;
      const stored = localStorage.getItem(storageKey);
      const history = stored ? JSON.parse(stored) : [];

      const failedTx = {
        hash: "",
        timestamp: Date.now(),
        status: "failed",
        type: "Token Mint",
        target: tokenAddress,
        value: tokenAmount,
      };

      const updatedHistory = [failedTx, ...history].slice(0, 20);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

      let errorMessage = "Token mint failed";

      if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "Contract execution failed. Check permissions.";
      } else if (error.message) {
        errorMessage = error.message.split("\n")[0];
      }

      toast.error("Token Mint Failed", {
        description: errorMessage,
      });
    } finally {
      setIsMintingToken(false);
    }
  };

  const handleAddTokenToBatch = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      // Parse amount to wei
      const amount = parseUnits(tokenAmount, 18);

      // Encode the function call
      const callData = encodeFunctionData({
        abi: tokenAbi,
        functionName: "mint_",
        args: [address, amount],
      });

      // Create unique ID
      const newId =
        batchTransaction.length > 0
          ? Math.max(...batchTransaction.map((tx: { id: any }) => tx.id)) + 1
          : 1;

      // Add to batch
      const newTransaction = {
        id: newId,
        name: transactionType.TOKEN,
        data: callData,
        value: amount,
        target: tokenAddress,
      };

      setBatchTransaction([...batchTransaction, newTransaction]);

      toast.success(`Added ${tokenAmount} token mint to batch`, {
        description: `Batch now contains ${batchTransaction.length + 1} transaction${batchTransaction.length + 1 > 1 ? "s" : ""}`,
      });

      // Reset input
      setTokenAmount("");

      console.log("✅ Added token mint to batch:", newTransaction);
    } catch (error: any) {
      console.error("❌ Error adding to batch:", error);
      toast.error("Failed to add to batch", {
        description: error.message,
      });
    }
  };

  const filteredNFTs = nfts
    .map((nft) => ({
      ...nft,
      owned: nft.owned || mintedNFTs.includes(nft.id),
    }))
    .filter((nft) => {
      if (filter === "available") return !nft.owned;
      if (filter === "owned") return nft.owned;
      return true;
    });

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-float"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <Header />

      <main className="relative pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Hero Section */}
          <section className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Discover Unique Digital Art
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading mb-6">
              <span className="text-foreground">Mint Your Next</span>
              <br />
              <span className="gradient-text">Digital Masterpiece</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Explore and collect extraordinary NFTs from world-class artists.
              Each piece is a unique work of art stored forever on the
              blockchain.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="mint" size="xl">
                <Flame className="w-5 h-5" />
                Explore Collection
              </Button>
              <Button variant="glass" size="xl">
                Learn More
              </Button>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { label: "Total NFTs", value: "6", icon: Sparkles },
              {
                label: "Available",
                value: nfts
                  .filter((n) => !n.owned && !mintedNFTs.includes(n.id))
                  .length.toString(),
                icon: TrendingUp,
              },
              {
                label: "Your Collection",
                value: nfts
                  .filter((n) => n.owned || mintedNFTs.includes(n.id))
                  .length.toString(),
                icon: Clock,
              },
              { label: "Floor Price", value: "0.5 DAG", icon: Flame },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="glass rounded-2xl p-6 text-center animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-bold font-heading gradient-text">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </section>

          {/* Token Mint Section */}
          <section className="mb-16 animate-fade-in">
            <div className="glass rounded-2xl p-8 max-w-3xl mx-auto gradient-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-heading text-foreground">
                    Mint ERC20 Tokens
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Mint custom tokens to your wallet instantly
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Token Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount (e.g., 100)"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    className="glass text-lg"
                    min="0"
                    step="0.01"
                    disabled={!address}
                  />
                  <p className="text-xs text-muted-foreground">
                    Contract: {tokenAddress}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleAddTokenToBatch}
                    disabled={!address || !tokenAmount || isMintingToken}
                  >
                    <Plus className="w-4 h-4" />
                    Add to Batch
                  </Button>
                  <Button
                    variant="mint"
                    className="flex-1 gap-2"
                    onClick={handleMintTokenNow}
                    disabled={!address || !tokenAmount || isMintingToken}
                  >
                    {isMintingToken ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        Mint Now
                      </>
                    )}
                  </Button>
                </div>

                {!address && (
                  <p className="text-sm text-yellow-500 text-center">
                    Please connect your wallet to mint tokens
                  </p>
                )}
              </div>

              {/* Token Info Card */}
              <div className="mt-6 p-4 rounded-lg bg-background/50 border border-white/5">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                  TOKEN DETAILS
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium text-foreground">ERC20</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Decimals</p>
                    <p className="font-medium text-foreground">18</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Function</p>
                    <p className="font-mono text-xs text-foreground">
                      mintToken(address, uint256)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Filter Tabs */}
          <section className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
              NFT Collection
            </h2>
            <div className="flex gap-2">
              {["all", "available", "owned"].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "glow" : "glass"}
                  size="sm"
                  onClick={() => setFilter(f as typeof filter)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </section>

          {/* NFT Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNFTs.map((nft, i) => (
              <div
                key={nft.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <NFTCard nft={nft} onMint={handleMint} />
              </div>
            ))}
          </section>

          {filteredNFTs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No NFTs found in this category.
              </p>
            </div>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
};

export default Index;
