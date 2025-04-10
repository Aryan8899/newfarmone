import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@suiet/wallet-kit";
import { suiClient } from "../utils/suiClient";
import {
  FaTractor,
  FaCoins,
  FaChartLine,
  FaLock,
  FaExchangeAlt,
  FaArrowLeft,
  FaInfoCircle,
  FaExclamationTriangle,
  FaClipboard,
  FaCircle,
  FaHistory,
  FaExternalLinkAlt,
  FaChartPie,
} from "react-icons/fa";
import { toast } from "sonner";
import { useBackground } from "../contexts/BackgroundContext";
import UserStakesComponent, {
  StakingPosition,
} from "../components/farm/UserStakesComponent";
import TokenLockerComponent from "../components/farm/TokenLockerComponent";
import { CONSTANTS } from "../constants/addresses";

// Position Summary Card
const PositionSummaryCard = ({
  title,
  value,
  subValue = null,
  icon,
  accent = "blue",
}: any) => {
  const Icon = icon;

  const accentColors = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
    green: "from-green-500/20 to-green-600/10 border-green-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  };

  const accentClass =
    accentColors[accent as keyof typeof accentColors] || accentColors.blue;

  return (
    <div
      className={`rounded-xl overflow-hidden relative transition-all duration-300 hover:-translate-y-1 p-0.5 bg-gradient-to-br ${accentClass}`}
    >
      <div className="bg-blue-950/70 p-5 rounded-lg h-full">
        <div className="flex items-center mb-3 gap-2">
          <div
            className={`bg-blue-900/60 p-2 rounded-lg border border-${accent}-500/30`}
          >
            <Icon
              className={`text-${accent}-400 text-xl transition-transform duration-300`}
            />
          </div>
          <span className="text-blue-200 font-poppins text-sm">{title}</span>
        </div>
        <div className="font-dela text-2xl stats-value transition-colors duration-300 text-white">
          {value}
        </div>
        {subValue && <p className="text-sm text-blue-300 mt-1">{subValue}</p>}
      </div>
    </div>
  );
};

