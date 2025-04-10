import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useWallet } from "@suiet/wallet-kit";
import { suiClient } from "../../utils/suiClient";
import { toast } from "sonner";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
  FaTractor,
  FaCoins,
  FaExchangeAlt,
  FaInfoCircle,
  FaCalculator,
  FaChevronDown,
  FaChevronUp,
  FaArrowRight,
  FaChartLine,
  FaWallet,
  FaCircleNotch,
  FaPercentage,
  FaEdit,
  FaWater,
  FaSpinner,
  FaSlidersH,
} from "react-icons/fa";
import { CONSTANTS, formatBalance } from "../../constants/addresses";
import { TokenSelect } from "./TokenSelect";
import {
  getTokenObjectId,
  normalizeCoinType,
  extractTokenTypesFromLP,
} from "../../utils/tokenUtils";

interface StakingComponentProps {
  initialMode?: string;
  initialToken?: string;
}

export interface TokenInfo {
  id: string;
  name: string;
  symbol: string;
  type: string;
  decimals: number;
  balance?: string;
  formattedBalance?: string;
  logoUrl?: string;
  usdPrice?: number;
  usdValue?: string;
  favorite?: boolean;
}

interface LPInfo {
  token0Type: string;
  token1Type: string;
  id?: string;
  balance?: string;
  name?: string;
  symbol?: string;
}

