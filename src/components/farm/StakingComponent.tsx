import { useState, useEffect } from "react";
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
} from "react-icons/fa";
import { CONSTANTS, formatBalance } from "../../constants/addresses";
import { TokenSelect } from "./TokenSelect"; // Adjust the import path as needed

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
  const [stakeMode, setStakeMode] = useState(
    initialMode === "lp" ? "lp" : "single"
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
  const [isLoading, setIsLoading] = useState(false);
  const [calculationVisible, setCalculationVisible] = useState(false);
  const [aprEstimate, setAprEstimate] = useState<string>("0");

  const { connected, account, signAndExecuteTransactionBlock } = useWallet();

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

  // Initialize component with initialToken if providedz
  useEffect(() => {
    console.log("initialToken received in StakingComponent:", initialToken);
    console.log("Effect triggered → initialToken:", initialToken, "connected:", connected);
  
    const initializeWithToken = async () => {
      if (!initialToken || !account?.address) return;

      try {
        // Determine if it's an LP token or single token
        const isLp = initialToken.includes("::pair::LPCoin<");
        console.log("Is LP token?", isLp);

        if (isLp) {
          setStakeMode("lp");

          // Extract the token types from LP token
          const match = initialToken.match(/LPCoin<([^,]+),\s*([^>]+)>/);

          if (match) {
            const normalizeAddress = (type: string) => {
              const parts = type.split("::");
              if (parts.length === 3 && !parts[0].startsWith("0x")) {
                parts[0] = `0x${parts[0]}`;
              }
              return parts.join("::");
            };
        
            // ✅ Apply normalization
            const token0Type = normalizeAddress(match[1].trim());
            const token1Type = normalizeAddress(match[2].trim());
        
            console.log("➡️ token0Type (normalized):", token0Type);
            console.log("➡️ token1Type (normalized):", token1Type);
        


            console.log("LP detected:", isLp);
console.log("Setting token0:", token0Type);
console.log("Setting token1:", token1Type);

console.log("Single token detected:", initialToken);

console.log("🔥 Auto-selecting Token1:", token1?.id);


            // Try to get token metadata
            console.log("Fetching metadata for token0:", token0Type);
            const token0Metadata = await suiClient
              .getCoinMetadata({
                coinType: token0Type,
              })
              .catch(() => null);

              console.log("Fetching metadata for token1:", token1Type);


            const token1Metadata = await suiClient
              .getCoinMetadata({
                coinType: token1Type,
              })
              .catch(() => null);


              console.log("the rest is ",token1Metadata)

              console.log("the 2nd rest is",token0Metadata)

            // Set token0 and token1

            console.log("➡️ token0Type (raw):", token0Type);


            if (token0Metadata) {
              setToken0({
                id: token0Type,
                name:
                  token0Metadata.name ||
                  token0Type.split("::").pop() ||
                  "Unknown",
                symbol:
                  token0Metadata.symbol ||
                  token0Type.split("::").pop() ||
                  "Unknown",
                type: token0Type,
                decimals: token0Metadata.decimals || 9,
              });
            }

            setToken1({
              id: token1Type,
              name:
                token1Metadata?.name || token1Type.split("::").pop() || "Unknown",
              symbol:
                token1Metadata?.symbol || token1Type.split("::").pop() || "Unknown",
              type: token1Type,
              decimals: token1Metadata?.decimals || 9,
            });
            
            

            console.log("🔥 Auto-selectingggg Token1:", token1?.id);
            console.log("🔥 Auto-selectingggg Token2:", token1?.id); 

            // Set LP info
            setLpInfo({
              id: initialToken, // <-- This is the correct full LP token type
              token0Type,
              token1Type,
            });
            
            console.log("✅ lpInfo.id set to:", initialToken);


            // Fetch LP token balance
            fetchLpBalance(token0Type, token1Type);
          }
        } else {
          setStakeMode("single");

          // Try to get token metadata
          const metadata = await suiClient
            .getCoinMetadata({
              coinType: initialToken,
            })
            .catch(() => null);

          if (metadata) {
            const tokenInfo: TokenInfo = {
              id: initialToken,
              name:
                metadata.name || initialToken.split("::").pop() || "Unknown",
              symbol:
                metadata.symbol || initialToken.split("::").pop() || "Unknown",
              type: initialToken,
              decimals: metadata.decimals || 9,
            };


            

            console.log("Setting single token:", tokenInfo);


            setSingleToken(tokenInfo);

            // Fetch token balance
            fetchTokenBalance(initialToken);
          }
        }
      } catch (error) {
        console.error("Error initializing with token:", error);
      }
    };

    initializeWithToken();
  }, [initialToken, account?.address]);



  

  // Calculate stake amount based on percentage
  useEffect(() => {
    if (stakeMode === "single" && singleToken) {
      const amount =
        (BigInt(singleTokenBalance) * BigInt(stakePercentage)) / BigInt(100);
      setStakeAmount(amount.toString());
    } else if (stakeMode === "lp" && lpInfo) {
      const amount =
        (BigInt(lpBalance) * BigInt(stakePercentage)) / BigInt(100);
      setStakeAmount(amount.toString());
    }
  }, [
    stakePercentage,
    singleTokenBalance,
    lpBalance,
    stakeMode,
    singleToken,
    lpInfo,
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
      // Get coins of the specific type
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: tokenType,
      });

      // Calculate total balance
      const totalBalance = coins.data.reduce(
        (acc, coin) => acc + BigInt(coin.balance),
        BigInt(0)
      );

      setSingleTokenBalance(totalBalance.toString());

      // Fetch APR for this token
      fetchAprEstimate(tokenType);
    } catch (error) {
      console.error(`Error fetching balance for ${tokenType}:`, error);
      setSingleTokenBalance("0");
    }
  };

  // Fetch LP token balance
  const fetchLpBalance = async (token0Type: string, token1Type: string) => {
    if (!account?.address) return;

    try {
      // Sort tokens first to maintain consistency
      const { token0Type: sortedToken0, token1Type: sortedToken1 } =
        await sortTokens(token0Type, token1Type);


        const normalizeType = (type: string) =>
          type.startsWith("0x") ? type : `0x${type}`;
    
        const normalizedToken0 = normalizeType(sortedToken0);
        const normalizedToken1 = normalizeType(sortedToken1);
    
        console.log("sortedToken0:", normalizedToken0);
        console.log("sortedToken1:", normalizedToken1);
        console.log("PACKAGE_ID:", CONSTANTS.PACKAGE_ID);
        console.log("MODULES.PAIR:", CONSTANTS.MODULES.PAIR);
    
        // Construct LP token type
        const lpTokenType = `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.PAIR}::LPCoin<${normalizedToken0}, ${normalizedToken1}>`;
    
      // use the full LP type passed as prop


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

      setLpBalance(totalBalance.toString());
      setLpTokens(coins.data);

      // Set LP info
      setLpInfo({
        token0Type: sortedToken0,
        token1Type: sortedToken1,
        balance: totalBalance.toString(),
        name: `${sortedToken0.split("::").pop()}-${sortedToken1
          .split("::")
          .pop()} LP`,
        symbol: "LP",
      });

      

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
        // Get coins to use for staking
        const coins = await suiClient.getCoins({
          owner: account.address,
          coinType: singleToken.type,
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
            )}, have ${formatBalance(singleTokenBalance, singleToken.decimals)}`
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
          stakeCoin = tx.splitCoins(tx.object(selectedCoins[0].coinObjectId), [
            tx.pure.u64(targetAmount.toString()),
          ])[0];
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

        // Add stake_single call
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::stake_single`,
          arguments: [
            tx.object(CONSTANTS.FARM_ID),
            stakeCoin,
            tx.object(CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID),
          ],
          typeArguments: [singleToken.type],
        });
      } else if (stakeMode === "lp" && lpInfo && token0 && token1) {
        // Validate inputs
        console.log('LP Tokens:', lpTokens);
        console.log('LP Info:', lpInfo);
        console.log('Stake Amount:', stakeAmount);
      
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
          : lpTokensArray.filter(token => BigInt(token.balance) >= targetAmount);
      
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
            const splitCoin = tx.splitCoins(lpObject, [tx.pure.u64(targetAmount.toString())])[0];
            lpCoin = [splitCoin];
          }
        } else {
          // We need multiple LP coins
          // First merge all coins into the first one
          const primaryLpCoin = tx.object(selectedCoins[0].coinObjectId);
          const otherLpCoins = selectedCoins.slice(1).map(coin => tx.object(coin.coinObjectId));
      
          tx.mergeCoins(primaryLpCoin, otherLpCoins);
      
          // Calculate total balance of all selected coins
          const totalSelected = selectedCoins.reduce(
            (sum, coin) => sum + BigInt(coin.balance), 0n
          );
      
          // If total is more than needed, split to get exact amount
          if (totalSelected > targetAmount) {
            const splitCoin = tx.splitCoins(primaryLpCoin, [tx.pure.u64(targetAmount.toString())])[0];
            lpCoin = [splitCoin];
          } else {
            lpCoin = [primaryLpCoin];
          }
        }
      
        // Create the vector for LP coins
        const vectorArg = tx.makeMoveVec({
          objects: lpCoin // Use 'objects' instead of 'elements'
        });
      
        // Build stake_lp transaction with proper arguments
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::stake_lp`,
          typeArguments: [lpInfo.token0Type, lpInfo.token1Type],
          arguments: [
            tx.object(CONSTANTS.FARM_ID),
            vectorArg,
            tx.pure.u256(targetAmount.toString()), // Changed to u256
            tx.object(CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID)
          ]
        });
      
        console.log("Transaction Args:", {
          farmId: CONSTANTS.FARM_ID,
          vectorArg,
          targetAmount: targetAmount.toString(),
          treasuryCapId: CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID,
          typeArgs: [lpInfo.token0Type, lpInfo.token1Type]
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

  useEffect(() => {
    console.log("initialToken received in StakingComponent:", initialToken);

    
  }, [initialToken]);

  useEffect(() => {
    console.log("🔥 Auto-selecting Token0:", token0?.id);
    console.log("🔥 Auto-selecting Token1:", token1?.id);
  }, [token0, token1]);
  
  

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

  return (
    <div className="card-bg-premium rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="accent-line"></div>
        <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
          <FaTractor className="text-yellow-400" />
          <span className="text-shimmer-gold">Stake Tokens</span>
        </h2>
      </div>

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
  selectedTokenId={singleToken?.id}
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
                      {formatBalance(singleTokenBalance, singleToken.decimals)}{" "}
                      {singleToken.symbol}
                    </span>
                  </div>

                  {/* Staking Amount */}
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

                      {/* Percentage selection buttons */}
                      <div className="flex gap-2 mt-3">
                        {[25, 50, 75, 100].map((percentage) => (
                          <button
                            key={percentage}
                            onClick={() => setStakePercentage(percentage)}
                            className={`flex-1 py-2 px-2 rounded text-sm font-medium transition-colors ${
                              stakePercentage === percentage
                                ? "bg-yellow-600 text-white"
                                : "bg-blue-900/60 text-blue-300 hover:bg-blue-800"
                            }`}
                          >
                            {percentage}%
                          </button>
                        ))}
                      </div>
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
                    onClick={() => setCalculationVisible(!calculationVisible)}
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
                        Stake {formatBalance(stakeAmount, singleToken.decimals)}{" "}
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


              {lpBalance === "0" && token0 && token1 && (
  <div className="text-yellow-400 bg-blue-900/30 p-4 rounded-lg text-sm mt-4 border border-yellow-500/20">
    <p>You don’t have any LP tokens for this pool.</p>
    <a
      href={`https://testthing2.vercel.app/#/addliquidity`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-300 underline mt-2 inline-block"
    >
      Provide Liquidity on SuiDex
    </a>
  </div>
)}



              {lpInfo && token0 && token1 && (
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

                  {/* Staking Amount */}
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

                      {/* Percentage selection buttons */}
                      <div className="flex gap-2 mt-3 ">
                        {[25, 50, 75, 100].map((percentage) => (
                          <button
                            key={percentage}
                            onClick={() => setStakePercentage(percentage)}
                            className={`flex-1 py-2 px-2 rounded text-sm font-medium transition-colors ${
                              stakePercentage === percentage
                                ? "bg-yellow-600 text-white"
                                : "bg-blue-900/60 text-blue-300 hover:bg-blue-800"
                            }`}
                          >
                            {percentage}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LP Details Section if LP is selected */}
            {lpInfo && token0 && token1 && (
              <div className="card-bg-premium p-5 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <FaInfoCircle className="text-yellow-400" />
                    <span>LP Information</span>
                  </h3>
                  <button
                    onClick={() => setCalculationVisible(!calculationVisible)}
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
                    <p className="text-blue-300 text-sm mb-2">Your LP Tokens</p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {lpTokens.map((token, index) => (
                        <div
                          key={index}
                          className="bg-blue-900/50 p-2 rounded-lg text-white text-sm"
                        >
                          <div className="flex justify-between">
                            <span>LP Token {index + 1}</span>
                            <span>{formatBalance(token.balance, 9)} LP</span>
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
                        Stake {formatBalance(stakeAmount, 9)} {token0.symbol}-
                        {token1.symbol} LP
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
