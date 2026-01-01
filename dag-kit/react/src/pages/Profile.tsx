import { useState } from "react";
import Header from "@/components/Header";
import NFTCard from "@/components/NFTCard";
import { nfts, NFT } from "@/data/nfts";
import { User, Copy, ExternalLink, Settings, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Profile = () => {
  const [view, setView] = useState<"grid" | "list">("grid");
  
  // Simulate owned NFTs (in real app this would come from wallet/backend)
  const ownedNFTs = nfts.filter((nft) => nft.owned);
  
  const walletAddress = "0x1a2b...9f8e";
  const fullWalletAddress = "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9f8e";

  const copyAddress = () => {
    navigator.clipboard.writeText(fullWalletAddress);
    toast.success("Wallet address copied!");
  };

  const totalValue = ownedNFTs.reduce(
    (acc, nft) => acc + parseFloat(nft.price),
    0
  );

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -left-48 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 -right-48 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]" />
      </div>

      <Header />

      <main className="relative pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Profile Header */}
          <section className="mb-12 animate-fade-in">
            <div className="glass rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-primary to-accent p-1 shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
                    <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                      <User className="w-16 h-16 text-primary" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-lg">✓</span>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-2">
                    Crypto Collector
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                    <code className="px-3 py-1.5 rounded-lg bg-secondary text-sm font-mono text-muted-foreground">
                      {walletAddress}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-muted-foreground max-w-xl mb-6">
                    Passionate NFT collector exploring the frontiers of digital art. 
                    Building a curated collection of unique pieces from visionary artists.
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <Button variant="glow" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    <Button variant="glass">Share Profile</Button>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-10 border-t border-white/10">
                {[
                  { label: "NFTs Owned", value: ownedNFTs.length.toString() },
                  { label: "Total Value", value: `${totalValue.toFixed(2)} ETH` },
                  { label: "Collections", value: "3" },
                  { label: "Following", value: "42" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold font-heading gradient-text">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Collection Header */}
          <section className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
              My Collection
            </h2>
            <div className="flex gap-2">
              <Button
                variant={view === "grid" ? "glow" : "glass"}
                size="icon"
                onClick={() => setView("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={view === "list" ? "glow" : "glass"}
                size="icon"
                onClick={() => setView("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </section>

          {/* NFT Grid */}
          {ownedNFTs.length > 0 ? (
            <section
              className={
                view === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {ownedNFTs.map((nft, i) => (
                <div
                  key={nft.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {view === "grid" ? (
                    <NFTCard nft={nft} />
                  ) : (
                    <div className="glass rounded-2xl p-4 flex items-center gap-6">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-foreground">
                          {nft.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {nft.collection}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold gradient-text">
                          {nft.price} ETH
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{nft.creator}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          ) : (
            <div className="glass rounded-3xl p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
                <Grid3X3 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                No NFTs Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start your collection by minting some amazing NFTs!
              </p>
              <Button variant="mint" asChild>
                <a href="/">Browse NFTs</a>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
