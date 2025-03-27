import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { Link } from "react-router-dom";
import { suiClient } from "../../utils/suiClient";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CONSTANTS, bpsToPercentage } from "../../constants/addresses";
import {
  FaTractor,
  FaChartLine,
  FaCoins,
  FaExchangeAlt,
  FaFilter,
  FaSearch,
  FaInfoCircle,
  FaArrowRight,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaStar,
  FaSyncAlt,
  FaExclamationCircle,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import { toast } from "sonner";
import { PoolDetailsModal } from "./PoolDetailsModal";

interface PoolListProps {
  calculateAPR?: Function;
  onPoolDataLoaded?: (
    totalPools: number,
    lpPools: number,
    singleAssetPools: number
  ) => void;
}

interface PoolType {
  displayName: string;
  isLp: boolean;
  typeString: string;
  tokens: string[];
  eventData?: any;
  allocationPoints?: number;
  totalStaked?: string;
  apr?: number;
  depositFee?: number;
  withdrawalFee?: number;
  active?: boolean;
}

// Define interface for parsed event data
interface PoolCreatedEvent {
  pool_type: any;
  allocation_points: number;
  deposit_fee: number;
  withdrawal_fee: number;
  is_native_pair: boolean;
  is_lp_token: boolean;
}

// Type for pool type object
interface PoolTypeObject {
  name?: string;
  module?: {
    name: string;
  };
  address?: string;
  [key: string]: any;
}

// Exponential backoff retry function
const retry = async <T,>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let retries = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay =
        baseDelay * Math.pow(2, retries) * (0.8 + Math.random() * 0.4);
      console.log(`Retry ${retries} after ${delay.toFixed(0)}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Helper function to convert byte array to readable string
const byteArrayToString = (byteArray: any): string => {
  if (!Array.isArray(byteArray)) {
    console.log("Not an array in byteArrayToString");
    return "Unknown";
  }

  try {
    // For TypeName objects with name property
    if (
      byteArray.length > 0 &&
      typeof byteArray[0] === "object" &&
      byteArray[0] !== null &&
      "name" in byteArray[0]
    ) {
      return byteArray.map((item: any) => item.name).join("::");
    }

    // Special case for TypeName vector
    if (
      JSON.stringify(byteArray).includes("type_name") &&
      JSON.stringify(byteArray).includes("TypeName")
    ) {
      return "vector<0x1::type_name::TypeName>";
    }

    // Check if the array is already characters
    const allStrings = byteArray.every(
      (b: any) => typeof b === "string" && b.length === 1
    );
    if (allStrings) {
      return byteArray.join("");
    }

    // Process as character codes
    let result = "";
    for (let i = 0; i < byteArray.length; i++) {
      if (typeof byteArray[i] === "number") {
        result += String.fromCharCode(byteArray[i]);
      } else {
        result += String(byteArray[i]);
      }
    }

    return result;
  } catch (e) {
    console.error("Error processing byte array:", e);
    return JSON.stringify(byteArray);
  }
};

// Extract a clean token name from a fully qualified type
const extractTokenName = (typeString: string): string => {
  // Check if it's a SUI token
  if (typeString.includes("::sui::SUI")) {
    return "SUI";
  }

  // Check for STK pattern
  const stkMatch = typeString.match(/::STK(\d+)::STK\d+/);
  if (stkMatch) {
    return `STK${stkMatch[1]}`;
  }

  // Extract token name from module path (address::module::TokenName)
  const parts = typeString.trim().split("::");
  if (parts.length >= 3) {
    return parts[parts.length - 1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return "Unknown";
};

// Extract LP tokens from a type string using regex patterns
const extractLpTokens = (typeString: string): any => {
  const lpTokens: any[] = [];

  // Match LP tokens with pattern: address::pair::LPCoin<Token1, Token2>
  const lpRegex = /([0-9a-f]{64})::pair::LPCoin<([^,]+),\s*([^>]+)>/g;
  let match;

  while ((match = lpRegex.exec(typeString)) !== null) {
    const token1 = extractTokenName(match[2]);
    const token2 = extractTokenName(match[3]);

    // Create consistent display name
    let displayName;
    if (token2 === "SUI") {
      displayName = `${token1}-SUI LP`;
    } else if (token1 === "SUI") {
      displayName = `SUI-${token2} LP`;
    } else {
      // For non-SUI pairs, sort alphabetically
      const tokens = [token1, token2].sort();
      displayName = `${tokens[0]}-${tokens[1]} LP`;
    }

    lpTokens.push({
      displayName,
      isLp: true,
      typeString: match[0],
      tokens: [token1, token2],
    });
  }

  return lpTokens;
};

// Helper: Get simplified token name from type
const getSimplifiedName = (type: string): string => {
  const parts = type.split("::");
  return parts.length >= 3 ? parts[2] : type;
};

// Helper: Parse u256 byte array without precision loss
const parseU256ByteArray = (byteArray: any): bigint => {
  if (!Array.isArray(byteArray) || byteArray.length === 0) {
    return BigInt(0);
  }

  // Convert to BigInt to handle large numbers properly
  let result = BigInt(0);
  let multiplier = BigInt(1);

  for (let i = 0; i < byteArray.length; i++) {
    if (typeof byteArray[i] === "number") {
      result += BigInt(byteArray[i]) * multiplier;
      multiplier *= BigInt(256);
    }
  }

  return result;
};

// Format percentage with 4 decimal places
const formatPercentage = (value: number): string => {
  return value.toFixed(4);
};

// Pool Card Component
const PoolCard = ({
  pool,
  calculateAPR,
  onShowDetails,
}: {
  pool: PoolType;
  calculateAPR?: Function;
  onShowDetails: (pool: PoolType) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate mock APR if not provided
  const apr = pool.apr || parseFloat((Math.random() * 100 + 28).toFixed(2));

  // Generate a linear gradient based on APR for visual indicator
  const getAPRGradient = (aprValue: number) => {
    // Map APR to hue value (green to red)
    const hue = Math.max(0, Math.min(120, 120 - (aprValue / 200) * 120));
    return `linear-gradient(to right, hsl(${hue}, 80%, 40%), hsl(${hue}, 80%, 60%))`;
  };

  // Format APR with 4 decimal places for display
  const formattedApr = formatPercentage(apr);

  return (
    <div className="card-bg-premium rounded-xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-blue-900/20">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/60 p-2 rounded-full">
              {pool.isLp ? (
                <FaExchangeAlt className="text-yellow-400 text-xl" />
              ) : (
                <FaCoins className="text-yellow-400 text-xl" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">
                {pool.displayName}
              </h3>
              <p className="text-blue-300 text-xs">
                {pool.isLp
                  ? `LP Token | ${pool.tokens.join(" - ")}`
                  : "Single Asset Token"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-dela text-yellow-400">
              {formattedApr}%
            </div>
            <p className="text-blue-300 text-xs">APR</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-2 flex-1 bg-blue-900/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                background: getAPRGradient(apr),
                width: `${Math.min(100, apr / 2)}%`,
              }}
            ></div>
          </div>
          {pool.active !== false ? (
            <div className="text-green-400 text-xs flex items-center gap-1">
              <FaCheck size={10} />
              <span>Active</span>
            </div>
          ) : (
            <div className="text-red-400 text-xs flex items-center gap-1">
              <FaExclamationCircle size={10} />
              <span>Inactive</span>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-900/20 rounded-lg p-2">
            <p className="text-blue-300 text-xs">Allocation Points</p>
            <p className="text-white font-medium">
              {pool.allocationPoints ||
                (pool.eventData?.allocationPoints
                  ? pool.eventData.allocationPoints
                  : "100")}
            </p>
          </div>
          <div className="bg-blue-900/20 rounded-lg p-2">
            <p className="text-blue-300 text-xs">Total Staked</p>
            <p className="text-white font-medium">
              {pool.totalStaked
                ? pool.totalStaked
                : pool.isLp
                ? "~$425,000"
                : "~$125,000"}
            </p>
          </div>
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-blue-200 text-sm hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          {isExpanded ? (
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
      {isExpanded && (
        <div className="bg-blue-900/30 p-5 border-t border-blue-800/50">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-blue-300 text-sm mb-1">Deposit Fee</p>
              <p className="text-white">
                {pool.depositFee !== undefined
                  ? formatPercentage(pool.depositFee) + "%"
                  : "0.5000%"}
              </p>
            </div>
            <div>
              <p className="text-blue-300 text-sm mb-1">Withdrawal Fee</p>
              <p className="text-white">
                {pool.withdrawalFee !== undefined
                  ? formatPercentage(pool.withdrawalFee) + "%"
                  : "0.5000%"}
              </p>
            </div>
            <div>
              <p className="text-blue-300 text-sm mb-1">Token Type</p>
              <p className="text-white">
                {pool.isLp ? "LP Token" : "Single Token"}
              </p>
            </div>
            <div>
              <p className="text-blue-300 text-sm mb-1">Daily Rewards</p>
              <p className="text-white">
                ~{((apr * 100) / 365).toFixed(4)} VICTORY
              </p>
            </div>
          </div>

          {/* Advanced Token Info */}
          <div className="bg-blue-900/40 rounded-lg p-3 mb-4">
            <p className="text-blue-300 text-xs mb-1">Token Type String</p>
            <p className="text-white text-xs break-all">{pool.typeString}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onShowDetails(pool)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2"
            >
              <FaInfoCircle />
              <span>Details</span>
            </button>
            <Link
              to={`/pool/${encodeURIComponent(pool.typeString)}`}
              className="flex-1"
            >
              <button className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2">
                <FaTractor />
                <span>Farm</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const EventBasedPoolListComponent: React.FC<PoolListProps> = ({
  calculateAPR,
  onPoolDataLoaded,
}) => {
  console.log(
    "EventBasedPoolListComponent rendering with onPoolDataLoaded:",
    !!onPoolDataLoaded
  );

  const [isLoading, setIsLoading] = useState(true);
  const [poolEvents, setPoolEvents] = useState<any[]>([]);
  const [poolList, setPoolList] = useState<PoolType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [sortBy, setSortBy] = useState("apr"); // 'apr', 'allocation', 'tvl'
  const [sortDirection, setSortDirection] = useState("desc"); // 'asc', 'desc'
  const [filterType, setFilterType] = useState("all"); // 'all', 'lp', 'single'
  const hasReportedDataRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { connected, account } = useWallet();

  // Process pool type data to create consistent display objects
  const processPoolType = (
    poolType: any,
    isLpToken: boolean,
    isNativePair: boolean
  ): any => {
    let typeString = "";

    // Convert pool type to string format
    if (typeof poolType === "string") {
      typeString = poolType;
    } else if (Array.isArray(poolType)) {
      typeString = byteArrayToString(poolType);
    } else if (poolType && typeof poolType === "object") {
      const poolTypeObj = poolType as PoolTypeObject;
      if ("name" in poolTypeObj && poolTypeObj.name) {
        typeString = poolTypeObj.name;
      } else if (
        "module" in poolTypeObj &&
        poolTypeObj.module &&
        "name" in poolTypeObj.module &&
        poolTypeObj.module.name &&
        "name" in poolTypeObj &&
        poolTypeObj.name
      ) {
        typeString = `${poolTypeObj.address}::${poolTypeObj.module.name}::${poolTypeObj.name}`;
      } else {
        typeString = JSON.stringify(poolType);
      }
    }

    // Handle LP tokens
    if (isLpToken) {
      const lpMatches = extractLpTokens(typeString);
      if (lpMatches.length > 0) {
        return lpMatches[0];
      }
    }

    // Handle single asset tokens
    const tokenName = extractTokenName(typeString);
    return {
      displayName: tokenName,
      isLp: false,
      typeString: typeString,
      tokens: [tokenName],
    };
  };

  // Report pool counts to parent component when data is available
  const reportPoolCounts = useCallback(() => {
    // Group pools by type first to ensure we have accurate counts
    const lpPools = poolList.filter((p) => p.isLp);
    const singleAssetPools = poolList.filter((p) => !p.isLp);
    const totalPools = poolList.length;

    if (onPoolDataLoaded && totalPools > 0 && !hasReportedDataRef.current) {
      console.log("Reporting pool counts to parent component:", {
        totalPools,
        lpPools: lpPools.length,
        singleAssetPools: singleAssetPools.length,
      });

      onPoolDataLoaded(totalPools, lpPools.length, singleAssetPools.length);

      hasReportedDataRef.current = true;
    }
  }, [poolList, onPoolDataLoaded]);

  // Simplified function to open pool details modal
  const openPoolDetails = (pool: PoolType) => {
    setSelectedPool(pool);
    setIsModalOpen(true);
  };

  // Updated fetch pool events function with abort controller and retry
  const fetchPoolEvents = async () => {
    if (!account?.address) return;

    // Cancel any in-progress requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    hasReportedDataRef.current = false; // Reset when fetching new data

    try {
      console.log("Fetching PoolCreated events...");

      // Added a small delay to avoid race conditions
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use retry mechanism for better reliability
      const events = await retry(
        async () => {
          // Query PoolCreated events from the blockchain
          return await suiClient.queryEvents({
            query: {
              MoveEventType: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::PoolCreated`,
            },
            limit: 50, // Adjust as needed
          });
        },
        3,
        1000
      );

      console.log("Pool events response:", events);

      if (events && events.data && events.data.length > 0) {
        console.log(`Found ${events.data.length} PoolCreated events`);

        // Process events
        const processedEvents = events.data.map((event) => {
          // Cast to the expected type to avoid TypeScript errors
          const parsedEvent = event.parsedJson as PoolCreatedEvent;
          console.log("Parsed event:", parsedEvent);

          return {
            poolType: parsedEvent.pool_type,
            allocationPoints: parsedEvent.allocation_points,
            depositFee: parsedEvent.deposit_fee,
            withdrawalFee: parsedEvent.withdrawal_fee,
            isNativePair: parsedEvent.is_native_pair,
            isLpToken: parsedEvent.is_lp_token,
          };
        });

        setPoolEvents(processedEvents);

        // Process events into pool list format
        const processedPools: PoolType[] = [];
        const poolSet = new Set();

        for (const event of processedEvents) {
          const poolInfo = processPoolType(
            event.poolType,
            event.isLpToken,
            event.isNativePair
          );

          // Check for duplicates
          const poolKey = poolInfo.isLp
            ? `LP:${poolInfo.tokens.sort().join("-")}`
            : `Single:${poolInfo.tokens[0]}`;

          if (!poolSet.has(poolKey)) {
            poolSet.add(poolKey);

            // Convert basis points to percentages with 4 decimal places
            const depositFee = event.depositFee
              ? bpsToPercentage(event.depositFee)
              : 0.5;
            const withdrawalFee = event.withdrawalFee
              ? bpsToPercentage(event.withdrawalFee)
              : 0.5;

            // Get pool details for each pool
            const poolWithDetails: PoolType = {
              ...poolInfo,
              eventData: event,
              allocationPoints: Number(event.allocationPoints),
              depositFee,
              withdrawalFee,
              active: true, // Default to active
              // Set a reasonable default APR based on pool type with 4 decimal places
              apr: parseFloat(
                formatPercentage(
                  poolInfo.isLp
                    ? poolInfo.tokens.includes("SUI")
                      ? 85 + Math.random() * 40
                      : 65 + Math.random() * 25
                    : poolInfo.tokens[0] === "SUI"
                    ? 45 + Math.random() * 20
                    : 30 + Math.random() * 15
                )
              ),
            };

            processedPools.push(poolWithDetails);
            console.log(`Added pool from event: ${poolInfo.displayName}`);
          }
        }

        setPoolList(processedPools);
        console.log(
          `Processed ${processedPools.length} unique pools from events`
        );

        // Report pool counts immediately after setting pool list
        setTimeout(() => {
          const lpCount = processedPools.filter((p) => p.isLp).length;
          const singleCount = processedPools.filter((p) => !p.isLp).length;

          if (onPoolDataLoaded) {
            console.log("Immediate report of pool counts:", {
              total: processedPools.length,
              lp: lpCount,
              single: singleCount,
            });

            onPoolDataLoaded(processedPools.length, lpCount, singleCount);

            hasReportedDataRef.current = true;
          }
        }, 100);
      } else {
        console.log(
          "No PoolCreated events found, falling back to pool list API"
        );
        // Fallback to the original fetching method
        fetchPoolList();
      }
    } catch (error: any) {
      console.error("Error fetching pool events:", error);
      setError(`Failed to load pool events: ${error.message}`);
      // Fallback to the original method
      fetchPoolList();
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Original pool list fetch method as fallback with retry logic
  const fetchPoolList = async () => {
    if (!account?.address) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Falling back to fetching pool list from blockchain...");

      // Use retry for better reliability
      await retry(
        async () => {
          const tx = new TransactionBlock();
          tx.moveCall({
            target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::get_pool_list`,
            arguments: [tx.object(CONSTANTS.FARM_ID)],
          });

          const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: tx as any,
            sender: account.address,
          });

          if (result?.results?.[0]?.returnValues?.[0]) {
            // Extract the pool list from the response
            const rawPoolList = result.results[0].returnValues[0];

            if (Array.isArray(rawPoolList)) {
              console.log(`Raw pool list length: ${rawPoolList.length}`);

              // Process raw pool list
              const processedPools: PoolType[] = [];
              const typeSet = new Set();

              for (let i = 0; i < rawPoolList.length; i++) {
                const poolType = rawPoolList[i];
                let typeString = "";

                // Convert pool type to string format
                if (typeof poolType === "string") {
                  typeString = poolType;
                } else if (Array.isArray(poolType)) {
                  typeString = byteArrayToString(poolType);
                } else if (poolType && typeof poolType === "object") {
                  const poolTypeObj = poolType as PoolTypeObject;
                  if ("name" in poolTypeObj && poolTypeObj.name) {
                    typeString = poolTypeObj.name;
                  } else if (
                    "module" in poolTypeObj &&
                    poolTypeObj.module &&
                    "name" in poolTypeObj.module &&
                    poolTypeObj.module.name &&
                    "name" in poolTypeObj &&
                    poolTypeObj.name
                  ) {
                    typeString = `${poolTypeObj.address}::${poolTypeObj.module.name}::${poolTypeObj.name}`;
                  } else {
                    typeString = JSON.stringify(poolType);
                  }
                }

                // Skip TypeName vector
                if (
                  typeString.includes("vector<") &&
                  typeString.includes("TypeName")
                ) {
                  continue;
                }

                // Check if it's an LP token
                const isLp = typeString.includes("::pair::LPCoin<");
                let tokens: string[] = [];
                let displayName: string;

                if (isLp) {
                  // Process LP tokens
                  const lpMatches = extractLpTokens(typeString);
                  for (const match of lpMatches) {
                    const poolKey = `LP:${match.tokens.sort().join("-")}`;
                    if (!typeSet.has(poolKey)) {
                      typeSet.add(poolKey);
                      // Set default APR and fees with 4 decimal places
                      const apr = parseFloat(
                        formatPercentage(
                          match.tokens.includes("SUI")
                            ? 85 + Math.random() * 40
                            : 65 + Math.random() * 25
                        )
                      );
                      processedPools.push({
                        ...match,
                        apr,
                        depositFee: 0.5,
                        withdrawalFee: 0.5,
                        active: true,
                      });
                    }
                  }
                } else {
                  // Handle single asset token
                  const tokenName = extractTokenName(typeString);
                  displayName = tokenName;
                  tokens = [tokenName];

                  const poolKey = `Single:${tokenName}`;
                  if (!typeSet.has(poolKey)) {
                    typeSet.add(poolKey);
                    // Set default APR and fees with 4 decimal places
                    const apr = parseFloat(
                      formatPercentage(
                        tokenName === "SUI"
                          ? 45 + Math.random() * 20
                          : 30 + Math.random() * 15
                      )
                    );
                    processedPools.push({
                      displayName,
                      isLp: false,
                      typeString,
                      tokens,
                      apr,
                      depositFee: 0.5,
                      withdrawalFee: 0.5,
                      active: true,
                    });
                  }
                }
              }

              // Add hardcoded single asset tokens if list is still empty
              if (processedPools.length === 0) {
                // Hardcoded single asset token types as fallback
                const HARDCODED_SINGLE_ASSET_TOKENS = [
                  {
                    name: "SUI",
                    fullTypeString:
                      "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
                  },
                  {
                    name: "VICTORY",
                    fullTypeString: CONSTANTS.VICTORY_TOKEN.TYPE,
                  },
                ];

                for (const token of HARDCODED_SINGLE_ASSET_TOKENS) {
                  // Format APR with 4 decimal places
                  const apr = parseFloat(
                    formatPercentage(token.name === "SUI" ? 45 : 30)
                  );
                  processedPools.push({
                    displayName: token.name,
                    isLp: false,
                    typeString: token.fullTypeString,
                    tokens: [token.name],
                    apr,
                    depositFee: 0.5,
                    withdrawalFee: 0.5,
                    active: true,
                  });
                }
              }

              setPoolList(processedPools);
              console.log(
                `Processed ${processedPools.length} pools from fallback method`
              );

              // Report pool counts for fallback method too
              setTimeout(() => {
                const lpCount = processedPools.filter((p) => p.isLp).length;
                const singleCount = processedPools.filter(
                  (p) => !p.isLp
                ).length;

                if (onPoolDataLoaded) {
                  console.log("Fallback method reporting pool counts:", {
                    total: processedPools.length,
                    lp: lpCount,
                    single: singleCount,
                  });

                  onPoolDataLoaded(processedPools.length, lpCount, singleCount);

                  hasReportedDataRef.current = true;
                }
              }, 100);
            } else {
              console.log("Raw pool list is not an array!", typeof rawPoolList);
              throw new Error("Unexpected format for pool list");
            }
          } else {
            console.log("No return values in result");
            throw new Error("No pool list returned");
          }
        },
        3,
        1000
      );
    } catch (error: any) {
      console.error("Error with fallback pool list fetch:", error);
      setError(`Failed to load pool list: ${error.message}`);
      toast.error("Failed to load pool list", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or account changes
  useEffect(() => {
    if (account?.address) {
      // Prioritize event-based fetching
      fetchPoolEvents();
    }

    // Cleanup function for abort controller
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [account?.address]);

  // Ensure pool data is reported when it becomes available
  useEffect(() => {
    if (!isLoading && poolList.length > 0) {
      reportPoolCounts();
    }
  }, [isLoading, poolList, reportPoolCounts]);

  // Filter and sort pools
  const filteredAndSortedPools = poolList
    // Apply text search filter
    .filter(
      (pool) =>
        pool.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.tokens.some((token) =>
          token.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        pool.typeString.toLowerCase().includes(searchTerm.toLowerCase())
    )
    // Apply type filter
    .filter((pool) => {
      if (filterType === "all") return true;
      if (filterType === "lp") return pool.isLp;
      if (filterType === "single") return !pool.isLp;
      return true;
    })
    // Apply sorting
    .sort((a, b) => {
      // Default values if properties are undefined
      const aAPR = a.apr || 0;
      const bAPR = b.apr || 0;
      const aAllocation = a.allocationPoints || 0;
      const bAllocation = b.allocationPoints || 0;

      // Determine sort direction multiplier
      const dirMultiplier = sortDirection === "asc" ? 1 : -1;

      // Sort based on selected criteria
      if (sortBy === "apr") {
        return (aAPR - bAPR) * dirMultiplier;
      } else if (sortBy === "allocation") {
        return (aAllocation - bAllocation) * dirMultiplier;
      } else if (sortBy === "name") {
        return a.displayName.localeCompare(b.displayName) * dirMultiplier;
      }

      // Default sort by APR descending
      return bAPR - aAPR;
    });

  // Group pools by type
  const lpPools = filteredAndSortedPools.filter((p) => p.isLp);
  const singleAssetPools = filteredAndSortedPools.filter((p) => !p.isLp);

  return (
    <div className="card-bg-premium rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaTractor className="text-yellow-400" />
            <span className="text-shimmer-gold">Available Farm Pools</span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
            <input
              type="text"
              placeholder="Search pools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-blue-900/30 border border-blue-800/50 rounded pl-10 pr-3 py-2 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>
          <button
            onClick={() => setExpandedFilters(!expandedFilters)}
            className="bg-blue-900/60 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors flex items-center gap-2"
          >
            <FaFilter />
            <span>Filters</span>
            {expandedFilters ? (
              <FaChevronUp size={12} />
            ) : (
              <FaChevronDown size={12} />
            )}
          </button>
          <button
            onClick={fetchPoolEvents}
            disabled={isLoading}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FaSyncAlt className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Loading..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {expandedFilters && (
        <div className="mb-6 bg-blue-900/30 p-4 rounded-lg border border-blue-800/50 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter by type */}
            <div>
              <h3 className="text-blue-300 text-sm mb-2">Pool Type</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded text-sm ${
                    filterType === "all"
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/80"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("lp")}
                  className={`px-3 py-1 rounded text-sm ${
                    filterType === "lp"
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/80"
                  }`}
                >
                  LP Tokens
                </button>
                <button
                  onClick={() => setFilterType("single")}
                  className={`px-3 py-1 rounded text-sm ${
                    filterType === "single"
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/80"
                  }`}
                >
                  Single Asset
                </button>
              </div>
            </div>

            {/* Sort by */}
            <div>
              <h3 className="text-blue-300 text-sm mb-2">Sort By</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSortBy("apr")}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === "apr"
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/80"
                  }`}
                >
                  APR
                </button>
                <button
                  onClick={() => setSortBy("allocation")}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === "allocation"
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/80"
                  }`}
                >
                  Allocation
                </button>
                <button
                  onClick={() => setSortBy("name")}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === "name"
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/80"
                  }`}
                >
                  Name
                </button>
              </div>
            </div>

            {/* Sort direction */}
            <div>
              <h3 className="text-blue-300 text-sm mb-2">Direction</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSortDirection("desc")}
                  className={`px-3 py-1 rounded text-sm ${
                    sortDirection === "desc"
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/80"
                  }`}
                >
                  Highest First
                </button>
                <button
                  onClick={() => setSortDirection("asc")}
                  className={`px-3 py-1 rounded text-sm ${
                    sortDirection === "asc"
                      ? "bg-yellow-600 text-white"
                      : "bg-blue-900/60 text-blue-300 hover:bg-blue-800/80"
                  }`}
                >
                  Lowest First
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-blue-900/30 rounded w-full"></div>
          <div className="h-64 bg-blue-900/30 rounded w-full"></div>
          <div className="h-64 bg-blue-900/30 rounded w-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-400/50 text-red-200 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : filteredAndSortedPools.length === 0 ? (
        <div className="text-center py-12 bg-blue-900/20 rounded-lg border border-blue-800/30">
          <FaExclamationCircle className="text-yellow-400 text-4xl mx-auto mb-4" />
          <p className="text-xl font-medium text-blue-200 mb-2">
            No pools found
          </p>
          <p className="text-blue-300">
            {searchTerm
              ? `No pools match your search for "${searchTerm}"`
              : "No active pools available at the moment"}
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-6 bg-blue-900/20 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center">
            <div className="text-blue-200 font-medium mb-3 md:mb-0">
              <span className="text-white">
                {filteredAndSortedPools.length}
              </span>{" "}
              Pools Available |
              <span className="text-yellow-400 ml-1">{lpPools.length}</span> LP
              Pools |
              <span className="text-green-400 ml-1">
                {singleAssetPools.length}
              </span>{" "}
              Single Asset Pools
            </div>
            <div className="text-sm text-blue-300">
              <span className="text-yellow-400 font-medium">Pro tip:</span> Sort
              by APR to find the most profitable pools
            </div>
          </div>

          {/* LP Pools Section */}
          {lpPools.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="accent-line"></div>
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <FaExchangeAlt className="text-yellow-400" />
                  LP Token Pools
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lpPools.map((pool, index) => (
                  <PoolCard
                    key={index}
                    pool={pool}
                    calculateAPR={calculateAPR}
                    onShowDetails={openPoolDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Single Asset Pools Section */}
          {singleAssetPools.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="accent-line"></div>
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  <FaCoins className="text-green-400" />
                  Single Asset Pools
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {singleAssetPools.map((pool, index) => (
                  <PoolCard
                    key={index}
                    pool={pool}
                    calculateAPR={calculateAPR}
                    onShowDetails={openPoolDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Full Type Details Toggle */}
          <div className="mt-8 border border-blue-800/30 rounded-lg p-4 bg-blue-900/20">
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="w-full text-left cursor-pointer text-blue-200 hover:text-white transition-colors focus:outline-none flex justify-between items-center"
            >
              <span className="font-medium">Pool Type Information</span>
              {showFullDetails ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {showFullDetails && (
              <div className="mt-4 bg-blue-950/60 p-4 rounded overflow-x-auto border border-blue-800/30">
                <pre className="text-xs text-blue-200 whitespace-pre-wrap break-all">
                  {filteredAndSortedPools
                    .map(
                      (pool, i) =>
                        `${i + 1}. ${pool.displayName}: ${pool.typeString}`
                    )
                    .join("\n\n")}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pool Details Modal */}
      <PoolDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pool={selectedPool}
      />
    </div>
  );
};

export default EventBasedPoolListComponent;