// Transaction History Card
const TransactionHistoryCard = ({ transactions }: { transactions: any[] }) => {
  return (
    <div className="card-bg-premium rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="accent-line"></div>
          <h3 className="text-xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaHistory className="text-yellow-400" />
            Transaction History
          </h3>
        </div>
        <button className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {transactions.length > 0 ? (
          transactions.map((tx, index) => (
            <div
              key={index}
              className="bg-blue-900/40 rounded-lg p-3 border border-blue-800/50"
            >
              <div className="flex items-start">
                <div className="bg-blue-900/80 p-2 rounded-full mr-3">
                  {tx.type === "stake" && (
                    <FaTractor className="text-green-400" />
                  )}
                  {tx.type === "unstake" && (
                    <FaCoins className="text-red-400" />
                  )}
                  {tx.type === "claim" && (
                    <FaCoins className="text-yellow-400" />
                  )}
                  {tx.type === "lock" && <FaLock className="text-purple-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{tx.title}</p>
                  <p className="text-blue-300 text-sm">{tx.description}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-blue-400">{tx.time}</p>
                    <a
                      href={`https://suiscan.xyz/devnet/tx/${tx.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                    >
                      <span>View TX</span>
                      <FaExternalLinkAlt size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-blue-300">
            <p>No recent transactions</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Wallet Info Card
const WalletInfoCard = ({
  address,
  suiBalance,
  victoryBalance,
}: {
  address: string;
  suiBalance: string;
  victoryBalance: string;
}) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="card-bg-premium rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="accent-line"></div>
        <h3 className="text-xl font-dela tracking-wider text-white">
          Wallet Info
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center bg-blue-900/40 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-blue-200">Status</span>
          </div>
          <span className="text-green-400 font-medium">Connected</span>
        </div>

        <div className="bg-blue-900/40 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Address</span>
            <button
              onClick={copyAddress}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <FaClipboard />
            </button>
          </div>
          <p className="text-white text-sm mt-1 break-all">{address}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-900/40 rounded-lg p-3">
            <span className="text-blue-200 text-sm">SUI Balance</span>
            <p className="text-white font-medium mt-1">{suiBalance} SUI</p>
          </div>
          <div className="bg-blue-900/40 rounded-lg p-3">
            <span className="text-blue-200 text-sm">VICTORY Balance</span>
            <p className="text-white font-medium mt-1">
              {victoryBalance} VICTORY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Position Stats Component
const PositionStatsSection = ({ stats }: { stats: any }) => {
  return (
    <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaChartLine className="text-yellow-400 float-animation-minimal" />
            <span className="text-shimmer-gold">Your Position Summary</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PositionSummaryCard
            title="Total Staked"
            value={stats.totalTokensStaked}
            subValue={`${stats.positions} positions`}
            icon={FaTractor}
            accent="blue"
          />
          <PositionSummaryCard
            title="Pending Rewards"
            value={stats.pendingRewards}
            subValue="VICTORY tokens"
            icon={FaCoins}
            accent="yellow"
          />
          <PositionSummaryCard
            title="Total Locked"
            value={stats.totalLocked}
            subValue={`${stats.lockedUntil}`}
            icon={FaLock}
            accent="purple"
          />
          <PositionSummaryCard
            title="Daily Earnings"
            value={stats.dailyEarnings}
            subValue="VICTORY per day"
            icon={FaChartLine}
            accent="green"
          />
        </div>
      </div>
    </div>
  );
};

// Format a balance with appropriate decimals
const formatBalance = (balance: string, decimals = 9) => {
  try {
    return (Number(balance) / Math.pow(10, decimals)).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }
    );
  } catch (e) {
    console.error("Error formatting balance:", e);
    return "0.000000";
  }
};

// Format VICTORY token balance
const formatVictoryBalance = (balance: string) => {
  try {
    // Parse the balance as a BigInt to handle large numbers properly
    const bigIntBalance = BigInt(balance);

    // Convert to a decimal number with proper precision
    // First divide by 10^3 to get a manageable number for JavaScript
    const reducedBalance = Number(bigIntBalance / BigInt(1000));
    // Then divide by 10^3 again and format
    const formattedBalance = (reducedBalance / 1000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });

    return formattedBalance;
  } catch (e) {
    console.error("Error formatting VICTORY balance:", e);
    return "0.000000";
  }
};

// Extract function from transaction data
const extractFunctionName = (transaction: any): string | null => {
  try {
    if (!transaction) return null;

    // Try to find the MoveCall in the transaction data
    let moveCall = null;

    // Handle different transaction data structures
    if (transaction.transaction?.data?.transaction?.transactions) {
      // Newer structure
      const txs = transaction.transaction.data.transaction.transactions;
      moveCall = txs.find((tx: any) => tx && tx.MoveCall);
    } else if (transaction.transaction?.data?.transaction) {
      // Alternative structure
      const tx = transaction.transaction.data.transaction;
      if (tx.MoveCall) moveCall = tx;
    } else if (transaction.transaction?.data?.transactions) {
      // Legacy structure
      const txs = transaction.transaction.data.transactions;
      moveCall = txs.find((tx: any) => tx && tx.MoveCall);
    } else if (transaction.MoveCall) {
      // Direct MoveCall
      moveCall = transaction;
    }

    // Extract the function name if found
    if (moveCall && moveCall.MoveCall) {
      return moveCall.MoveCall.function || null;
    }

    return null;
  } catch (error) {
    console.error("Error extracting function name:", error);
    return null;
  }
};

// Main MyPositions Component
export default function MyPositions() {
  const { setIntensity } = useBackground();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("stakes");
  const { connected, account, signAndExecuteTransactionBlock } = useWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState({
    address: "",
    suiBalance: "0.00",
    victoryBalance: "0.00",
  });
  const [positionStats, setPositionStats] = useState({
    totalTokensStaked: "0 tokens",
    positions: 0,
    pendingRewards: "0 VICTORY",
    totalLocked: "0 VICTORY",
    lockedUntil: "No active locks",
    dailyEarnings: "0 VICTORY",
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userStakes, setUserStakes] = useState<StakingPosition[]>([]);
  const [userLocks, setUserLocks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Set background intensity when component mounts
  useEffect(() => {
    setIntensity("low");

    // Animate on load
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [setIntensity]);

  // Add scroll animation observer
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [isLoaded]);

  // Fetch wallet balances
  const fetchWalletBalances = async () => {
    if (!connected || !account?.address) return;

    try {
      // Fetch SUI balance
      const suiBalances = await suiClient.getBalance({
        owner: account.address,
        coinType: "0x2::sui::SUI",
      });

      // Fetch VICTORY token balance
      const victoryBalances = await suiClient.getBalance({
        owner: account.address,
        coinType: `${CONSTANTS.PACKAGE_ID}::victory_token::VICTORY_TOKEN`,
      });

      // Update wallet info state
      setWalletInfo({
        address: account.address,
        suiBalance: formatBalance(
          suiBalances.totalBalance,
          CONSTANTS.DECIMALS.SUI
        ),
        victoryBalance: formatVictoryBalance(
          victoryBalances.totalBalance || "0"
        ),
      });
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
    }
  };

  // Function to fetch and process transaction history
  const fetchTransactionHistory = async () => {
    if (!connected || !account?.address) return;

    try {
      // Get recent transactions
      const txs = await suiClient.queryTransactionBlocks({
        filter: {
          FromAddress: account.address,
        },
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
        },
        limit: 10,
        order: "descending",
      });

      if (!txs.data || txs.data.length === 0) {
        setTransactions([]);
        return;
      }

      // Process and format transactions
      const processedTxs = await Promise.all(
        txs.data.map(async (tx) => {
          // Try to determine transaction type
          let type = "stake";
          let title = "Transaction";
          let description = "Transaction on SUI network";

          // Extract function name from transaction data
          const functionName = extractFunctionName(tx);

          if (functionName) {
            if (functionName.includes("stake")) {
              type = "stake";
              title = "Stake Successful";
              description = "Staked tokens in Farm";
            } else if (functionName.includes("unstake")) {
              type = "unstake";
              title = "Unstake Successful";
              description = "Unstaked tokens from Farm";
            } else if (functionName.includes("claim_rewards")) {
              type = "claim";
              title = "Rewards Claimed";
              description = "Claimed VICTORY tokens from farm rewards";
            } else if (functionName.includes("lock")) {
              type = "lock";
              title = "Tokens Locked";
              description = "Locked tokens for staking";
            }
          }

          // Format the timestamp
          const timestamp = tx.timestampMs
            ? parseInt(tx.timestampMs)
            : Date.now();
          const txTime = formatTimeAgo(timestamp);

          return {
            type,
            title,
            description,
            time: txTime,
            txId: tx.digest,
          };
        })
      );

      setTransactions(processedTxs);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      setTransactions([]);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  };

  // Calculate position stats with fixed parsing of formatted numbers
  const calculatePositionStats = (
    stakes: StakingPosition[],
    lockedTokens: any[] = []
  ) => {
    if (!stakes || stakes.length === 0) {
      return {
        totalTokensStaked: "0 tokens",
        positions: 0,
        pendingRewards: "0 VICTORY",
        totalLocked: "0 VICTORY",
        lockedUntil: "No active locks",
        dailyEarnings: "0 VICTORY",
      };
    }

    // Calculate total tokens staked
    const lpTokens = stakes.filter((p) => p.type === "lp");
    const singleTokens = stakes.filter((p) => p.type === "single");

    console.log("lpTokens", lpTokens);
    console.log("singleTokens", singleTokens);

    const totalLpTokens = lpTokens.reduce((total, pos) => {
      return total + parseFloat(pos.amountFormatted.replace(/,/g, "") || "0");
    }, 0);

    const totalSingleTokens = singleTokens.reduce((total, pos) => {
      return total + parseFloat(pos.amountFormatted.replace(/,/g, "") || "0");
    }, 0);

    const tokensStakedText = `${totalLpTokens.toFixed(
      2
    )} LP + ${totalSingleTokens.toFixed(2)} tokens`;

    // Pending rewards - FIX: Remove commas before parsing to float
    const totalPendingRewards = stakes.reduce((total, pos) => {
      // Remove ALL commas before parsing
      const pendingRewardsValue = pos.pendingRewardsFormatted
        ? parseFloat(pos.pendingRewardsFormatted.replace(/,/g, ""))
        : 0;

      // Log to verify correct parsing
      console.log("Parsing pending rewards:", {
        original: pos.pendingRewardsFormatted,
        withoutCommas: pos.pendingRewardsFormatted?.replace(/,/g, ""),
        parsed: pendingRewardsValue,
      });

      return total + pendingRewardsValue;
    }, 0);

    // Total locked (from token locker if available)
    const totalLocked =
      lockedTokens.length > 0
        ? lockedTokens
            .reduce((total, lock) => total + parseFloat(lock.amount || "0"), 0)
            .toFixed(2) + " VICTORY"
        : "0 VICTORY";

    // Locked until (using the furthest lock if multiple)
    const lockedUntil =
      lockedTokens.length > 0
        ? "Locks active" // This would be calculated from actual lock data
        : "No active locks";

    // Daily earnings (estimated from APR)
    const avgApr =
      stakes.reduce((total, pos) => total + (pos.apr || 0), 0) /
      (stakes.length || 1);
    const dailyRate = avgApr / 365 / 100;

    // Calculate daily earnings based on stake amount and APR
    const totalStakeValue = stakes.reduce((total, pos) => {
      return total + parseFloat(pos.amountFormatted.replace(/,/g, "") || "0");
    }, 0);

    const dailyEarningsTokens = totalStakeValue * dailyRate;

    return {
      totalTokensStaked: tokensStakedText,
      positions: stakes.length,
      pendingRewards: `${totalPendingRewards.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })} VICTORY`,
      totalLocked,
      lockedUntil,
      dailyEarnings: `${dailyEarningsTokens.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })} VICTORY`,
    };
  };

  // Handle user stakes update
  const handleUserStakesUpdate = (stakes: StakingPosition[]) => {
    setUserStakes(stakes);
    setPositionStats(calculatePositionStats(stakes, userLocks));
  };

  // Handle user locks update
  const handleUserLocksUpdate = (locks: any[]) => {
    setUserLocks(locks);
    setPositionStats(calculatePositionStats(userStakes, locks));
  };

  // Fetch all data when component mounts or wallet changes
  useEffect(() => {
    if (connected && account?.address) {
      setIsLoading(true);
      fetchWalletBalances();
      fetchTransactionHistory();
      // The staking positions will be fetched by the UserStakesComponent
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [connected, account?.address]);

  // Check if wallet is connected
  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card-bg-premium p-8 rounded-xl text-center max-w-2xl mx-auto">
          <FaExclamationTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">
            Wallet Connection Required
          </h3>
          <p className="text-blue-200 mb-6">
            Please connect your wallet to view your positions and staking
            details.
          </p>
          <Link to="/farm">
            <button className="button-gold py-3 px-6 rounded-lg flex items-center gap-2 font-bold mx-auto">
              <FaTractor />
              Go to Farm
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen text-white pt-2 pb-10 transition-all duration-700 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="container mx-auto px-4 py-4 relative z-10">
        {/* Back Navigation */}
        <div className="mb-6 animate-on-scroll">
          <Link
            to="/farm"
            className="flex items-center text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            <span>Back to Farm</span>
          </Link>
        </div>

        {/* Position Header */}
        <div className="mb-8 animate-on-scroll">
          <div className="card-bg-premium-gold rounded-xl p-6 shadow-xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-yellow-400/20 p-2 rounded-full">
                      <FaChartPie className="text-yellow-400 text-2xl" />
                    </div>
                    <h1 className="text-3xl font-dela text-white">
                      My Positions
                    </h1>
                  </div>
                  <p className="text-blue-200">
                    View and manage your staked tokens, locked positions, and
                    pending rewards.
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <FaCircle className="text-green-500 text-xs" />
                      <div className="text-white">
                        Wallet Connected: {walletInfo.address.substring(0, 6)}
                        ...
                        {walletInfo.address.substring(
                          walletInfo.address.length - 4
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Position Stats */}
        <div className="mb-8 animate-on-scroll stagger-1">
          <PositionStatsSection stats={positionStats} />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 animate-on-scroll stagger-2">
          <div className="flex border-b border-blue-800/50">
            <button
              onClick={() => setActiveTab("stakes")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "stakes"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaTractor className="text-sm" />
                <span>Stake Positions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("locks")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "locks"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaLock className="text-sm" />
                <span>Token Locks</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "history"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaHistory className="text-sm" />
                <span>History</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-on-scroll stagger-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Content - Transaction History and Wallet Info */}
            <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
              <WalletInfoCard
                address={walletInfo.address}
                suiBalance={walletInfo.suiBalance}
                victoryBalance={walletInfo.victoryBalance}
              />
              <TransactionHistoryCard transactions={transactions} />
            </div>

            {/* Right Content - Position Management */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {/* Stakes Tab */}
              {activeTab === "stakes" && (
                <UserStakesComponent onStakesUpdate={handleUserStakesUpdate} />
              )}

              {/* Locks Tab */}
              {activeTab === "locks" && (
                <TokenLockerComponent onLockUpdate={handleUserLocksUpdate} />
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="card-bg-premium rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="accent-line"></div>
                    <h3 className="text-xl font-dela tracking-wider text-white">
                      All Transactions
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button className="bg-blue-900/60 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-800 transition-colors">
                        All
                      </button>
                      <button className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm hover:bg-blue-800 transition-colors">
                        Stakes
                      </button>
                      <button className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm hover:bg-blue-800 transition-colors">
                        Unstakes
                      </button>
                      <button className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm hover:bg-blue-800 transition-colors">
                        Rewards
                      </button>
                      <button className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm hover:bg-blue-800 transition-colors">
                        Locks
                      </button>
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-3">
                      {transactions.length > 0 ? (
                        transactions.map((tx, index) => (
                          <div
                            key={index}
                            className="bg-blue-900/40 rounded-lg p-3 border border-blue-800/50"
                          >
                            <div className="flex items-start">
                              <div className="bg-blue-900/80 p-2 rounded-full mr-3">
                                {tx.type === "stake" && (
                                  <FaTractor className="text-green-400" />
                                )}
                                {tx.type === "unstake" && (
                                  <FaCoins className="text-red-400" />
                                )}
                                {tx.type === "claim" && (
                                  <FaCoins className="text-yellow-400" />
                                )}
                                {tx.type === "lock" && (
                                  <FaLock className="text-purple-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium">
                                  {tx.title}
                                </p>
                                <p className="text-blue-300 text-sm">
                                  {tx.description}
                                </p>
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-xs text-blue-400">
                                    {tx.time}
                                  </p>
                                  <a
                                    href={`https://suiscan.xyz/devnet/tx/${tx.txId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                                  >
                                    <span>View TX</span>
                                    <FaExternalLinkAlt size={10} />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-blue-300">
                          <p>No transactions found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
