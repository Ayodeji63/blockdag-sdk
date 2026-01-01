import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  User,
  LayoutGrid,
  Copy,
  ExternalLink,
  LogOut,
  Check,
  Clock,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AuthModal } from "./auth-modal";
import { useState, useEffect } from "react";
import { BatchTransactionType, useAuth } from "@/providers/auth-provider";
import truncate from "truncate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface TransactionHistory {
  hash: string;
  timestamp: number;
  status: "success" | "failed";
  type: string;
  target: string;
}

const TRANSACTION_HISTORY_KEY = "transaction_history_";

const Header = () => {
  const location = useLocation();
  const {
    setIsModalOpen,
    address,
    dagClient,
    handleLogout,
    batchTransaction,
    setBatchTransaction,
  } = useAuth();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecentTx, setShowRecentTx] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionHistory[]
  >([]);

  // Load transaction history from localStorage when address changes
  useEffect(() => {
    if (address) {
      const storageKey = `${TRANSACTION_HISTORY_KEY}${address}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRecentTransactions(parsed);
        } catch (error) {
          console.error("Failed to parse transaction history:", error);
          setRecentTransactions([]);
        }
      }
    }
  }, [address]);

  // Save transaction history to localStorage
  const saveTransactionHistory = (txHistory: TransactionHistory[]) => {
    if (!address) return;
    const storageKey = `${TRANSACTION_HISTORY_KEY}${address}`;
    // Keep only last 20 transactions
    const limitedHistory = txHistory.slice(0, 20);
    localStorage.setItem(storageKey, JSON.stringify(limitedHistory));
    setRecentTransactions(limitedHistory);
  };

  // Add transaction to history
  const addTransactionToHistory = (
    hash: string,
    status: "success" | "failed",
    type: string,
    target: string
  ) => {
    const newTx: TransactionHistory = {
      hash,
      timestamp: Date.now(),
      status,
      type,
      target,
    };

    const updatedHistory = [newTx, ...recentTransactions];
    saveTransactionHistory(updatedHistory);
  };

  const handleDropdownOpen = async () => {
    if (!dagClient || !address) return;

    try {
      const bal = await dagClient.getBalance();
      // Format balance (assuming 18 decimals)
      const formattedBalance = (Number(bal) / 1e18).toFixed(4);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("Error");
    }
  };

  const sendBatchTransaction = async () => {
    if (!dagClient) {
      toast.error("Smart account not initialized");
      return;
    }

    if (batchTransaction.length === 0) {
      toast.error("No transactions to submit");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 Submitting batch transactions...");
      console.log("Batch size:", batchTransaction.length);

      // Transform BatchTransactionType[] to the format expected by sendBatchUserOperations
      const userOps = batchTransaction.map((tx) => ({
        target: tx.target,
        data: tx.data,
      }));

      console.log("User operations:", userOps);

      // Send batch transaction
      const txHashes = await dagClient.sendBatchUserOperations(userOps);

      console.log("✅ Batch transaction submitted!");
      console.log("Transaction hashes:", txHashes);

      // Get existing history
      const storageKey = `transaction_history_${address}`;
      const stored = localStorage.getItem(storageKey);
      const history = stored ? JSON.parse(stored) : [];

      // Add ALL transactions to history individually
      const newTransactions = txHashes.map((hash: string, index: number) => {
        const tx = batchTransaction[index];
        return {
          hash,
          timestamp: Date.now() + index, // Add index to ensure unique timestamps
          status: "success",
          type: tx.name,
          target: tx.target,
          value: tx.value ? (Number(tx.value) / 1e18).toFixed(4) : undefined,
        };
      });

      // Prepend all new transactions
      const updatedHistory = [...newTransactions, ...history].slice(0, 20);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      setRecentTransactions(updatedHistory);

      // Show success toast with transaction links
      toast.success(`Batch submitted successfully!`, {
        description: `${txHashes.length} transaction${txHashes.length > 1 ? "s" : ""} sent`,
        action: {
          label: "View First",
          onClick: () =>
            window.open(
              `https://awakening.bdagscan.com/tx/${txHashes[0]}`,
              "_blank"
            ),
        },
      });

      // Log all transaction explorers
      txHashes.forEach((hash: string, i: number) => {
        console.log(
          `Transaction ${i + 1}: https://awakening.bdagscan.com/tx/${hash}`
        );
      });

      // Clear batch after successful submission
      setBatchTransaction([]);

      // Refresh balance
      const newBalance = await dagClient.getBalance();
      const formattedBalance = (Number(newBalance) / 1e18).toFixed(4);
      setBalance(formattedBalance);
    } catch (error: any) {
      console.error("❌ Batch transaction failed:", error);

      // Get existing history
      const storageKey = `transaction_history_${address}`;
      const stored = localStorage.getItem(storageKey);
      const history = stored ? JSON.parse(stored) : [];

      // Add ALL failed transactions to history individually
      const failedTransactions = batchTransaction.map((tx, index) => ({
        hash: "",
        timestamp: Date.now() + index,
        status: "failed",
        type: tx.name,
        target: tx.target,
        value: tx.value ? (Number(tx.value) / 1e18).toFixed(4) : undefined,
      }));

      const updatedHistory = [...failedTransactions, ...history].slice(0, 20);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      setRecentTransactions(updatedHistory);

      let errorMessage = "Failed to submit batch transaction";

      if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "One or more transactions failed validation";
      } else if (error.message) {
        errorMessage = error.message.split("\n")[0];
      }

      toast.error("Batch Failed", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeBatchTransaction = (id: number) => {
    setBatchTransaction((prev) => prev.filter((tx) => tx.id !== id));
    toast.success("Transaction removed from batch");
  };

  const clearAllBatchTransactions = () => {
    setBatchTransaction([]);
    toast.success("All transactions cleared");
  };

  const clearTransactionHistory = () => {
    if (!address) return;
    const storageKey = `${TRANSACTION_HISTORY_KEY}${address}`;
    localStorage.removeItem(storageKey);
    setRecentTransactions([]);
    toast.success("Transaction history cleared");
  };

  const copyAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const copyTransactionHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success("Transaction hash copied!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDisconnect = () => {
    // Clear transaction history on logout
    if (address) {
      const storageKey = `${TRANSACTION_HISTORY_KEY}${address}`;
      localStorage.removeItem(storageKey);
    }
    setRecentTransactions([]);
    handleLogout();
    setBalance(null);
    setBatchTransaction([]);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // Less than 1 minute
    if (diff < 60000) return "Just now";
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    // Less than 1 day
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    // Less than 7 days
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    // Show date
    return date.toLocaleDateString();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            <span className="text-xl font-bold text-primary-foreground font-heading">
              N
            </span>
          </div>
          <span className="text-xl font-bold font-heading gradient-text">
            NexusNFT
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/">
            <Button
              variant={location.pathname === "/" ? "glow" : "ghost"}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/profile">
            <Button
              variant={location.pathname === "/profile" ? "glow" : "ghost"}
              className="gap-2"
            >
              <User className="w-4 h-4" />
              My NFTs
            </Button>
          </Link>
        </nav>

        {address ? (
          <DropdownMenu onOpenChange={(open) => open && handleDropdownOpen()}>
            <DropdownMenuTrigger asChild>
              <Button variant="mint" className="gap-2 cursor-pointer relative">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">{truncate(address, 6)}</span>
                {batchTransaction.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {batchTransaction.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 glass border-white/10"
            >
              {/* Account Info */}
              <DropdownMenuLabel className="pb-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Account
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Balance
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium">
                        {truncate(address, 12)}
                      </span>
                    </div>
                    <span className="text-lg font-bold gradient-text">
                      {balance || "..."} DAG
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-white/10" />

              {/* Full Address - Copyable */}
              <div className="px-2 py-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                  <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                    {address}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-white/10" />

              {/* Batched Transactions */}
              <div className="px-2 py-2">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Batched Transactions
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">
                      {batchTransaction.length}
                    </span>
                    {batchTransaction.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={clearAllBatchTransactions}
                        title="Clear all"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>

                {batchTransaction.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {batchTransaction.map((tx: BatchTransactionType) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-primary">
                                {tx.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                #{tx.id}
                              </span>
                            </div>
                            <p className="text-xs font-mono truncate text-muted-foreground">
                              To: {truncate(tx.target, 10)}
                            </p>
                            {tx.value && tx.value > 0n && (
                              <p className="text-xs text-muted-foreground">
                                Value: {(Number(tx.value) / 1e18).toFixed(4)}{" "}
                                DAG
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeBatchTransaction(tx.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="mint"
                      size="sm"
                      className="w-full mt-2 gap-2"
                      onClick={sendBatchTransaction}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Batch ({batchTransaction.length})
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No batched transactions
                    </p>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="bg-white/10" />

              {/* Recent Transactions Toggle */}
              <div className="px-2 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setShowRecentTx(!showRecentTx)}
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      Recent Transactions
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({recentTransactions.length})
                    </span>
                  </div>
                  {showRecentTx ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>

                {/* Recent Transactions List */}
                {showRecentTx && (
                  <div className="mt-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {recentTransactions.length > 0 ? (
                      <>
                        {recentTransactions.map((tx, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {tx.status === "success" ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">
                                  {tx.type}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(tx.timestamp)}
                                </span>
                              </div>
                              {tx.hash ? (
                                <div className="flex items-center gap-1 mt-1">
                                  <p className="text-xs font-mono text-muted-foreground truncate flex-1">
                                    {truncate(tx.hash, 16)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={() => copyTransactionHash(tx.hash)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={() =>
                                      window.open(
                                        `https://awakening.bdagscan.com/tx/${tx.hash}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-xs text-red-500 mt-1">
                                  Transaction failed
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                To: {truncate(tx.target, 10)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-red-500 hover:text-red-600"
                          onClick={clearTransactionHistory}
                        >
                          Clear History
                        </Button>
                      </>
                    ) : (
                      <div className="p-4 text-center">
                        <History className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          No recent transactions
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="bg-white/10" />

              {/* Actions */}
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() =>
                  window.open(
                    `https://awakening.bdagscan.com/address/${address}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-500"
                onClick={handleDisconnect}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="mint"
            className="gap-2 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Connect Wallet</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