// Staking Component
const StakingComponent: React.FC<StakingComponentProps> = ({
  initialMode = "single",
  initialToken = "",
}) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Extract token params (try both formats)
  const token0Param = searchParams.get("token0");
  const token1Param = searchParams.get("token1");
  const typeParam = searchParams.get("token") || initialToken;

  const [loadingParams, setLoadingParams] = useState(true);
  const [stakeMode, setStakeMode] = useState(
    initialMode === "lp" || (token0Param && token1Param) ? "lp" : "single"
  );

  // For single asset staking
  const [singleToken, setSingleToken] = useState<TokenInfo | null>(null);
  const [singleTokenBalance, setSingleTokenBalance] = useState("0");

  // For LP staking
  const [token0, setToken0] = useState<TokenInfo | null>(null);
  const [token1, setToken1] = useState<TokenInfo | null>(null);
  const [lpInfo, setLpInfo] = useState<LPInfo | null>(null);
  const [lpBalance, setLpBalance] = useState("0");
  const [lpTokens, setLpTokens] = useState<any[]>([]); // Array to hold individual LP tokens

  // Common state
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakePercentage, setStakePercentage] = useState(100);
  const [customPercentage, setCustomPercentage] = useState(""); // For custom percentage input
  const [isCustomPercentage, setIsCustomPercentage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [calculationVisible, setCalculationVisible] = useState(false);
  const [aprEstimate, setAprEstimate] = useState<string>("0");

  const { connected, account, signAndExecuteTransactionBlock } = useWallet();

  // PercentageSlider Component - Modular slider implementation
  const PercentageSlider = ({
    value,
    onChange,
    onCustomClick,
    isCustomMode,
    className = "",
  }: {
    value: number;
    onChange: (value: number) => void;
    onCustomClick: () => void;
    isCustomMode: boolean;
    className?: string;
  }) => {
    return (
      <div className={`${className}`}>
        <div className="flex justify-between text-xs text-blue-300 mb-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        <div className="relative py-1">
          {/* Slider track background */}
          <div className="absolute inset-0 top-1/2 transform -translate-y-1/2 h-2 bg-blue-900/50 rounded-lg"></div>

          {/* Filled part of slider - gradient effect */}
          <div
            className="absolute inset-y-0 left-0 top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg"
            style={{ width: `${value}%` }}
          ></div>

          {/* Tick marks for better visual reference */}
          <div className="absolute inset-0 top-1/2 transform -translate-y-1/2 flex justify-between px-0">
            {[0, 25, 50, 75, 100].map((tick) => (
              <div
                key={tick}
                className={`w-0.5 h-1.5 bg-blue-200/30 rounded-full ${
                  tick === 0 ? "ml-0" : tick === 100 ? "mr-0" : ""
                }`}
              />
            ))}
          </div>

          {/* Slider input - invisible but handles interactions */}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="relative w-full h-8 opacity-0 z-10 cursor-pointer"
          />

          {/* Custom animated thumb with glow effect */}
          <div
            className="absolute w-5 h-5 bg-white rounded-full shadow-lg border-2 border-blue-500 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-75"
            style={{
              left: `calc(${value}% - 10px)`,
              boxShadow: "0 0 10px rgba(59, 130, 246, 0.7)",
            }}
          ></div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center">
            <div className="text-white text-sm font-medium px-3 py-1 rounded-md bg-blue-800/80 border border-blue-700 shadow-sm">
              {value}%
            </div>
          </div>
          <button
            onClick={onCustomClick}
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-900/70 hover:bg-blue-800/80 transition-colors"
          >
            {isCustomMode ? <FaSlidersH size={10} /> : <FaEdit size={10} />}
            <span>{isCustomMode ? "Use Slider" : "Custom Value"}</span>
          </button>
        </div>
      </div>
    );
  };

  // Handle custom percentage change
  const handleCustomPercentageChange = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, "");
    setCustomPercentage(numericValue);

    // Convert to number and validate
    const percentage = parseFloat(numericValue);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      // Calculate amount based on custom percentage
      if (stakeMode === "single" && singleToken) {
        const isSui = singleToken.type === "0x2::sui::SUI";
        // If SUI, ensure we leave some for gas
        const adjustedPercentage = isSui && percentage > 95 ? 95 : percentage;

        const amount =
          (BigInt(singleTokenBalance) *
            BigInt(Math.floor(adjustedPercentage))) /
          BigInt(100);
        setStakeAmount(amount.toString());
      } else if (stakeMode === "lp" && lpInfo) {
        const amount =
          (BigInt(lpBalance) * BigInt(Math.floor(percentage))) / BigInt(100);
        setStakeAmount(amount.toString());
      }
    }
  };

  // Toggle custom percentage input
  const toggleCustomPercentage = () => {
    setIsCustomPercentage(!isCustomPercentage);
    if (!isCustomPercentage) {
      setCustomPercentage(stakePercentage.toString());
    } else {
      setStakePercentage(parseInt(customPercentage) || 100);
    }
  };

  // Helper function to get base type for coin
  const getBaseType = (coinType: string): string => {
    try {
      if (!coinType || typeof coinType !== "string") {
        return "";
      }
      if (coinType.includes("::coin::Coin<")) {
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      }
      return coinType;
    } catch (error) {
      console.error("Error parsing coin type:", error);
      return String(coinType || "");
    }
  };

  // Helper function to ensure proper type format for API calls
  const ensureProperTypeFormat = (coinType: string): string => {
    // First normalize to ensure 0x prefix
    let normalized = normalizeCoinType(coinType);

    // Ensure we have exactly two :: separators for module::struct format
    const parts = normalized.split("::");
    if (parts.length === 3) {
      return normalized; // Already in correct format
    }

    console.error("Invalid type format:", coinType);
    return normalized;
  };

  // Helper function to sort tokens according to factory's rules
  const sortTokens = async (type0: string, type1: string) => {
    // SUI always comes first
    if (type0 === "0x2::sui::SUI")
      return { token0Type: type0, token1Type: type1 };
    if (type1 === "0x2::sui::SUI")
      return { token0Type: type1, token1Type: type0 };

    // For other tokens, sort by address
    const addr0 = type0.split("::")[0];
    const addr1 = type1.split("::")[0];
    return addr0.toLowerCase() < addr1.toLowerCase()
      ? { token0Type: type0, token1Type: type1 }
      : { token0Type: type1, token1Type: type0 };
  };

  // Function to get coin type from object ID
  const getCoinTypeFromObjectId = async (
    objectId: string
  ): Promise<string | null> => {
    try {
      console.log(`Getting coin type for object ID: ${objectId}`);
      const objectData = await suiClient.getObject({
        id: objectId,
        options: { showType: true },
      });

      if (objectData?.data?.type) {
        const type = objectData.data.type;
        console.log(`Object type: ${type}`);

        // Extract the actual coin type from Coin<TYPE>
        const match = type.match(/Coin<([^>]+)>/);
        if (match) {
          console.log(`Extracted coin type: ${match[1]}`);
          return match[1];
        }
        return type;
      }
      console.warn(`No type found for object ID: ${objectId}`);
      return null;
    } catch (error) {
      console.error("Error getting coin type:", error);
      return null;
    }
  };

  // Auto-refresh when window gains focus (user returns from DEX)
  useEffect(() => {
    // Function to refresh LP balance when user returns to the page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && account?.address) {
        console.log("Page visibility changed to visible - refreshing balances");
        if (stakeMode === "lp" && token0 && token1) {
          console.log("Refreshing LP balance after return from DEX");
          fetchLpBalance(token0.type, token1.type);
        }
      }
    };

    // Function to handle window focus (alternative way to detect return)
    const handleWindowFocus = () => {
      if (account?.address) {
        console.log("Window focused - refreshing balances");
        if (stakeMode === "lp" && token0 && token1) {
          console.log("Refreshing LP balance after window focus");
          fetchLpBalance(token0.type, token1.type);
        }
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [stakeMode, token0, token1, account?.address]);

  // Handle loading from URL parameters or initialToken
  useEffect(() => {
    console.log("Effect triggered with parameters:", {
      token0: token0Param,
      token1: token1Param,
      type: typeParam,
      connected,
      initialToken,
    });

    if (!account?.address) {
      console.log("Account not connected, skipping token initialization");
      setLoadingParams(false);
      return;
    }

    const initializeWithTokens = async () => {
      setLoadingParams(true);
      try {
        // Case 1: We have both token0 and token1 parameters (object IDs)
        if (token0Param && token1Param) {
          console.log("Initializing with token0 and token1 object IDs");
          setStakeMode("lp");

          // Get coin types from object IDs
          const [token0Type, token1Type] = await Promise.all([
            getCoinTypeFromObjectId(token0Param),
            getCoinTypeFromObjectId(token1Param),
          ]);

          if (!token0Type || !token1Type) {
            console.error("Failed to get token types from object IDs");
            setLoadingParams(false);
            return;
          }

          console.log("Retrieved token types:", { token0Type, token1Type });

          // Get token metadata
          const [token0Metadata, token1Metadata] = await Promise.all([
            suiClient
              .getCoinMetadata({ coinType: token0Type })
              .catch(() => null),
            suiClient
              .getCoinMetadata({ coinType: token1Type })
              .catch(() => null),
          ]);

          // Set token0
          setToken0({
            id: token0Param,
            name:
              token0Metadata?.name || token0Type.split("::").pop() || "Unknown",
            symbol:
              token0Metadata?.symbol ||
              token0Type.split("::").pop() ||
              "Unknown",
            type: token0Type,
            decimals: token0Metadata?.decimals || 9,
          });

          // Set token1
          setToken1({
            id: token1Param,
            name:
              token1Metadata?.name || token1Type.split("::").pop() || "Unknown",
            symbol:
              token1Metadata?.symbol ||
              token1Type.split("::").pop() ||
              "Unknown",
            type: token1Type,
            decimals: token1Metadata?.decimals || 9,
          });

          // Set LP info and fetch balance
          const { token0Type: sortedToken0, token1Type: sortedToken1 } =
            await sortTokens(token0Type, token1Type);

          setLpInfo({
            token0Type: sortedToken0,
            token1Type: sortedToken1,
            name: `${
              token0Metadata?.symbol ||
              token0Type.split("::").pop() ||
              "Unknown"
            }-${
              token1Metadata?.symbol ||
              token1Type.split("::").pop() ||
              "Unknown"
            } LP`,
            symbol: "LP",
          });

          await fetchLpBalance(sortedToken0, sortedToken1);
        }
        // Case 2: We have an LP type string
        else if (typeParam && typeParam.includes("::pair::LPCoin<")) {
          console.log("Initializing with LP token type string");
          setStakeMode("lp");

          // Extract token types from LP
          const tokens = extractTokenTypesFromLP(typeParam);
          if (!tokens) {
            console.error("Failed to extract token types from LP token string");
            setLoadingParams(false);
            return;
          }

          const { token0Type, token1Type } = tokens;
          console.log("Extracted token types:", { token0Type, token1Type });

          // Try to get object IDs for both token types
          const [token0Id, token1Id] = await Promise.all([
            getTokenObjectId(token0Type, suiClient, account.address),
            getTokenObjectId(token1Type, suiClient, account.address),
          ]);

          // Get token metadata
          const [token0Metadata, token1Metadata] = await Promise.all([
            suiClient
              .getCoinMetadata({ coinType: token0Type })
              .catch(() => null),
            suiClient
              .getCoinMetadata({ coinType: token1Type })
              .catch(() => null),
          ]);

          // Set token0
          setToken0({
            id: token0Id || token0Type,
            name:
              token0Metadata?.name || token0Type.split("::").pop() || "Unknown",
            symbol:
              token0Metadata?.symbol ||
              token0Type.split("::").pop() ||
              "Unknown",
            type: token0Type,
            decimals: token0Metadata?.decimals || 9,
          });

          // Set token1
          setToken1({
            id: token1Id || token1Type,
            name:
              token1Metadata?.name || token1Type.split("::").pop() || "Unknown",
            symbol:
              token1Metadata?.symbol ||
              token1Type.split("::").pop() ||
              "Unknown",
            type: token1Type,
            decimals: token1Metadata?.decimals || 9,
          });

          // Set LP info and fetch balance
          const { token0Type: sortedToken0, token1Type: sortedToken1 } =
            await sortTokens(token0Type, token1Type);

          setLpInfo({
            id: typeParam,
            token0Type: sortedToken0,
            token1Type: sortedToken1,
            name: `${
              token0Metadata?.symbol ||
              token0Type.split("::").pop() ||
              "Unknown"
            }-${
              token1Metadata?.symbol ||
              token1Type.split("::").pop() ||
              "Unknown"
            } LP`,
            symbol: "LP",
          });

          await fetchLpBalance(sortedToken0, sortedToken1);
        }
        // Case 3: Single token case (type string or object ID)
        else if (typeParam) {
          console.log("Initializing with single token:", typeParam);
          setStakeMode("single");

          // Check if it's a type string or object ID
          const isTypeString = typeParam.includes("::");
          let tokenType = isTypeString ? typeParam : null;

          // If it's an object ID, get the coin type
          if (!isTypeString) {
            tokenType = await getCoinTypeFromObjectId(typeParam);
          }

          if (!tokenType) {
            console.error("Failed to determine token type");
            setLoadingParams(false);
            return;
          }

          // Ensure correct type format for API calls
          const properTokenType = ensureProperTypeFormat(tokenType);

          // Try to get object ID for this token type if we don't have it
          const tokenId = isTypeString
            ? await getTokenObjectId(
                properTokenType,
                suiClient,
                account.address
              )
            : typeParam;

          // Get token metadata
          const metadata = await suiClient
            .getCoinMetadata({ coinType: properTokenType })
            .catch(() => null);

          if (!metadata) {
            console.warn("⚠️ No metadata returned for", properTokenType);
          }

          // Create token info
          const tokenInfo: TokenInfo = {
            id: tokenId || typeParam,
            name:
              metadata?.name || properTokenType.split("::").pop() || "Unknown",
            symbol:
              metadata?.symbol ||
              properTokenType.split("::").pop() ||
              "Unknown",
            type: properTokenType,
            decimals: metadata?.decimals ?? 9,
          };

          console.log("✅ Setting single token info:", tokenInfo);
          setSingleToken(tokenInfo);
          await fetchTokenBalance(properTokenType);
        }
      } catch (error) {
        console.error("Error initializing tokens:", error);
        toast.error("Failed to load token information");
      } finally {
        setLoadingParams(false);
      }
    };

    initializeWithTokens();
  }, [token0Param, token1Param, typeParam, account?.address, initialToken]);

  // Calculate stake amount based on percentage
  useEffect(() => {
    if (!isCustomPercentage) {
      if (stakeMode === "single" && singleToken) {
        const isSui = singleToken.type === "0x2::sui::SUI";
        // If SUI, leave some balance for gas
        const adjustedPercentage =
          isSui && stakePercentage > 95 ? 95 : stakePercentage;

        const amount =
          (BigInt(singleTokenBalance) * BigInt(adjustedPercentage)) /
          BigInt(100);
        setStakeAmount(amount.toString());
      } else if (stakeMode === "lp" && lpInfo) {
        const amount =
          (BigInt(lpBalance) * BigInt(stakePercentage)) / BigInt(100);
        setStakeAmount(amount.toString());
      }
    }
  }, [
    stakePercentage,
    singleTokenBalance,
    lpBalance,
    stakeMode,
    singleToken,
    lpInfo,
    isCustomPercentage,
  ]);

  // Fetch APR estimate from farm contract
  const fetchAprEstimate = async (tokenType: string) => {
    if (!account?.address) return;

    try {
      // Create transaction block for devInspect call
      const tx = new TransactionBlock();

      // Get pool info to calculate APR
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::get_pool_info`,
        arguments: [tx.object(CONSTANTS.FARM_ID)],
        typeArguments: [tokenType],
      });

      // Execute in read-only mode
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx as any,
        sender: account.address,
      });

      if (result.results && result.results[0]?.returnValues) {
        // Handle the returned data to calculate APR
        // This is a simplified approach - in reality you'd need to parse the return values
        // and calculate based on the contract implementation

        // Fallback APR estimation based on token type
        if (tokenType.includes("::pair::LPCoin<")) {
          if (tokenType.includes("::sui::SUI")) {
            setAprEstimate("82.5");
          } else {
            setAprEstimate("65.3");
          }
        } else if (tokenType === "0x2::sui::SUI") {
          setAprEstimate("45.2");
        } else if (tokenType.includes("::victory_token::")) {
          setAprEstimate("38.7");
        } else {
          setAprEstimate("30.0");
        }
      }
    } catch (error) {
      console.error("Error fetching APR estimate:", error);
      setAprEstimate("??.??");
    }
  };

  // Fetch single token balance
  const fetchTokenBalance = async (tokenType: string) => {
    if (!account?.address) return;

    try {
      console.log(`Fetching balance for token type: ${tokenType}`);

      // Normalize token type
      const normalizedType = ensureProperTypeFormat(tokenType);

      // Get coins of the specific type
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: normalizedType,
      });

      // Calculate total balance
      const totalBalance = coins.data.reduce(
        (acc, coin) => acc + BigInt(coin.balance),
        BigInt(0)
      );

      console.log(
        `Found balance for ${normalizedType}: ${totalBalance.toString()}`
      );
      setSingleTokenBalance(totalBalance.toString());

      // Fetch APR for this token
      fetchAprEstimate(normalizedType);
    } catch (error) {
      console.error(`Error fetching balance for ${tokenType}:`, error);
      setSingleTokenBalance("0");
    }
  };

  // Fetch LP token balance
  const fetchLpBalance = async (token0Type: string, token1Type: string) => {
    if (!account?.address) return;

    try {
      console.log(
        `Fetching LP balance for token pair: ${token0Type}, ${token1Type}`
      );

      // Sort tokens first to maintain consistency
      const { token0Type: sortedToken0, token1Type: sortedToken1 } =
        await sortTokens(token0Type, token1Type);

      const normalizedToken0 = ensureProperTypeFormat(sortedToken0);
      const normalizedToken1 = ensureProperTypeFormat(sortedToken1);

      console.log("Normalized token types:", {
        token0: normalizedToken0,
        token1: normalizedToken1,
      });

      // Construct LP token type
      const lpTokenType = `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.PAIR}::LPCoin<${normalizedToken0}, ${normalizedToken1}>`;
      console.log(`Constructed LP token type: ${lpTokenType}`);

      // Get LP coins
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: lpTokenType,
      });

      // Calculate total balance
      const totalBalance = coins.data.reduce(
        (acc, coin) => acc + BigInt(coin.balance),
        BigInt(0)
      );

      console.log(`Found LP balance: ${totalBalance.toString()}`);
      setLpBalance(totalBalance.toString());
      setLpTokens(coins.data);

      // Set LP info if not already set
      if (
        !lpInfo ||
        lpInfo.token0Type !== normalizedToken0 ||
        lpInfo.token1Type !== normalizedToken1
      ) {
        setLpInfo({
          token0Type: normalizedToken0,
          token1Type: normalizedToken1,
          balance: totalBalance.toString(),
          name: `${sortedToken0.split("::").pop()}-${sortedToken1
            .split("::")
            .pop()} LP`,
          symbol: "LP",
        });
      }

      // Fetch APR for this LP token
      fetchAprEstimate(lpTokenType);
    } catch (error) {
      console.error(`Error fetching LP balance:`, error);
      setLpBalance("0");
      setLpTokens([]);
    }
  };

  // Handle single token selection
  const handleSingleTokenSelect = (tokenInfo: {
    id: string;
    type: string;
    allObjectIds: string[];
    coinType: string;
  }) => {
    if (!tokenInfo?.coinType) {
      console.error(
        "❌ Invalid tokenInfo passed to handleSingleTokenSelect:",
        tokenInfo
      );
      return;
    }
    // Get token metadata to create TokenInfo object
    suiClient
      .getCoinMetadata({ coinType: tokenInfo.coinType })
      .then((metadata) => {
        console.log("📥 Metadata fetched for token:", metadata);
        const token: TokenInfo = {
          id: tokenInfo.id,
          name:
            metadata?.name || tokenInfo.coinType.split("::").pop() || "Unknown",
          symbol:
            metadata?.symbol ||
            tokenInfo.coinType.split("::").pop() ||
            "Unknown",
          type: tokenInfo.coinType,
          decimals: metadata?.decimals || 9,
        };

        setSingleToken(token);
        fetchTokenBalance(token.type);
      })
      .catch((error) => {
        console.error("Error fetching token metadata:", error);
        // Create a default token info if metadata fails
        const token: TokenInfo = {
          id: tokenInfo.id,
          name: tokenInfo.coinType.split("::").pop() || "Unknown",
          symbol: tokenInfo.coinType.split("::").pop() || "Unknown",
          type: tokenInfo.coinType,
          decimals: 9,
        };
        setSingleToken(token);
        fetchTokenBalance(token.type);
      });
  };

  // Handle token selection for LP tokens
  const handleToken0Select = (tokenInfo: {
    id: string;
    type: string;
    allObjectIds: string[];
    coinType: string;
  }) => {
    // Get token metadata to create TokenInfo object
    suiClient
      .getCoinMetadata({ coinType: tokenInfo.coinType })
      .then((metadata) => {
        const token: TokenInfo = {
          id: tokenInfo.id,
          name:
            metadata?.name || tokenInfo.coinType.split("::").pop() || "Unknown",
          symbol:
            metadata?.symbol ||
            tokenInfo.coinType.split("::").pop() ||
            "Unknown",
          type: tokenInfo.coinType,
          decimals: metadata?.decimals || 9,
        };

        setToken0(token);

        // Reset LP info if token1 is already selected
        if (token1) {
          updateLpInfo(token, token1);
        }
      })
      .catch((error) => {
        console.error("Error fetching token metadata:", error);
        // Create a default token info if metadata fails
        const token: TokenInfo = {
          id: tokenInfo.id,
          name: tokenInfo.coinType.split("::").pop() || "Unknown",
          symbol: tokenInfo.coinType.split("::").pop() || "Unknown",
          type: tokenInfo.coinType,
          decimals: 9,
        };
        setToken0(token);

        // Reset LP info if token1 is already selected
        if (token1) {
          updateLpInfo(token, token1);
        }
      });
  };

  const handleToken1Select = (tokenInfo: {
    id: string;
    type: string;
    allObjectIds: string[];
    coinType: string;
  }) => {
    // Get token metadata to create TokenInfo object
    suiClient
      .getCoinMetadata({ coinType: tokenInfo.coinType })
      .then((metadata) => {
        const token: TokenInfo = {
          id: tokenInfo.id,
          name:
            metadata?.name || tokenInfo.coinType.split("::").pop() || "Unknown",
          symbol:
            metadata?.symbol ||
            tokenInfo.coinType.split("::").pop() ||
            "Unknown",
          type: tokenInfo.coinType,
          decimals: metadata?.decimals || 9,
        };

        setToken1(token);

        // Reset LP info if token0 is already selected
        if (token0) {
          updateLpInfo(token0, token);
        }
      })
      .catch((error) => {
        console.error("Error fetching token metadata:", error);
        // Create a default token info if metadata fails
        const token: TokenInfo = {
          id: tokenInfo.id,
          name: tokenInfo.coinType.split("::").pop() || "Unknown",
          symbol: tokenInfo.coinType.split("::").pop() || "Unknown",
          type: tokenInfo.coinType,
          decimals: 9,
        };
        setToken1(token);

        // Reset LP info if token0 is already selected
        if (token0) {
          updateLpInfo(token0, token);
        }
      });
  };

  // Update LP info based on selected tokens
  const updateLpInfo = (token0: TokenInfo, token1: TokenInfo) => {
    // Sort tokens to ensure consistent LP pairs
    fetchLpBalance(token0.type, token1.type);
  };

  // Find optimal coins for staking
  const findOptimalCoins = (coins: any[], targetAmount: bigint) => {
    // Sort coins by balance (descending)
    const sortedCoins = [...coins].sort((a, b) =>
      BigInt(b.balance) > BigInt(a.balance) ? 1 : -1
    );

    let remaining = targetAmount;
    const selectedCoins: any[] = [];

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
  };

  // Handle staking transaction
  const handleStake = async () => {
    if (!connected || !account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (BigInt(stakeAmount) <= BigInt(0)) {
      toast.error("Please enter a valid amount to stake");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Processing staking transaction...");

    try {
      // Create transaction block
      const tx = new TransactionBlock();

      if (stakeMode === "single" && singleToken) {
        // For single asset staking
        const isSui = singleToken.type === "0x2::sui::SUI";

        if (isSui) {
          // Special handling for SUI token
          console.log("Handling SUI token staking with special logic");

          // For SUI, we need to leave some for gas
          // Simple approach: reserve 0.01 SUI (10000000) for gas
          const gasReserve = BigInt(10000000);
          const targetAmount = BigInt(stakeAmount);

          // Check if there is enough balance after gas reserve
          if (targetAmount + gasReserve > BigInt(singleTokenBalance)) {
            const adjustedAmount = BigInt(singleTokenBalance) - gasReserve;
            if (adjustedAmount <= BigInt(0)) {
              throw new Error(
                "Insufficient SUI for transaction. Please keep some SUI for gas fees."
              );
            }

            // Use the adjusted amount
            const stakeCoin = tx.splitCoins(tx.gas, [
              tx.pure.u64(adjustedAmount.toString()),
            ])[0];

            tx.moveCall({
              target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::stake_single`,
              arguments: [
                tx.object(CONSTANTS.FARM_ID),
                stakeCoin,
                tx.object(CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID),
              ],
              typeArguments: [singleToken.type],
            });
          } else {
            // There's enough SUI, proceed with original amount
            const stakeCoin = tx.splitCoins(tx.gas, [
              tx.pure.u64(targetAmount.toString()),
            ])[0];

            tx.moveCall({
              target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::stake_single`,
              arguments: [
                tx.object(CONSTANTS.FARM_ID),
                stakeCoin,
                tx.object(CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID),
              ],
              typeArguments: [singleToken.type],
            });
          }
        } else {
          // For non-SUI tokens, use regular approach
          // Get coins to use for staking
          // Ensure proper type format for API call
          const tokenType = ensureProperTypeFormat(singleToken.type);

          const coins = await suiClient.getCoins({
            owner: account.address,
            coinType: tokenType,
          });

          if (coins.data.length === 0) {
            throw new Error(`No coins found for token ${singleToken.symbol}`);
          }

          // Find coins to use
          const targetAmount = BigInt(stakeAmount);
          const selectedCoins = findOptimalCoins(coins.data, targetAmount);

          if (selectedCoins.length === 0) {
            throw new Error(
              `Insufficient balance: needed ${formatBalance(
                targetAmount.toString(),
                singleToken.decimals
              )}, have ${formatBalance(
                singleTokenBalance,
                singleToken.decimals
              )}`
            );
          }

          // Create coin to use in transaction
          let stakeCoin;
          if (
            selectedCoins.length === 1 &&
            BigInt(selectedCoins[0].balance) === targetAmount
          ) {
            // Use the coin directly if it has the exact amount
            stakeCoin = tx.object(selectedCoins[0].coinObjectId);
          } else if (selectedCoins.length === 1) {
            // Split the coin if it has more than needed
            stakeCoin = tx.splitCoins(
              tx.object(selectedCoins[0].coinObjectId),
              [tx.pure.u64(targetAmount.toString())]
            )[0];
          } else {
            // Merge multiple coins and then split if needed
            const primaryCoin = tx.object(selectedCoins[0].coinObjectId);
            const otherCoins = selectedCoins
              .slice(1)
              .map((coin) => tx.object(coin.coinObjectId));
            tx.mergeCoins(primaryCoin, otherCoins);

            const totalSelected = selectedCoins.reduce(
              (sum, coin) => sum + BigInt(coin.balance),
              BigInt(0)
            );

            if (totalSelected > targetAmount) {
              stakeCoin = tx.splitCoins(primaryCoin, [
                tx.pure.u64(targetAmount.toString()),
              ])[0];
            } else {
              stakeCoin = primaryCoin;
            }
          }

          // Add stake_single call for non-SUI tokens
          tx.moveCall({
            target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::stake_single`,
            arguments: [
              tx.object(CONSTANTS.FARM_ID),
              stakeCoin,
              tx.object(CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID),
            ],
            typeArguments: [tokenType],
          });
        }
      } else if (stakeMode === "lp" && lpInfo && token0 && token1) {
        // Validate inputs
        console.log("LP Tokens:", lpTokens);
        console.log("LP Info:", lpInfo);
        console.log("Stake Amount:", stakeAmount);

        // Ensure lpTokens exists and is an array
        const lpTokensArray = lpTokens || [];

        if (lpTokensArray.length === 0) {
          throw new Error(
            `No LP tokens found for ${token0.symbol}-${token1.symbol} pair`
          );
        }

        // Find coins to use
        const targetAmount = BigInt(stakeAmount);

        // Add a fallback for findOptimalCoins
        const selectedCoins = findOptimalCoins
          ? findOptimalCoins(lpTokensArray, targetAmount)
          : lpTokensArray.filter(
              (token) => BigInt(token.balance) >= targetAmount
            );

        if (!selectedCoins || selectedCoins.length === 0) {
          throw new Error(
            `Insufficient LP token balance: needed ${formatBalance(
              targetAmount.toString(),
              9 // LP tokens usually have 9 decimals
            )}, have ${formatBalance(lpBalance, 9)}`
          );
        }

        // Create LP coin to use in transaction
        let lpCoin = [];
        if (selectedCoins.length === 1) {
          // Use the coin directly if it has the exact amount
          const singleLpCoin = selectedCoins[0];
          const singleLpBalance = BigInt(singleLpCoin.balance);

          const lpObject = tx.object(singleLpCoin.coinObjectId);

          // If the coin has exactly what we need, use it directly
          // Otherwise split it to get the exact amount
          if (singleLpBalance === targetAmount) {
            lpCoin = [lpObject];
          } else {
            const splitCoin = tx.splitCoins(lpObject, [
              tx.pure.u64(targetAmount.toString()),
            ])[0];
            lpCoin = [splitCoin];
          }
        } else {
          // We need multiple LP coins
          // First merge all coins into the first one
          const primaryLpCoin = tx.object(selectedCoins[0].coinObjectId);
          const otherLpCoins = selectedCoins
            .slice(1)
            .map((coin) => tx.object(coin.coinObjectId));

          tx.mergeCoins(primaryLpCoin, otherLpCoins);

          // Calculate total balance of all selected coins
          const totalSelected = selectedCoins.reduce(
            (sum, coin) => sum + BigInt(coin.balance),
            0n
          );

          // If total is more than needed, split to get exact amount
          if (totalSelected > targetAmount) {
            const splitCoin = tx.splitCoins(primaryLpCoin, [
              tx.pure.u64(targetAmount.toString()),
            ])[0];
            lpCoin = [splitCoin];
          } else {
            lpCoin = [primaryLpCoin];
          }
        }

        // Create the vector for LP coins
        const vectorArg = tx.makeMoveVec({
          objects: lpCoin, // Use 'objects' instead of 'elements'
        });

        // Ensure proper type format for API calls
        const normalizedToken0Type = ensureProperTypeFormat(lpInfo.token0Type);
        const normalizedToken1Type = ensureProperTypeFormat(lpInfo.token1Type);

        // Build stake_lp transaction with proper arguments
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::stake_lp`,
          typeArguments: [normalizedToken0Type, normalizedToken1Type],
          arguments: [
            tx.object(CONSTANTS.FARM_ID),
            vectorArg,
            tx.pure.u256(targetAmount.toString()), // Changed to u256
            tx.object(CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID),
          ],
        });

        console.log("Transaction Args:", {
          farmId: CONSTANTS.FARM_ID,
          vectorArg,
          targetAmount: targetAmount.toString(),
          treasuryCapId: CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID,
          typeArgs: [normalizedToken0Type, normalizedToken1Type],
        });
      } else {
        throw new Error("Please select valid tokens to stake");
      }

      // Execute transaction
      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx as any,
      });

      console.log("Stake transaction result:", result);

      // Update balances after successful transaction
      if (stakeMode === "single" && singleToken) {
        fetchTokenBalance(singleToken.type);
      } else if (stakeMode === "lp" && lpInfo) {
        fetchLpBalance(lpInfo.token0Type, lpInfo.token1Type);
      }

      toast.success("Successfully staked tokens!", { id: toastId });
    } catch (error: any) {
      console.error("Staking error:", error);
      toast.error(error.message || "Failed to stake tokens", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate estimated rewards
  const calculateRewards = () => {
    // Convert APR to daily rate
    const apr = parseFloat(aprEstimate);
    const dailyRate = apr / 365;

    if (stakeMode === "single" && singleToken) {
      // Calculate token amount in VICTORY tokens
      const tokenAmount = BigInt(stakeAmount) || BigInt(0);
      const tokenAmountDecimal =
        Number(tokenAmount) / 10 ** singleToken.decimals;

      // Calculate rewards
      const dailyRewards = (tokenAmountDecimal * dailyRate) / 100;
      const weeklyRewards = dailyRewards * 7;
      const monthlyRewards = dailyRewards * 30;

      return {
        daily: dailyRewards.toFixed(2),
        weekly: weeklyRewards.toFixed(2),
        monthly: monthlyRewards.toFixed(2),
        apr,
      };
    } else if (stakeMode === "lp" && lpInfo) {
      // Calculate LP token amount
      const lpAmount = BigInt(stakeAmount) || BigInt(0);
      const lpAmountDecimal = Number(lpAmount) / 10 ** 9; // LP tokens usually have 9 decimals

      // Calculate rewards
      const dailyRewards = (lpAmountDecimal * dailyRate) / 100;
      const weeklyRewards = dailyRewards * 7;
      const monthlyRewards = dailyRewards * 30;

      return {
        daily: dailyRewards.toFixed(2),
        weekly: weeklyRewards.toFixed(2),
        monthly: monthlyRewards.toFixed(2),
        apr,
      };
    }

    return {
      daily: "0.00",
      weekly: "0.00",
      monthly: "0.00",
      apr: 0,
    };
  };

  // Get estimated rewards
  const rewards = calculateRewards();

  // Function to create URL with query parameters for liquidity page
  const getLiquidityUrl = () => {
    if (!token0 || !token1) {
      return "https://testthing2.vercel.app/#/addliquidity";
    }

    // Create URL with token IDs as query parameters
    const params = new URLSearchParams();

    // For token0, prefer the ID over the type
    if (token0.id && !token0.id.includes("::")) {
      params.append("token0", token0.id);
    } else if (token0.type) {
      // Try to get object ID dynamically if we have a type
      getTokenObjectId(token0.type, suiClient, account?.address || "")
        .then((id) => {
          if (id)
            window.history.replaceState(
              {},
              "",
              `https://testthing2.vercel.app/#/addliquidity?${new URLSearchParams(
                {
                  ...Object.fromEntries(params),
                  token0: id,
                }
              ).toString()}`
            );
        })
        .catch(console.error);

      params.append("token0", token0.type);
    }

    // For token1, prefer the ID over the type
    if (token1.id && !token1.id.includes("::")) {
      params.append("token1", token1.id);
    } else if (token1.type) {
      // Try to get object ID dynamically if we have a type
      getTokenObjectId(token1.type, suiClient, account?.address || "")
        .then((id) => {
          if (id)
            window.history.replaceState(
              {},
              "",
              `https://testthing2.vercel.app/#/addliquidity?${new URLSearchParams(
                {
                  ...Object.fromEntries(params),
                  token1: id,
                }
              ).toString()}`
            );
        })
        .catch(console.error);

      params.append("token1", token1.type);
    }

    return `https://testthing2.vercel.app/#/addliquidity?${params.toString()}`;
  };

  // Function to refresh all balances and data
  const refreshAllData = () => {
    setLoadingParams(true);

    if (stakeMode === "single" && singleToken) {
      console.log("Refreshing single token balance...");
      fetchTokenBalance(singleToken.type).finally(() =>
        setLoadingParams(false)
      );
    } else if (stakeMode === "lp" && token0 && token1) {
      console.log("Refreshing LP token balance...");
      fetchLpBalance(token0.type, token1.type).finally(() =>
        setLoadingParams(false)
      );
    } else {
      setLoadingParams(false);
    }
  };

  return (
    <div className="card-bg-premium rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="accent-line"></div>
        <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
          <FaTractor className="text-yellow-400" />
          <span className="text-shimmer-gold">Stake Tokens</span>
        </h2>
      </div>

      {/* Loading indicator while initializing tokens */}
      {loadingParams && (
        <div className="flex justify-center items-center p-8">
          <div className="flex flex-col items-center gap-3">
            <FaSpinner className="text-2xl text-yellow-400 animate-spin" />
            <p className="text-blue-300">Loading token information...</p>
          </div>
        </div>
      )}

      {!loadingParams && (
        <>
          {/* Toggle between LP and Single asset staking */}
          <div className="flex mb-6 bg-blue-900/30 rounded-lg p-1">
            <button
              onClick={() => setStakeMode("single")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                stakeMode === "single"
                  ? "bg-blue-600 text-white"
                  : "text-blue-300 hover:bg-blue-800/60"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaCoins
                  className={
                    stakeMode === "single" ? "text-yellow-400" : "text-blue-300"
                  }
                />
                <span>Single Token</span>
              </div>
            </button>
            <button
              onClick={() => setStakeMode("lp")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                stakeMode === "lp"
                  ? "bg-blue-600 text-white"
                  : "text-blue-300 hover:bg-blue-800/60"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaExchangeAlt
                  className={
                    stakeMode === "lp" ? "text-yellow-400" : "text-blue-300"
                  }
                />
                <span>LP Token</span>
              </div>
            </button>
          </div>

          <div className="space-y-6">
            {stakeMode === "single" ? (
              // Single Token Staking
              <>
                <div className="card-bg-premium-gold p-5 rounded-xl">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <FaCoins className="text-yellow-400" />
                    <span>Select Token to Stake</span>
                  </h3>

                  <div className="mb-4">
                    <TokenSelect
                      label="Choose Token"
                      onSelect={handleSingleTokenSelect}
                      includeLP={false}
                      autoLoad={false}
                      selectedTokenId={singleToken?.id || ""}
                    />
                  </div>

                  {singleToken && (
                    <div className="bg-blue-900/30 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <FaWallet className="text-yellow-400" />
                          <span className="text-white font-medium">
                            Your Balance
                          </span>
                        </div>
                        <span className="text-white">
                          {formatBalance(
                            singleTokenBalance,
                            singleToken.decimals
                          )}{" "}
                          {singleToken.symbol}
                        </span>
                      </div>

                      {/* Staking Amount with Slider */}
                      <div className="mt-4">
                        <label className="block text-blue-300 text-sm mb-2">
                          Stake Amount
                        </label>
                        <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-800/50">
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="text"
                              value={formatBalance(
                                stakeAmount,
                                singleToken.decimals
                              )}
                              disabled
                              className="w-full bg-blue-950/60 rounded py-2 px-3 text-white outline-none disabled:opacity-75"
                            />
                            <span className="text-white font-medium">
                              {singleToken.symbol}
                            </span>
                          </div>

                          {/* Use the modular Percentage Slider component */}
                          <PercentageSlider
                            value={stakePercentage}
                            onChange={(value) => {
                              setStakePercentage(value);
                              setIsCustomPercentage(false);
                            }}
                            onCustomClick={toggleCustomPercentage}
                            isCustomMode={isCustomPercentage}
                            className="mt-4"
                          />

                          {/* Custom percentage input (conditionally rendered) */}
                          {isCustomPercentage && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex-1 flex items-center bg-blue-950/60 rounded overflow-hidden">
                                <input
                                  type="text"
                                  value={customPercentage}
                                  onChange={(e) =>
                                    handleCustomPercentageChange(e.target.value)
                                  }
                                  className="w-full bg-transparent py-2 px-3 text-white outline-none"
                                  placeholder="Enter percentage"
                                  autoFocus
                                />
                                <span className="px-2 text-white">%</span>
                              </div>
                              <button
                                onClick={toggleCustomPercentage}
                                className="py-2 px-4 rounded text-sm font-medium bg-blue-700 text-white hover:bg-blue-600"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Token Details Section if token is selected */}
                {singleToken && (
                  <div className="card-bg-premium p-5 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <FaInfoCircle className="text-yellow-400" />
                        <span>Token Information</span>
                      </h3>
                      <button
                        onClick={() =>
                          setCalculationVisible(!calculationVisible)
                        }
                        className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                      >
                        <FaCalculator />
                        <span className="text-sm">
                          {calculationVisible
                            ? "Hide Calculator"
                            : "Show Calculator"}
                        </span>
                        {calculationVisible ? (
                          <FaChevronUp size={10} />
                        ) : (
                          <FaChevronDown size={10} />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-900/40 p-3 rounded-lg">
                        <p className="text-blue-300 text-sm">Token</p>
                        <p className="text-white font-medium">
                          {singleToken.name} ({singleToken.symbol})
                        </p>
                      </div>
                      <div className="bg-blue-900/40 p-3 rounded-lg">
                        <p className="text-blue-300 text-sm">Estimated APR</p>
                        <p className="text-white font-medium flex items-center gap-1">
                          {aprEstimate}%
                          <FaChartLine className="text-green-400" />
                        </p>
                      </div>
                    </div>

                    {/* SUI Token Special Notice */}
                    {singleToken.type === "0x2::sui::SUI" && (
                      <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FaInfoCircle className="text-yellow-400 mt-1 flex-shrink-0" />
                          <p className="text-sm text-yellow-300">
                            <strong>Important:</strong> When staking SUI tokens,
                            a small amount will be reserved for gas fees. You
                            can stake up to 95% of your SUI balance at once.
                            This helps ensure you can always complete the
                            transaction.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rewards Calculator */}
                    {calculationVisible && (
                      <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50 mt-3 mb-4 animate-fadeIn">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <FaCalculator className="text-yellow-400" />
                          <span>Rewards Calculator</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-blue-900/50 p-3 rounded-lg">
                            <p className="text-blue-300 text-xs mb-1">
                              Daily Rewards
                            </p>
                            <p className="text-white font-medium">
                              {rewards.daily} VICTORY
                            </p>
                          </div>
                          <div className="bg-blue-900/50 p-3 rounded-lg">
                            <p className="text-blue-300 text-xs mb-1">
                              Weekly Rewards
                            </p>
                            <p className="text-white font-medium">
                              {rewards.weekly} VICTORY
                            </p>
                          </div>
                          <div className="bg-blue-900/50 p-3 rounded-lg">
                            <p className="text-blue-300 text-xs mb-1">
                              Monthly Rewards
                            </p>
                            <p className="text-white font-medium">
                              {rewards.monthly} VICTORY
                            </p>
                          </div>
                        </div>
                        <p className="text-blue-300 text-xs mt-3">
                          * Rewards are estimated based on current APR and token
                          prices. Actual rewards may vary.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleStake}
                      disabled={
                        isLoading ||
                        !singleToken ||
                        BigInt(stakeAmount) <= BigInt(0) ||
                        !connected
                      }
                      className="w-full bg-green-600 text-white p-3 rounded-lg font-medium disabled:opacity-50 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <FaCircleNotch className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <FaTractor />
                          <span>
                            Stake{" "}
                            {formatBalance(stakeAmount, singleToken.decimals)}{" "}
                            {singleToken.symbol}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // LP Token Staking
              <>
                <div className="card-bg-premium-gold p-5 rounded-xl">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <FaExchangeAlt className="text-yellow-400" />
                    <span>Select LP Token to Stake</span>
                  </h3>

                  <div className="mb-4">
                    <div className="bg-blue-900/50 rounded-lg p-4 border border-blue-800/50">
                      <label className="block text-blue-300 text-sm mb-2">
                        Choose Token Pair
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TokenSelect
                          label="Token 1"
                          onSelect={handleToken0Select}
                          includeLP={false}
                          autoLoad={false}
                          selectedTokenId={token0?.id}
                        />
                        <TokenSelect
                          label="Token 2"
                          onSelect={handleToken1Select}
                          includeLP={false}
                          autoLoad={false}
                          selectedTokenId={token1?.id}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced No LP Tokens UI */}
                  {lpBalance === "0" && token0 && token1 && (
                    <div className="bg-blue-900/30 p-6 rounded-lg border border-yellow-500/20 shadow-lg">
                      <div className="flex flex-col items-center text-center">
                        <FaWater className="text-yellow-400 text-3xl mb-3" />
                        <h4 className="text-white text-lg font-semibold mb-2">
                          No LP Tokens Found
                        </h4>
                        <p className="text-blue-300 mb-4">
                          You need to provide liquidity first to get LP tokens
                          for this pair.
                        </p>
                        <button
                          onClick={refreshAllData}
                          className="mb-3 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md transition-colors flex items-center gap-1 text-sm"
                        >
                          <FaCircleNotch
                            className={`${loadingParams ? "animate-spin" : ""}`}
                            size={12}
                          />
                          <span>Refresh Balance</span>
                        </button>
                        <a
                          href={getLiquidityUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/40"
                        >
                          <FaExchangeAlt size={14} />
                          <span>Provide Liquidity on SuiDex</span>
                        </a>
                        <p className="text-xs text-gray-400 mt-3">
                          Your selected tokens will be pre-filled on the
                          liquidity page.
                        </p>
                      </div>
                    </div>
                  )}

                  {lpInfo && token0 && token1 && lpBalance !== "0" && (
                    <div className="bg-blue-900/30 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <FaWallet className="text-yellow-400" />
                          <span className="text-white font-medium">
                            Your LP Balance
                          </span>
                        </div>
                        <span className="text-white">
                          {formatBalance(lpBalance, 9)} {token0.symbol}-
                          {token1.symbol} LP
                        </span>
                      </div>

                      {/* Staking Amount with Slider */}
                      <div className="mt-4">
                        <label className="block text-blue-300 text-sm mb-2">
                          Stake Amount
                        </label>
                        <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-800/50">
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="text"
                              value={formatBalance(stakeAmount, 9)}
                              disabled
                              className="w-full bg-blue-950/60 rounded py-2 px-3 text-white outline-none disabled:opacity-75"
                            />
                            <span className="text-white font-medium">
                              {token0.symbol}-{token1.symbol} LP
                            </span>
                          </div>

                          {/* Use the modular Percentage Slider component */}
                          <PercentageSlider
                            value={stakePercentage}
                            onChange={(value) => {
                              setStakePercentage(value);
                              setIsCustomPercentage(false);
                            }}
                            onCustomClick={toggleCustomPercentage}
                            isCustomMode={isCustomPercentage}
                            className="mt-4"
                          />

                          {/* Custom percentage input (conditionally rendered) */}
                          {isCustomPercentage && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex-1 flex items-center bg-blue-950/60 rounded overflow-hidden">
                                <input
                                  type="text"
                                  value={customPercentage}
                                  onChange={(e) =>
                                    handleCustomPercentageChange(e.target.value)
                                  }
                                  className="w-full bg-transparent py-2 px-3 text-white outline-none"
                                  placeholder="Enter percentage"
                                  autoFocus
                                />
                                <span className="px-2 text-white">%</span>
                              </div>
                              <button
                                onClick={toggleCustomPercentage}
                                className="py-2 px-4 rounded text-sm font-medium bg-blue-700 text-white hover:bg-blue-600"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* LP Details Section if LP is selected */}
                {lpInfo && token0 && token1 && lpBalance !== "0" && (
                  <div className="card-bg-premium p-5 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <FaInfoCircle className="text-yellow-400" />
                        <span>LP Information</span>
                      </h3>
                      <button
                        onClick={() =>
                          setCalculationVisible(!calculationVisible)
                        }
                        className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                      >
                        <FaCalculator />
                        <span className="text-sm">
                          {calculationVisible
                            ? "Hide Calculator"
                            : "Show Calculator"}
                        </span>
                        {calculationVisible ? (
                          <FaChevronUp size={10} />
                        ) : (
                          <FaChevronDown size={10} />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-900/40 p-3 rounded-lg">
                        <p className="text-blue-300 text-sm">LP Token</p>
                        <p className="text-white font-medium">
                          {token0.symbol}-{token1.symbol} LP
                        </p>
                      </div>
                      <div className="bg-blue-900/40 p-3 rounded-lg">
                        <p className="text-blue-300 text-sm">Estimated APR</p>
                        <p className="text-white font-medium flex items-center gap-1">
                          {aprEstimate}%
                          <FaChartLine className="text-green-400" />
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-900/30 p-3 rounded-lg mb-4">
                      <p className="text-blue-300 text-sm mb-1">Token Pair</p>
                      <div className="flex gap-2">
                        <div className="bg-blue-900/50 text-white text-sm px-3 py-1 rounded-full border border-blue-800/50">
                          {token0.symbol}
                        </div>
                        <div className="bg-blue-900/50 text-white text-sm px-3 py-1 rounded-full border border-blue-800/50">
                          {token1.symbol}
                        </div>
                      </div>
                    </div>

                    {/* List individual LP tokens if there are multiple */}
                    {lpTokens.length > 1 && (
                      <div className="bg-blue-900/30 p-3 rounded-lg mb-4">
                        <p className="text-blue-300 text-sm mb-2">
                          Your LP Tokens
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {lpTokens.map((token, index) => (
                            <div
                              key={index}
                              className="bg-blue-900/50 p-2 rounded-lg text-white text-sm"
                            >
                              <div className="flex justify-between">
                                <span>LP Token {index + 1}</span>
                                <span>
                                  {formatBalance(token.balance, 9)} LP
                                </span>
                              </div>
                              <div className="text-blue-300 text-xs mt-1 break-all">
                                ID: {token.coinObjectId.substring(0, 15)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rewards Calculator */}
                    {calculationVisible && (
                      <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50 mt-3 mb-4 animate-fadeIn">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <FaCalculator className="text-yellow-400" />
                          <span>Rewards Calculator</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-blue-900/50 p-3 rounded-lg">
                            <p className="text-blue-300 text-xs mb-1">
                              Daily Rewards
                            </p>
                            <p className="text-white font-medium">
                              {rewards.daily} VICTORY
                            </p>
                          </div>
                          <div className="bg-blue-900/50 p-3 rounded-lg">
                            <p className="text-blue-300 text-xs mb-1">
                              Weekly Rewards
                            </p>
                            <p className="text-white font-medium">
                              {rewards.weekly} VICTORY
                            </p>
                          </div>
                          <div className="bg-blue-900/50 p-3 rounded-lg">
                            <p className="text-blue-300 text-xs mb-1">
                              Monthly Rewards
                            </p>
                            <p className="text-white font-medium">
                              {rewards.monthly} VICTORY
                            </p>
                          </div>
                        </div>
                        <p className="text-blue-300 text-xs mt-3">
                          * Rewards are estimated based on current APR and token
                          prices. Actual rewards may vary.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleStake}
                      disabled={
                        isLoading ||
                        !lpInfo ||
                        BigInt(stakeAmount) <= BigInt(0) ||
                        !connected
                      }
                      className="w-full bg-green-600 text-white p-3 rounded-lg font-medium disabled:opacity-50 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <FaCircleNotch className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <FaTractor />
                          <span>
                            Stake {formatBalance(stakeAmount, 9)}{" "}
                            {token0.symbol}-{token1.symbol} LP
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
        <div className="flex items-center gap-2 mb-2">
          <FaInfoCircle className="text-yellow-400" />
          <h3 className="text-white font-medium">Need Help?</h3>
        </div>
        <p className="text-blue-300 text-sm">
          Staking allows you to earn VICTORY tokens as rewards for providing
          liquidity or single assets to the platform. Higher APR means higher
          potential returns. Rewards are distributed continuously and can be
          claimed at any time.
        </p>
        <div className="flex justify-end mt-3">
          <a
            href={CONSTANTS.EXTERNAL_URLS.DOCS}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm flex items-center gap-1"
          >
            <span>Read Documentation</span>
            <FaArrowRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default StakingComponent;
