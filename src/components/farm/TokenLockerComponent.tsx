import { useState, useEffect } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { suiClient } from "../../utils/suiClient";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { toast } from "sonner";
import {
  FaLock,
  FaUnlock,
  FaInfoCircle,
  FaCircleNotch,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt,
  FaClock,
  FaSadTear,
  FaSyncAlt,
  FaChartLine,
  FaExchangeAlt,
  FaRegQuestionCircle,
  FaCheckCircle,
  FaCoins,
} from "react-icons/fa";
import { CONSTANTS } from "../../constants/addresses";
import { SuiEvent, SuiMoveObject } from "@mysten/sui.js/client";

// Define types for parsed event data
interface ParsedTokensLockedEvent {
  lock_id: string;
  amount: string;
  lock_period: string;
  lock_end: string;
  user: string;
  lock_timestamp?: string;
  last_reward_time?: string;
}

interface ParsedTokensUnlockedEvent {
  lock_id: string;
  user: string;
}

// Define the lock position interface
interface LockPosition {
  // Enhanced version fields
  id: string;
  amount: string;
  amountFormatted: string;
  lockTimestamp: string;
  lockDateFormatted: string;
  unlockTimestamp: string;
  unlockDateFormatted: string;
  durationDays: number;
  isUnlockable: boolean;
  bonusMultiplier: number;
  multiplierBasisPoints: number;
  weightedAmount: string;
  periodName: string;
  lastRewardTime?: string;

  // Reference implementation fields (for compatibility)
  canUnlock: boolean;
  daysRemaining: number;
  formattedMultiplier: string;
  lock_end: string;
  lock_period: string;
  multiplier: number;
  weighted_amount: string;
  eventId: any;
  createdAt: number;
  lockEndDate: string;
  lastRewardDate: string;
}

interface TokenLockerComponentProps {
  onLockUpdate?: (locks: LockPosition[]) => void;
}

// Define lock periods to match reference implementation
const LOCK_PERIODS = [
  { days: 7, name: "1 Week", multiplier: 10, basisPoints: 1000 },
  { days: 30, name: "1 Month", multiplier: 25, basisPoints: 2500 },
  { days: 365, name: "1 Year", multiplier: 50, basisPoints: 5000 },
  { days: 5555, name: "Infinity", multiplier: 100, basisPoints: 10000 },
];

// LockCard component for displaying a single lock
const LockCard = ({
  lock,
  onUnlock,
  isUnlockLoading,
  currentlyProcessing,
}: {
  lock: LockPosition;
  onUnlock: (lock: LockPosition) => void;
  isUnlockLoading: boolean;
  currentlyProcessing: string | null;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate lock progress
  const calculateProgress = () => {
    // Use milliseconds timestamp for calculations
    const startTime = parseInt(lock.lockTimestamp);
    const endTime = parseInt(lock.unlockTimestamp);
    const currentTime = Date.now();

    // If already unlockable, return 100%
    if (lock.isUnlockable) return 100;

    // Calculate percentage
    const totalDuration = endTime - startTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(Math.floor((elapsed / totalDuration) * 100), 100);

    return progress;
  };

  // Calculate remaining time
  const calculateTimeRemaining = () => {
    // Use milliseconds timestamp for calculations
    const endTime = parseInt(lock.unlockTimestamp);
    const currentTime = Date.now();

    // If already unlockable, return "Ready to unlock"
    if (lock.isUnlockable) return "Ready to unlock";

    // Calculate remaining time
    const remainingMs = endTime - currentTime;

    // If negative, it's ready to unlock
    if (remainingMs <= 0) return "Ready to unlock";

    // Calculate days, hours, minutes
    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const progressPercent = calculateProgress();
  const timeRemaining = calculateTimeRemaining();
  const isProcessing = currentlyProcessing === lock.id;

  // Format multiplier percentage
  const multiplierPercent = (lock.bonusMultiplier * 100).toFixed(0);

  return (
    <div className="card-bg-premium rounded-xl overflow-hidden shadow-lg">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-900/60 p-2 rounded-full">
              <FaLock className="text-yellow-400 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">
                {lock.periodName}
              </h3>
              <p className="text-blue-300 text-xs">
                {lock.isUnlockable ? "Ready to unlock" : "Active Lock"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-dela text-white">
              {lock.amountFormatted}
            </div>
            <p className="text-blue-300 text-xs">VICTORY</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-300">{progressPercent}% Complete</span>
            <span className="text-blue-300">{timeRemaining}</span>
          </div>
          <div className="h-2 bg-blue-900/40 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                lock.isUnlockable ? "bg-green-500" : "bg-yellow-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onUnlock(lock)}
          disabled={!lock.isUnlockable || isUnlockLoading}
          className="w-full bg-yellow-600 text-white py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-yellow-700 transition-colors"
        >
          {isProcessing && isUnlockLoading ? (
            <>
              <FaCircleNotch className="animate-spin text-sm" />
              <span>Unlocking...</span>
            </>
          ) : (
            <>
              <FaUnlock className="text-sm" />
              <span>{lock.isUnlockable ? "Unlock Tokens" : "Locked"}</span>
            </>
          )}
        </button>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-blue-200 text-sm hover:text-white transition-colors flex items-center justify-center gap-2 mt-3"
        >
          {showDetails ? (
            <>
              <span>Hide Details</span>
              <FaChevronUp size={12} />
            </>
          ) : (
            <>
              <span>Show Details</span>
              <FaChevronDown size={12} />
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="bg-blue-900/30 p-5 border-t border-blue-800/50">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-blue-300 text-sm mb-1">Locked On</p>
              <p className="text-white flex items-center gap-1">
                <FaCalendarAlt className="text-yellow-400 text-xs" />
                <span>{lock.lockDateFormatted}</span>
              </p>
            </div>
            <div>
              <p className="text-blue-300 text-sm mb-1">Unlocks On</p>
              <p className="text-white flex items-center gap-1">
                <FaCalendarAlt className="text-green-400 text-xs" />
                <span>{lock.unlockDateFormatted}</span>
              </p>
            </div>
          </div>

          <div className="bg-blue-900/40 rounded-lg p-3 mb-4">
            <p className="text-blue-300 text-xs mb-1">Lock ID</p>
            <p className="text-white text-sm break-all">{lock.id}</p>
          </div>

          <div className="bg-blue-900/40 rounded-lg p-3">
            <p className="text-blue-300 text-xs mb-1">Staking Bonus</p>
            <p className="text-white font-medium">
              {multiplierPercent}% Multiplier
            </p>
            <p className="text-blue-300 text-xs mt-1">
              Locks increase your staking power and rewards
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Format balance with appropriate decimals
const formatBalance = (balance: string, decimals = 6) => {
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
    return "0.00";
  }
};

// Stats Card Component
const StatsCard = ({ title, value, icon, colorClass = "bg-blue-500" }: any) => {
  const Icon = icon;
  return (
    <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-800/30">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-full ${colorClass}`}>
          <Icon className="text-white text-sm" />
        </div>
        <span className="text-blue-300 text-sm">{title}</span>
      </div>
      <p className="text-2xl font-dela text-white overflow-hidden text-ellipsis">
        {value}
      </p>
    </div>
  );
};

// Main Component
const TokenLockerComponent = ({ onLockUpdate }: TokenLockerComponentProps) => {
  // States
  const [activeTab, setActiveTab] = useState("userLocks"); // userLocks, stats, lock
  const [isLoading, setIsLoading] = useState(true);
  const [userLocks, setUserLocks] = useState<LockPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUnlockLoading, setIsUnlockLoading] = useState(false);
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<
    string | null
  >(null);
  const [lockAmount, setLockAmount] = useState("");
  const [lockPercentage, setLockPercentage] = useState(100);
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(LOCK_PERIODS[1]); // Default 30 days
  const [isLockLoading, setIsLockLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState("0");
  const [totalLockedTokens, setTotalLockedTokens] = useState("0");
  const [totalUsers, setTotalUsers] = useState(0);
  const [victoryTokenMetadata, setVictoryTokenMetadata] = useState<any>(null);
  const [totalSuiRewards, setTotalSuiRewards] = useState("0");
  const [calculatedAPR, setCalculatedAPR] = useState<Record<number, string>>(
    {}
  );

  const { connected, account, signAndExecuteTransactionBlock } = useWallet();

  // Calculate APR values - using the reference implementation approach
  const calculateAPRs = () => {
    // Set up APR calculation parameters
    const baseRewardRate = 0.001; // Estimated daily SUI reward per token
    const victoryTokenPrice = 0.05; // Estimated price in USD
    const suiTokenPrice = 1.5; // Estimated price in USD

    const aprs: Record<number, string> = {};

    LOCK_PERIODS.forEach((period) => {
      // Base APR from multiplier
      const baseAPR = period.multiplier;

      // Additional APR from SUI rewards
      const dailyRewardsRate = baseRewardRate * (period.multiplier / 100);
      const additionalAPR =
        (dailyRewardsRate * 365 * suiTokenPrice) / victoryTokenPrice;

      // Total APR
      aprs[period.days] = (baseAPR + additionalAPR).toFixed(2);
    });

    setCalculatedAPR(aprs);
  };

  // Load VICTORY token metadata
  const loadVictoryTokenMetadata = async () => {
    try {
      // Get VICTORY token metadata
      const metadata = await suiClient.getObject({
        id: CONSTANTS.VICTORY_TOKEN.METADATA_ID,
        options: { showContent: true },
      });

      if (metadata.data?.content) {
        const content = metadata.data.content;
        if (content.dataType === "moveObject") {
          const fields = content.fields as Record<string, any>;
          setVictoryTokenMetadata({
            name: fields.name || "VICTORY",
            symbol: fields.symbol || "VICTORY",
            decimals: Number(fields.decimals) || 6,
          });
        }
      }
    } catch (error) {
      console.error("Error loading VICTORY token metadata:", error);
    }
  };

  // Load user locks using event-based approach from reference
  const loadUserLocksFromEvents = async () => {
    if (!connected || !account?.address) return;
    setIsLoading(true);

    try {
      console.log(
        "Fetching user locks from events for address:",
        account.address
      );

      // Get token locker object for general stats
      const lockerObj = await suiClient.getObject({
        id: CONSTANTS.TOKEN_LOCKER_ID,
        options: { showContent: true },
      });

      if (lockerObj.data?.content) {
        const content = lockerObj.data.content;
        if (content.dataType === "moveObject") {
          const fields = content.fields as Record<string, any>;
          // Get total locked and rewards
          setTotalLockedTokens(fields.total_locked || "0");

          // Handle sui_rewards which could be a nested object
          if (fields.sui_rewards && typeof fields.sui_rewards === "object") {
            const rewardsFields = fields.sui_rewards.fields as Record<
              string,
              any
            >;
            setTotalSuiRewards(rewardsFields?.value || "0");
          }

          setTotalUsers(parseInt(fields.total_users || "0"));
        }
      }

      // Query TokensLocked events for this user
      const lockedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.TOKEN_LOCKER}::TokensLocked`,
        },
        limit: 50, // Adjust based on expected number of locks
      });

      // Query TokensUnlocked events for this user
      const unlockedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.TOKEN_LOCKER}::TokensUnlocked`,
        },
        limit: 50,
      });

      console.log("Locked events:", lockedEvents);
      console.log("Unlocked events:", unlockedEvents);

      // Filter locked events for current user
      const userLockedEvents = lockedEvents.data.filter((event) => {
        const parsedJson = event.parsedJson as ParsedTokensLockedEvent;
        return parsedJson && parsedJson.user === account.address;
      });

      // Create a map of unlocked lock IDs
      const unlockedLockIds = new Set();
      unlockedEvents.data.forEach((event) => {
        const parsedJson = event.parsedJson as ParsedTokensUnlockedEvent;
        if (
          parsedJson &&
          parsedJson.user === account.address &&
          parsedJson.lock_id !== undefined
        ) {
          unlockedLockIds.add(parsedJson.lock_id);
        }
      });

      console.log("User locked events:", userLockedEvents);
      console.log("Unlocked lock IDs:", Array.from(unlockedLockIds));

      // Process lock events into user locks
      const currentTime = Date.now();
      const BASIS_POINTS = 10000; // Basis points for multiplier (10000 = 100%)

      const locks = userLockedEvents
        .filter((event) => {
          // Skip events where lock_id is in the unlocked set
          const parsedJson = event.parsedJson as ParsedTokensLockedEvent;
          return !unlockedLockIds.has(parsedJson.lock_id);
        })
        .map((event) => {
          // Type assertion but also handle potential null/undefined values
          const eventData = event.parsedJson as ParsedTokensLockedEvent;

          // Log raw data to understand what we're getting
          console.log("Raw event data:", eventData);

          // Extract lock data, matching exactly how the reference implementation formats it
          const id = eventData.lock_id || "0";
          const amount = eventData.amount || "0";
          const lockPeriod = Number(eventData.lock_period || "0");

          // Handle timestamps - follow reference implementation format
          // The reference implementation uses the event timestamp as lockTimestamp if not provided
          const eventTimestampMs = event.timestampMs
            ? parseInt(event.timestampMs)
            : Date.now();
          const lockTimestamp =
            eventData.lock_timestamp || eventTimestampMs.toString();

          // IMPORTANT: Fix the unlock timestamp calculation
          // If the original lock_end doesn't match expected duration, recalculate it
          let unlockTimestampSeconds = eventData.lock_end || "0";
          const expectedUnlockTimestampSeconds =
            Math.floor(parseInt(lockTimestamp) / 1000) +
            lockPeriod * 24 * 60 * 60;

          // Check if the unlock time is correct (should be lockPeriod days after lock time)
          const calculatedDurationDays =
            (parseInt(unlockTimestampSeconds) -
              Math.floor(parseInt(lockTimestamp) / 1000)) /
            (24 * 60 * 60);

          // If the duration is significantly different from lockPeriod, use our calculation
          if (Math.abs(calculatedDurationDays - lockPeriod) > 0.5) {
            console.log(
              `Fixing incorrect lock duration: ${calculatedDurationDays} days vs expected ${lockPeriod} days`
            );
            unlockTimestampSeconds = expectedUnlockTimestampSeconds.toString();
          }

          const unlockTimestampMs = (
            parseInt(unlockTimestampSeconds) * 1000
          ).toString();

          // The reference uses last_reward_time directly
          const lastRewardTime = eventData.last_reward_time;

          // Determine multiplier based on lock period
          let multiplier: number;
          let multiplierBasisPoints: number;
          let periodName: string;

          // Find matching lock period
          const periodObj = LOCK_PERIODS.find((p) => p.days === lockPeriod);

          if (periodObj) {
            multiplier = periodObj.multiplier / 100;
            multiplierBasisPoints = periodObj.basisPoints;
            periodName = periodObj.name;
          } else {
            // Default values if period not found
            switch (lockPeriod) {
              case 7:
                multiplier = 0.1;
                multiplierBasisPoints = 1000;
                periodName = "1 Week";
                break;
              case 30:
                multiplier = 0.25;
                multiplierBasisPoints = 2500;
                periodName = "1 Month";
                break;
              case 365:
                multiplier = 0.5;
                multiplierBasisPoints = 5000;
                periodName = "1 Year";
                break;
              case 5555:
                multiplier = 1.0;
                multiplierBasisPoints = 10000;
                periodName = "Infinity";
                break;
              default:
                multiplier = 0.1;
                multiplierBasisPoints = 1000;
                periodName = `${lockPeriod} days`;
            }
          }

          // Calculate weighted amount (amount * multiplier / BASIS_POINTS)
          const weightedAmount =
            (BigInt(amount) * BigInt(multiplierBasisPoints)) /
            BigInt(BASIS_POINTS);

          // Format dates to match reference implementation format
          // Reference uses DD/MM/YYYY format for lockEndDate
          const lockDate = new Date(parseInt(lockTimestamp));

          // Use milliseconds timestamp for unlockDate
          const unlockDate = new Date(parseInt(unlockTimestampMs));

          // Use the same date format as the reference implementation
          const lockDateFormatted = lockDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          // Reference uses DD/MM/YYYY format for lockEndDate
          const unlockDateFormatted = unlockDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          // Calculate if unlockable - reference implementation compares with current time
          // Use milliseconds timestamp for comparison
          const isUnlockable = currentTime >= parseInt(unlockTimestampMs);

          // Calculate daysRemaining just like reference implementation
          const timeRemaining = Math.max(
            0,
            parseInt(unlockTimestampMs) - currentTime
          );
          const daysRemaining = Math.ceil(
            timeRemaining / (24 * 60 * 60 * 1000)
          );

          // Calculate duration in days (total lock period)
          // Use milliseconds for both timestamps
          const durationDays = Math.floor(
            (parseInt(unlockTimestampMs) - parseInt(lockTimestamp)) /
              (1000 * 60 * 60 * 24)
          );

          // Format the lastRewardTime the same way reference does
          const lastRewardDate = lastRewardTime
            ? new Date(parseInt(lastRewardTime)).toLocaleDateString()
            : "N/A";

          // Format amount with proper decimals
          const amountFormatted = formatBalance(
            amount,
            CONSTANTS.DECIMALS.VICTORY
          );

          // Create a structure that includes both our enhanced fields and the reference implementation fields
          return {
            // Our enhanced version fields
            id,
            amount,
            amountFormatted,
            lockTimestamp,
            lockDateFormatted,
            unlockTimestamp: unlockTimestampMs, // Use milliseconds version
            unlockDateFormatted,
            durationDays,
            isUnlockable,
            bonusMultiplier: multiplier,
            multiplierBasisPoints,
            weightedAmount: weightedAmount.toString(),
            periodName,
            lastRewardTime,

            // Reference implementation fields (for compatibility)
            canUnlock: isUnlockable,
            daysRemaining,
            formattedMultiplier: `${(multiplier * 100).toFixed(2)}%`,
            lock_end: unlockTimestampSeconds, // Keep original seconds version
            lock_period: lockPeriod.toString(),
            multiplier: multiplierBasisPoints,
            weighted_amount: weightedAmount.toString(),
            eventId: event.id,
            createdAt: parseInt(lockTimestamp),
            lockEndDate: unlockDateFormatted,
            lastRewardDate,
          };
        });

      // Sort locks by creation timestamp (newest first) to match reference implementation
      const sortedLocks = locks.sort((a, b) => b.createdAt - a.createdAt);

      console.log("Processed locks from events:", sortedLocks);
      setUserLocks(sortedLocks);

      // Calculate APR values
      calculateAPRs();

      // Update parent component if callback exists
      if (onLockUpdate) {
        onLockUpdate(sortedLocks);
      }
    } catch (error) {
      console.error("Error loading user locks from events:", error);
      setError("Failed to load user locks data");
      setUserLocks([]);

      // Update parent with empty array
      if (onLockUpdate) {
        onLockUpdate([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available VICTORY balance
  const fetchAvailableBalance = async () => {
    if (!connected || !account?.address) return;

    try {
      // Get user's VICTORY tokens
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: CONSTANTS.VICTORY_TOKEN.TYPE,
      });

      // Calculate total balance
      const totalBalance = coins.data.reduce(
        (sum, coin) => sum + BigInt(coin.balance || 0),
        BigInt(0)
      );

      setAvailableBalance(
        formatBalance(totalBalance.toString(), CONSTANTS.DECIMALS.VICTORY)
      );
    } catch (error) {
      console.error("Error fetching VICTORY balance:", error);
    }
  };

  // Calculate lock amount based on percentage
  useEffect(() => {
    if (availableBalance) {
      const cleanBalance = availableBalance.replace(/,/g, "");
      const amount = (parseFloat(cleanBalance) * lockPercentage) / 100;
      setLockAmount(amount.toString());
    }
  }, [lockPercentage, availableBalance]);

  // Fetch data when component mounts or account changes
  useEffect(() => {
    if (connected && account?.address) {
      loadVictoryTokenMetadata();
      loadUserLocksFromEvents();
      fetchAvailableBalance();
      calculateAPRs(); // Initialize APR values
    } else {
      setIsLoading(false);
    }
  }, [connected, account?.address]);

  // Utility function to find optimal coins
  function findOptimalCoins(coins: any[], amount: string) {
    // Sort coins by balance (descending)
    const sortedCoins = [...coins].sort((a, b) =>
      BigInt(b.balance) > BigInt(a.balance) ? 1 : -1
    );

    let remaining = BigInt(amount);
    const selectedCoins = [];

    // First try to find a single coin with enough balance
    const singleCoin = sortedCoins.find(
      (coin) => BigInt(coin.balance) >= remaining
    );
    if (singleCoin) {
      return [singleCoin];
    }

    // Otherwise, collect coins until we have enough
    for (const coin of sortedCoins) {
      if (remaining <= BigInt(0)) break;

      selectedCoins.push(coin);
      remaining -= BigInt(coin.balance);
    }

    // Check if we found enough coins
    if (remaining > BigInt(0)) {
      return []; // Not enough balance
    }

    return selectedCoins;
  }

  // Unlock handler
  const handleUnlock = async (lock: LockPosition) => {
    if (!connected || !account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!lock.isUnlockable) {
      toast.error("This lock is not yet unlockable");
      return;
    }

    setIsUnlockLoading(true);
    setCurrentlyProcessingId(lock.id);
    const toastId = toast.loading("Processing unlock...");

    try {
      const tx = new TransactionBlock();

      // Get the clock object
      const clockObject = tx.object(CONSTANTS.CLOCK_ID);

      // Build the unlock_tokens transaction
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.TOKEN_LOCKER}::unlock_tokens`,
        arguments: [
          tx.object(CONSTANTS.TOKEN_LOCKER_ID),
          tx.pure.u64(lock.id),
          clockObject,
        ],
      });

      // Execute transaction
      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
      });

      console.log("Unlock transaction result:", result);

      // Remove the lock from the list
      setUserLocks(userLocks.filter((l) => l.id !== lock.id));

      // Update parent component if callback exists
      if (onLockUpdate) {
        onLockUpdate(userLocks.filter((l) => l.id !== lock.id));
      }

      toast.success(`Successfully unlocked ${lock.amountFormatted} VICTORY`, {
        id: toastId,
      });

      // Update available balance and stats
      setTimeout(() => {
        fetchAvailableBalance();
        loadUserLocksFromEvents();
      }, 2000);
    } catch (error: any) {
      console.error("Error unlocking tokens:", error);
      toast.error(`Failed to unlock: ${error.message}`, { id: toastId });
    } finally {
      setIsUnlockLoading(false);
      setCurrentlyProcessingId(null);
    }
  };

  // Lock tokens handler
  const handleLockTokens = async () => {
    if (!connected || !account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!lockAmount || parseFloat(lockAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (
      parseFloat(lockAmount) > parseFloat(availableBalance.replace(/,/g, ""))
    ) {
      toast.error("Insufficient balance");
      return;
    }

    setIsLockLoading(true);
    const toastId = toast.loading("Processing lock...");

    try {
      // Convert amount to the correct decimals
      const amountRaw = BigInt(
        Math.floor(
          parseFloat(lockAmount) * Math.pow(10, CONSTANTS.DECIMALS.VICTORY)
        )
      ).toString();

      // Get coins to use for locking
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: CONSTANTS.VICTORY_TOKEN.TYPE,
      });

      if (coins.data.length === 0) {
        throw new Error("No VICTORY tokens found");
      }

      const targetAmount = BigInt(amountRaw);
      const tx = new TransactionBlock();

      // Find optimal coins
      const optimalCoins = findOptimalCoins(coins.data, amountRaw);

      if (optimalCoins.length === 0) {
        throw new Error("Not enough balance to lock this amount");
      }

      let coinToUse;

      if (optimalCoins.length === 1) {
        // If we only need one coin
        const singleCoin = optimalCoins[0];
        const singleCoinBalance = BigInt(singleCoin.balance);

        const coinObject = tx.object(singleCoin.coinObjectId);

        // If the coin has exactly what we need, use it directly
        // Otherwise split it to get the exact amount
        if (singleCoinBalance === targetAmount) {
          coinToUse = coinObject;
        } else {
          coinToUse = tx.splitCoins(coinObject, [
            tx.pure.u64(targetAmount.toString()),
          ])[0];
        }
      } else {
        // We need multiple coins
        // First merge all coins into the first one
        const primaryCoin = tx.object(optimalCoins[0].coinObjectId);
        const otherCoins = optimalCoins
          .slice(1)
          .map((coin) => tx.object(coin.coinObjectId));

        tx.mergeCoins(primaryCoin, otherCoins);

        // Calculate total balance of all selected coins
        const totalSelected = optimalCoins.reduce(
          (sum, coin) => sum + BigInt(coin.balance),
          BigInt(0)
        );

        // If total is more than needed, split to get exact amount
        if (totalSelected > targetAmount) {
          coinToUse = tx.splitCoins(primaryCoin, [
            tx.pure.u64(targetAmount.toString()),
          ])[0];
        } else {
          coinToUse = primaryCoin;
        }
      }

      // Get the clock object
      const clockObject = tx.object(CONSTANTS.CLOCK_ID);

      // Build the lock_tokens transaction
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.TOKEN_LOCKER}::lock_tokens`,
        arguments: [
          tx.object(CONSTANTS.TOKEN_LOCKER_ID),
          coinToUse,
          tx.pure.u64(selectedLockPeriod.days.toString()),
          clockObject,
        ],
      });

      // Execute transaction
      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
      });

      console.log("Lock transaction result:", result);

      // Reset form
      setLockAmount("");
      setActiveTab("userLocks");

      toast.success(
        `Successfully locked ${lockAmount} VICTORY for ${selectedLockPeriod.name}`,
        { id: toastId }
      );

      // Refresh data
      setTimeout(() => {
        loadUserLocksFromEvents();
        fetchAvailableBalance();
      }, 2000);
    } catch (error: any) {
      console.error("Error locking tokens:", error);
      toast.error(`Failed to lock: ${error.message}`, { id: toastId });
    } finally {
      setIsLockLoading(false);
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    loadUserLocksFromEvents();
    fetchAvailableBalance();
  };

  if (!connected) {
    return (
      <div className="card-bg-premium rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaLock className="text-yellow-400" />
            <span className="text-shimmer-gold">VICTORY Token Locker</span>
          </h2>
        </div>

        <div className="text-center py-12 bg-blue-900/20 rounded-xl">
          <FaInfoCircle className="text-yellow-400 text-4xl mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-blue-300 max-w-md mx-auto mb-6">
            Please connect your wallet to view and manage your locked tokens.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-bg-premium rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaLock className="text-yellow-400" />
            <span className="text-shimmer-gold">VICTORY Token Locker</span>
          </h2>
        </div>

        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-blue-900/30 rounded-xl w-full"></div>
          <div className="h-64 bg-blue-900/30 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-bg-premium rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaLock className="text-yellow-400" />
            <span className="text-shimmer-gold">VICTORY Token Locker</span>
          </h2>
        </div>

        <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-6 py-4 rounded-xl">
          <p className="flex items-center gap-2">
            <FaInfoCircle />
            <span>{error}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-bg-premium rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaLock className="text-yellow-400" />
            <span className="text-shimmer-gold">VICTORY Token Locker</span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex border-b border-blue-800/50">
            <button
              onClick={() => setActiveTab("lock")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "lock"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaLock className="text-sm" />
                <span>Lock Tokens</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("userLocks")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "userLocks"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaLock className="text-sm" />
                <span>Your Locks</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "stats"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaChartLine className="text-sm" />
                <span>Stats</span>
              </div>
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading || isUnlockLoading || isLockLoading}
            className="bg-blue-800/60 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <FaSyncAlt className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Token locker overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Your VICTORY Balance"
          value={`${availableBalance}`}
          icon={FaCoins}
          colorClass="bg-yellow-600"
        />
        <StatsCard
          title="Total Locked VICTORY"
          value={formatBalance(totalLockedTokens, CONSTANTS.DECIMALS.VICTORY)}
          icon={FaLock}
          colorClass="bg-yellow-600"
        />
        <StatsCard
          title="Your Active Locks"
          value={userLocks.length}
          icon={FaCheckCircle}
          colorClass="bg-green-600"
        />
      </div>

      {/* Lock Tokens Tab */}
      {activeTab === "lock" && (
        <div className="space-y-6">
          <div className="bg-blue-900/30 p-4 rounded-xl border border-yellow-800/30">
            <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
              <FaLock className="text-yellow-400" />
              Lock VICTORY Tokens
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-blue-300 text-sm block mb-2">
                  Amount to Lock
                </label>

                {/* Percentage selection */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setLockPercentage(percent)}
                      className={`py-2 rounded-lg text-sm transition-colors ${
                        lockPercentage === percent
                          ? "bg-yellow-600 text-white"
                          : "bg-blue-800/50 text-blue-300 hover:bg-blue-700"
                      }`}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>

                <div className="flex">
                  <input
                    type="number"
                    value={lockAmount}
                    onChange={(e) => setLockAmount(e.target.value)}
                    placeholder="Enter amount to lock"
                    className="w-full bg-blue-900/60 border border-blue-800 rounded-l-lg p-3 text-white focus:outline-none focus:border-yellow-500"
                  />
                  <div className="bg-blue-800 px-3 flex items-center rounded-r-lg">
                    <span className="text-blue-300">VICTORY</span>
                  </div>
                </div>
                <p className="text-blue-300 text-xs mt-1">
                  Available: {availableBalance} VICTORY
                </p>
              </div>

              <div>
                <label className="text-blue-300 text-sm block mb-2">
                  Lock Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LOCK_PERIODS.map((period) => (
                    <button
                      key={period.days}
                      onClick={() => setSelectedLockPeriod(period)}
                      className={`p-3 rounded-lg text-sm transition-colors ${
                        selectedLockPeriod.days === period.days
                          ? "bg-yellow-600 text-white"
                          : "bg-blue-800/50 text-blue-300 hover:bg-blue-700"
                      }`}
                    >
                      <div className="font-medium">{period.name}</div>
                      <div className="mt-1 text-xs">
                        APR: {calculatedAPR[period.days] || period.multiplier}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-900/40 p-3 rounded-lg mb-4">
              <p className="text-blue-300 text-sm">
                <FaInfoCircle className="inline-block mr-2 text-yellow-400" />
                Locking your tokens increases your staking power. Longer lock
                periods provide higher multipliers for farms and staking
                rewards.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleLockTokens}
                disabled={
                  isLockLoading || !lockAmount || parseFloat(lockAmount) <= 0
                }
                className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-yellow-700 transition-colors"
              >
                {isLockLoading ? (
                  <>
                    <FaCircleNotch className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FaLock />
                    <span>Lock Tokens</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Locks Tab */}
      {activeTab === "userLocks" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Your Active Locks
          </h3>

          {userLocks.length === 0 ? (
            <div className="bg-blue-900/20 p-8 rounded-xl text-center">
              <FaSadTear className="text-yellow-400 text-4xl mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                No Locked Tokens Found
              </h3>
              <p className="text-blue-300 max-w-md mx-auto mb-6">
                You don't have any active token locks. Locking your tokens
                provides staking multipliers and other benefits.
              </p>
              <button
                onClick={() => setActiveTab("lock")}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mx-auto flex items-center gap-2"
              >
                <FaLock />
                <span>Create Your First Lock</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Locks summary */}
              <div className="bg-blue-900/30 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-blue-300">Total Locked Tokens</p>
                    <p className="text-2xl font-dela text-yellow-400">
                      {userLocks
                        .reduce((total, lock) => {
                          return (
                            total +
                            parseFloat(lock.amountFormatted.replace(/,/g, ""))
                          );
                        }, 0)
                        .toLocaleString()}{" "}
                      VICTORY
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300">Active Locks</p>
                    <p className="text-2xl font-dela text-white">
                      {userLocks.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300">Ready to Unlock</p>
                    <p className="text-2xl font-dela text-green-400">
                      {userLocks.filter((lock) => lock.isUnlockable).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Locks list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userLocks.map((lock) => (
                  <LockCard
                    key={lock.id}
                    lock={lock}
                    onUnlock={handleUnlock}
                    isUnlockLoading={isUnlockLoading}
                    currentlyProcessing={currentlyProcessingId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Lock Period Comparison */}
          <div className="card-bg-premium rounded-lg p-4">
            <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
              <FaChartLine className="text-yellow-400" />
              Lock Period Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-800/30">
                    <th className="p-2 text-left text-blue-300">Lock Period</th>
                    <th className="p-2 text-left text-blue-300">Multiplier</th>
                    <th className="p-2 text-left text-blue-300">
                      Estimated APR
                    </th>
                    <th className="p-2 text-left text-blue-300">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {LOCK_PERIODS.map((period) => (
                    <tr
                      key={period.days}
                      className="border-b border-blue-800/20"
                    >
                      <td className="p-2 text-white">{period.name}</td>
                      <td className="p-2 text-yellow-400">
                        {period.multiplier}%
                      </td>
                      <td className="p-2 text-green-400">
                        {calculatedAPR[period.days] || period.multiplier}%
                      </td>
                      <td className="p-2 text-blue-200">
                        {period.days === 5555
                          ? "Permanent lock for maximum benefits"
                          : `Lock tokens for ${period.days} days to earn ${period.multiplier}% boost`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* How it works */}
          <div className="card-bg-premium rounded-lg p-4">
            <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
              <FaRegQuestionCircle className="text-yellow-400" />
              How Token Locking Works
            </h3>

            <div className="bg-blue-900/30 p-4 rounded-lg">
              <ul className="space-y-2 text-blue-200">
                <li className="flex items-start gap-2">
                  <FaLock className="text-yellow-400 mt-1" />
                  <span>
                    Lock your VICTORY tokens for different time periods to
                    increase your staking power.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <FaChartLine className="text-green-400 mt-1" />
                  <span>
                    Longer lock periods provide higher multipliers, boosting
                    your farming yields.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <FaExchangeAlt className="text-yellow-400 mt-1" />
                  <span>
                    40% of all farm deposit and withdrawal fees go to token
                    locker rewards.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <FaUnlock className="text-blue-400 mt-1" />
                  <span>
                    Once the lock period ends, you can unlock your tokens and
                    claim accumulated rewards.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Global Stats */}
          <div className="card-bg-premium rounded-lg p-4">
            <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
              <FaInfoCircle className="text-blue-400" />
              Global Locker Statistics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <p className="text-blue-300 mb-1">Total VICTORY Locked</p>
                <p className="text-2xl font-dela text-white">
                  {formatBalance(totalLockedTokens, CONSTANTS.DECIMALS.VICTORY)}
                </p>
                <p className="text-blue-300 text-sm mt-2">
                  Across all users in the protocol
                </p>
              </div>
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <p className="text-blue-300 mb-1">Available SUI Rewards</p>
                <p className="text-2xl font-dela text-white">
                  {formatBalance(totalSuiRewards, CONSTANTS.DECIMALS.SUI)}
                </p>
                <p className="text-blue-300 text-sm mt-2">
                  SUI rewards for lockers
                </p>
              </div>
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <p className="text-blue-300 mb-1">Total Participants</p>
                <p className="text-2xl font-dela text-white">
                  {totalUsers.toLocaleString()}
                </p>
                <p className="text-blue-300 text-sm mt-2">
                  Users with active locks
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
        <div className="flex items-center gap-2 mb-2">
          <FaInfoCircle className="text-yellow-400" />
          <h3 className="text-white font-medium">About Token Locking</h3>
        </div>
        <p className="text-blue-300 text-sm">
          Locking your VICTORY tokens provides multipliers for your staking
          rewards. Longer lock periods offer higher multipliers, boosting your
          farming yields. Once locked, tokens cannot be accessed until the lock
          period ends.
        </p>
      </div>
    </div>
  );
};

export default TokenLockerComponent;
