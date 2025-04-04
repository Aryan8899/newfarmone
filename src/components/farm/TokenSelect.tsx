import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { createPortal } from "react-dom";
import {
  FaSearch,
  FaChevronDown,
  FaSpinner,
  FaExclamationCircle,
  FaCheck,
  FaCoins,
  FaExchangeAlt,
  FaTimes,
  FaSync,
  FaWallet,
} from "react-icons/fa";
import { suiClient } from "../../utils/suiClient";
import { toast } from "sonner";

// Token information interfaces
interface TokenMetadata {
  name: string;
  symbol: string;
  iconUrl?: string;
  image?: string;
  decimals?: number;
}

interface TokenInfo {
  id: string;
  type: string;
  coinType: string;
  allObjectIds: string[];
  totalBalance: string;
  metadata?: TokenMetadata;
}

interface TokenSelectProps {
  onSelect: (tokenInfo: {
    id: string;
    type: string;
    allObjectIds: string[];
    coinType: string;
  }) => void;
  label: string;
  selectedTokenId?: string;
  excludeTokenTypes?: string[];
  includeLP?: boolean;
  disabled?: boolean;
  
  placeholder?: string;
  autoLoad?: boolean; // New prop to control initial loading
}

// Local storage constants
const CACHE_KEY = "sui_token_cache";
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds
const TOKEN_METADATA_CACHE = new Map<string, TokenMetadata>();
const DEFAULT_TOKEN_IMAGE = "https://assets.crypto.ro/logos/sui-sui-logo.png";




// Default SUI token as fallback
const DEFAULT_TOKENS: TokenInfo[] = [
  {
    id: "0x2::sui::SUI",
    type: "0x2::coin::Coin<0x2::sui::SUI>",
    coinType: "0x2::sui::SUI",
    allObjectIds: ["0x2::sui::SUI"],
    totalBalance: "0",
    metadata: {
      name: "Sui",
      symbol: "SUI",
      iconUrl: DEFAULT_TOKEN_IMAGE,
      decimals: 9,
    },
  },
];

// Helper function to load token cache from localStorage
const loadCachedTokens = (): Record<string, TokenInfo> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return {};

    const { data, timestamp } = JSON.parse(cached);

    // Check if cache is still valid
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return {};
    }

    return data;
  } catch (error) {
    console.warn("Failed to load cached tokens:", error);
    return {};
  }
};

// Save token data to localStorage
const saveTokensToCache = (tokens: Record<string, TokenInfo>) => {
  try {
    const data = {
      data: tokens,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to cache tokens:", error);
  }
};

// Exponential backoff retry function to handle network issues
const retry = async <T,>(
  fn: () => Promise<T>,
  options = {
    maxRetries: 3,
    baseDelay: 1000,
    increaseFactor: 2,
    jitter: 0.2, // 20% jitter
  }
): Promise<T> => {
  let retries = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries >= options.maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay =
        options.baseDelay *
        Math.pow(options.increaseFactor, retries) *
        (1 - options.jitter + Math.random() * options.jitter * 2);

      console.log(`Retry ${retries} after ${delay.toFixed(0)}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Token list item component (memoized for performance)
const TokenListItem = memo(
  ({
    token,
    isSelected,
    onSelect,
  }: {
    token: TokenInfo;
    isSelected: boolean;
    onSelect: (token: TokenInfo) => void;
  }) => {
    // Format balance for display
    const formatBalance = (balance: string, decimals: number = 9): string => {
      try {
        const value = Number(balance) / Math.pow(10, decimals);

        // Use compact notation for large numbers
        if (value > 1000000) {
          return value.toLocaleString("en-US", {
            notation: "compact",
            maximumFractionDigits: 2,
          });
        }

        // Regular formatting with up to 4 decimal places
        return value.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        });
      } catch (e) {
        return "0";
      }
    };

    const isLP = token.type.includes("LPCoin");

    // Render token icon with fallback
    const renderTokenIcon = () => {
      if (token.metadata?.iconUrl || token.metadata?.image) {
        return (
          <div className="relative w-6 h-6">
            <img
              src={
                token.metadata?.iconUrl ||
                token.metadata?.image ||
                DEFAULT_TOKEN_IMAGE
              }
              alt={token.metadata?.symbol || "Token"}
              className="w-full h-full rounded-full bg-blue-900 object-contain"
              onError={(e) => {
                // If image fails to load, replace with fallback
                (e.target as HTMLImageElement).src = DEFAULT_TOKEN_IMAGE;
              }}
            />
          </div>
        );
      }

      // If no image, show icon based on token type
      if (isLP) {
        return (
          <div className="w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs">
            <FaExchangeAlt />
          </div>
        );
      }

      // Use first character of symbol for placeholder
      const symbol = token.metadata?.symbol || "T";
      const firstChar = symbol.charAt(0).toUpperCase();

      return (
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
          {firstChar}
        </div>
      );
    };

    return (
      <div
        className={`px-3 py-3 hover:bg-blue-800/40 cursor-pointer flex items-center justify-between
        ${isSelected ? "bg-blue-800/70" : ""}
        focus:outline-none focus:bg-blue-800/50 focus:ring-1 focus:ring-yellow-500/50
        transition-colors duration-200
      `}
        onClick={() => onSelect(token)}
        role="option"
        tabIndex={0}
        aria-selected={isSelected}
        data-token-id={token.id}
      >
        <div className="flex items-center">
          {renderTokenIcon()}
          <div className="ml-2">
            <div className="font-medium text-white flex items-center">
              {token.metadata?.symbol || "Unknown"}
              {isLP && (
                <span className="ml-1 text-xs text-yellow-400 font-normal">
                  LP
                </span>
              )}
            </div>
            <div className="text-xs text-blue-300 truncate max-w-[150px]">
              {token.metadata?.name || "Unknown Token"}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="text-sm text-right text-white">
            {formatBalance(token.totalBalance, token.metadata?.decimals || 9)}
          </div>
          {isSelected && <FaCheck className="ml-2 text-yellow-400" />}
        </div>
      </div>
    );
  }
);

// Token skeleton for loading state
const TokenSkeleton = () => (
  <div className="px-3 py-3 flex items-center justify-between animate-pulse">
    <div className="flex items-center">
      <div className="w-6 h-6 rounded-full bg-blue-700/50"></div>
      <div className="ml-2">
        <div className="h-4 w-20 bg-blue-700/50 rounded mb-1"></div>
        <div className="h-3 w-16 bg-blue-700/50 rounded"></div>
      </div>
    </div>
    <div className="h-4 w-12 bg-blue-700/50 rounded"></div>
  </div>
);

// Portal component for modal
const Portal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Add event listener for Escape key
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);

    // Adding body locking to prevent background scrolling
    document.body.style.overflow = "hidden";

    return () => {
      setMounted(false);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return mounted
    ? createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out"
          onClick={handleOverlayClick}
        >
          {children}
        </div>,
        document.body
      )
    : null;
};

// The main TokenSelect component
export function TokenSelect({
  onSelect,
  label,
  selectedTokenId,
  excludeTokenTypes = [],
  includeLP = false,
  disabled = false,
  placeholder = "Select Token",
  autoLoad = false, // Default to manual loading
}: TokenSelectProps) {
  // State management
  const [hasLoaded, setHasLoaded] = useState(false);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(autoLoad);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [tokenDataCache, setTokenDataCache] = useState<
    Record<string, TokenInfo>
  >(loadCachedTokens());
  const [networkFailed, setNetworkFailed] = useState<boolean>(false);
  const [requestsPending, setRequestsPending] = useState<boolean>(false);

  // Refs for DOM elements
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);
  const fetchAttemptsRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { account } = useWallet();

  // Debounce search input
  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (!term) {
        setFilteredTokens(tokens);
        return;
      }

      const searchTermLower = term.toLowerCase();
      const filtered = tokens.filter(
        (token) =>
          token.metadata?.name?.toLowerCase().includes(searchTermLower) ||
          token.metadata?.symbol?.toLowerCase().includes(searchTermLower) ||
          token.id.toLowerCase().includes(searchTermLower) ||
          token.coinType.toLowerCase().includes(searchTermLower)
      );

      setFilteredTokens(filtered);
    }, 300),
    [tokens]
  );

  // Filter tokens based on search term
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Set tokens for initial filter
  useEffect(() => {
    if (tokens.length > 0) {
      setFilteredTokens(tokens);
    }
  }, [tokens]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Find token by ID when selectedTokenId prop changes
  useEffect(() => {

    
    if (!selectedTokenId || tokens.length === 0) return;
  
    if (selectedToken?.id === selectedTokenId) return;
  
    const normalizeType = (t: string) =>
      t
        .replace(/^0x/, "")      // remove leading 0x
        .replace(/^0+/, "")      // remove leading zeros after 0x
        .toLowerCase();
    

    const normalizedSelected = normalizeType(selectedTokenId);
  
    const match = tokens.find((t) => {
      const tokenIdNorm = normalizeType(t.id);
      const coinTypeNorm = normalizeType(t.coinType);
      const objectIdMatch = t.allObjectIds.some(
        (id) => normalizeType(id) === normalizedSelected
      );
      return (
        tokenIdNorm === normalizedSelected ||
        coinTypeNorm === normalizedSelected ||
        objectIdMatch
      );
    });
    
  
  
    if (match) {
      setSelectedToken(match);
    }
  }, [selectedTokenId, tokens, selectedToken]);
  
  

  

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);


  

  // Helper: Extract coin type from type string
  const extractCoinType = (typeString: string): string | null => {
    if (!typeString || typeof typeString !== "string") return null;

    // Format: 0x...::coin::Coin<0x...::TOKEN>
    const coinMatch = typeString.match(/<(.+)>/);
    if (coinMatch) return coinMatch[1];

    // Format: 0x...::module::TOKEN
    return typeString;
  };

  // Helper: Check if token is an LP token
  const isLPToken = (typeString: string, metadata?: any): boolean => {
    if (!typeString) return false;

    return (
      typeString.includes("::pair::LPCoin<") ||
      typeString.includes("::LPCoin<") ||
      (metadata?.name && metadata.name.includes("LP")) ||
      (metadata?.symbol && metadata.symbol.includes("LP"))
    );
  };

  // Helper: Get simplified token name from type
  const getSimplifiedName = (type: string): string => {
    const parts = type.split("::");
    return parts.length >= 3 ? parts[2] : type;
  };

  // Optimized batch fetch for coin metadata
  const batchFetchMetadata = async (
    coinTypes: string[]
  ): Promise<Record<string, any>> => {
    try {
      const results: Record<string, any> = {};
      const typesToFetch: string[] = [];

      // Check cache first for each type
      coinTypes.forEach((coinType) => {
        if (TOKEN_METADATA_CACHE.has(coinType)) {
          results[coinType] = TOKEN_METADATA_CACHE.get(coinType);
        } else {
          typesToFetch.push(coinType);
        }
      });

      // If all types were cached, return immediately
      if (typesToFetch.length === 0) {
        return results;
      }

      // Process in small batches to avoid too many concurrent requests
      const batchSize = 3; // Reduced batch size to avoid resource errors
      for (let i = 0; i < typesToFetch.length; i += batchSize) {
        const batch = typesToFetch.slice(i, i + batchSize);

        // Use Promise.allSettled to continue even if some requests fail
        const batchPromises = batch.map((coinType) =>
          retry(() =>
            suiClient
              .getCoinMetadata({ coinType })
              .then((metadata) => ({ coinType, metadata, success: true }))
              .catch(() => ({ coinType, metadata: null, success: false }))
          )
        );

        // Add a small delay between batches to avoid overwhelming the node
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const batchResults = await Promise.allSettled(batchPromises);

        // Process results including both fulfilled and rejected promises
        batchResults.forEach((result) => {
          if (result.status === "fulfilled") {
            const { coinType, metadata, success } = result.value;

            if (success && metadata) {
              // Need to ensure iconUrl is not null for TypeScript compatibility
              const safeMetadata: TokenMetadata = {
                name: metadata.name || "",
                symbol: metadata.symbol || "",
                decimals: metadata.decimals || 9,
                // Convert null to undefined for iconUrl
                iconUrl: metadata.iconUrl || undefined,
              };

              // Store in results and cache
              results[coinType] = safeMetadata;
              TOKEN_METADATA_CACHE.set(coinType, safeMetadata);
            }
          }
        });
      }

      return results;
    } catch (error) {
      console.error("Error in batch fetching metadata:", error);
      return {};
    }
  };


  

  // Fetch token data with improved error handling and caching
  const fetchTokens = useCallback(
    async (forceRefresh = false) => {
      if (!account?.address) {
        setIsLoading(false);
        return;
      }

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setIsRetrying(false);
      setError(null);
      setRequestsPending(true);

      // Increment fetch attempts
      fetchAttemptsRef.current += 1;

      try {
        // If we already have cached data, use it initially
        const cachedTokensMap = tokenDataCache;
        if (!forceRefresh && Object.keys(cachedTokensMap).length > 0) {
          // Apply filters to cached tokens
          const cachedTokensList = Object.values(cachedTokensMap).filter(
            (token) => {
              const isLP = token.type.includes("LPCoin");
              if (isLP && !includeLP) return false;
              if (
                excludeTokenTypes.some((type) => token.coinType.includes(type))
              )
                return false;
              return true;
            }
          );

          if (cachedTokensList.length > 0) {
            setTokens(cachedTokensList);
            setIsLoading(false);

            // If we've had network failures, don't try to fetch fresh data
            if (networkFailed && fetchAttemptsRef.current > 2) {
              setRequestsPending(false);
              return;
            }
          }
        }

        // Use retry mechanism to handle potential network failures
        const fetchedTokens = await retry(
          async () => {
            // Fetch user's coin objects with optimized query
            const coinObjects = await suiClient.getOwnedObjects({
              owner: account.address,
              filter: {
                StructType: "0x2::coin::Coin", // Filter for coins only
              },
              options: {
                showType: true,
                showContent: true,
                showDisplay: true,
              },
              // Use a smaller limit to reduce payload size
              limit: 25,
            });

            // Group coins by their type for efficient processing
            const coinTypeMap = new Map<
              string,
              {
                ids: string[];
                type: string;
                coinType: string;
                balance: bigint;
                metadata?: TokenMetadata;
              }
            >();

            // Process each coin object
            for (const obj of coinObjects.data) {
              if (!obj.data?.type) continue;

              const typeString = obj.data.type;
              const coinType = extractCoinType(typeString);
              if (!coinType) continue;

              // Check if we should include or exclude this token
              if (excludeTokenTypes.some((type) => coinType.includes(type))) {
                continue;
              }

              // Handle LP tokens inclusion/exclusion
              const objMetadata = obj.data.display?.data;
              const isLP = isLPToken(typeString, objMetadata);
              if (isLP && !includeLP) {
                continue;
              }

              // Extract balance
              let balance = 0n;
              if (
                obj.data.content &&
                typeof obj.data.content === "object" &&
                "fields" in obj.data.content
              ) {
                const fields = obj.data.content.fields;
                if (
                  fields &&
                  typeof fields === "object" &&
                  "balance" in fields
                ) {
                  balance = BigInt((fields.balance as string) || 0);
                }
              }

              // Skip tokens with zero balance
              if (balance <= 0n) continue;

              // Get display data if available
              let displayData = null;
              try {
                if (obj.data.display?.data) {
                  displayData = obj.data.display.data;
                }
              } catch (e) {
                console.warn("Error parsing display data:", e);
              }

              // Simplified coin name
              const simpleCoinType = getSimplifiedName(coinType);

              // Get or create entry in the map
              if (coinTypeMap.has(coinType)) {
                const entry = coinTypeMap.get(coinType)!;
                entry.ids.push(obj.data.objectId);
                entry.balance += balance;

                // Update display data if better information is available
                if (displayData && displayData.name && !entry.metadata?.name) {
                  entry.metadata = {
                    ...entry.metadata,
                    name: displayData.name as string,
                    symbol: (displayData.symbol as string) || simpleCoinType,
                    iconUrl: (displayData.image_url as string) || undefined,
                  };
                }
              } else {
                coinTypeMap.set(coinType, {
                  ids: [obj.data.objectId],
                  type: typeString,
                  coinType,
                  balance,
                  metadata: displayData
                    ? {
                      name: (displayData.name as string) || simpleCoinType,
                      symbol:
                        (displayData.symbol as string) ||
                        simpleCoinType.substring(0, 3).toUpperCase(),
                      iconUrl: (displayData.image_url as string) || undefined,
                    }
                    : {
                      name: simpleCoinType,
                      symbol: simpleCoinType.substring(0, 3).toUpperCase(),
                    },
                });
              }
            }

            // If no tokens found, use default tokens
            if (coinTypeMap.size === 0) {
              return DEFAULT_TOKENS;
            }

            // Batch fetch metadata for all coin types
            const coinTypes = Array.from(coinTypeMap.keys());
            const metadataResults = await batchFetchMetadata(coinTypes);

            // Update with fetched metadata
            for (const [coinType, metadata] of Object.entries(
              metadataResults
            )) {
              if (coinTypeMap.has(coinType)) {
                const entry = coinTypeMap.get(coinType)!;
                entry.metadata = {
                  name:
                    metadata.name ||
                    entry.metadata?.name ||
                    getSimplifiedName(coinType),
                  symbol:
                    metadata.symbol ||
                    entry.metadata?.symbol ||
                    getSimplifiedName(coinType).substring(0, 3).toUpperCase(),
                  iconUrl: metadata.iconUrl || entry.metadata?.iconUrl,
                  decimals: metadata.decimals || 9,
                };
              }
            }

            // Convert to list and sort
            return Array.from(coinTypeMap.values())
              .filter((entry) => entry.balance > 0n) // Only show tokens with positive balance
              .map((entry) => ({
                id: entry.ids[0],
                type: entry.type,
                coinType: entry.coinType,
                allObjectIds: entry.ids,
                totalBalance: entry.balance.toString(),
                metadata: entry.metadata,
              }))
              .sort((a, b) => {
                // Sort by balance (highest first)
                return Number(BigInt(b.totalBalance) - BigInt(a.totalBalance));
              });
          },
          { maxRetries: 2, baseDelay: 0, increaseFactor: 1, jitter: 0, }
        ); // Only retry twice to avoid overwhelming

        

        if (fetchedTokens) {
          // Update tokens and cache
          setTokens(fetchedTokens);
          setNetworkFailed(false);

          
          console.log("✅ All fetched token coinTypes:", fetchedTokens.map(t => t.coinType));

          // Cache tokens by ID for faster access
          const newCache: Record<string, TokenInfo> = {};
          fetchedTokens.forEach((token) => {
            newCache[token.id] = token;
            // Also cache by all object IDs
            token.allObjectIds.forEach((id) => {
              newCache[id] = token;
            });
          });


          
          // Update the local cache state
          setTokenDataCache(newCache);

          // Save to localStorage for persistence
          saveTokensToCache(newCache);

          // Select the previously selected token if it still exists
          if (selectedToken) {
            const refreshedToken = fetchedTokens.find(
              (t) => t.coinType === selectedToken.coinType
            );
            if (refreshedToken) {
              setSelectedToken(refreshedToken);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
        toast.error("Network error when fetching tokens");
        setError("Network error. Using cached data.");
        setNetworkFailed(true);

        // If we have a cache, use it despite the error
        if (Object.keys(tokenDataCache).length > 0) {
          const cachedTokensList = Object.values(tokenDataCache).filter(
            (token) => {
              const isLP = token.type.includes("LPCoin");
              if (isLP && !includeLP) return false;
              if (
                excludeTokenTypes.some((type) => token.coinType.includes(type))
              )
                return false;
              return true;
            }
          );


          if (cachedTokensList.length > 0) {
            setTokens(cachedTokensList);
            
          } else {
            // Fallback to default tokens if no cached data matches filters
            setTokens(DEFAULT_TOKENS);
          }
        } else {
          // Use default tokens if no cache is available
          setTokens(DEFAULT_TOKENS);
        }
      } finally {
        setIsLoading(false);
        setRequestsPending(false);
        abortControllerRef.current = null;
      }
    },
    [
      account?.address,
      excludeTokenTypes,
      includeLP,
      selectedToken,
      tokenDataCache,
      networkFailed,
    ]
  );

  // Initial fetch with delay to avoid overwhelming the network on mount
  useEffect(() => {
    // Load tokens on mount regardless of selectedTokenId
    if (!hasLoaded && !isLoading) {
      fetchTokens();
      setHasLoaded(true);
    }
  }, [hasLoaded, isLoading]);


useEffect(() => {
  console.log("💡 selectedTokenId in TokenSelect:", selectedTokenId);
}, [selectedTokenId]);

  
  

  // Manual retry with loading indicator
  const handleRetry = useCallback(() => {
    if (requestsPending) return;

    setIsRetrying(true);
    // Add a small delay to show the retry animation
    setTimeout(() => {
      fetchTokens(true).finally(() => {
        setIsRetrying(false);
      });
    }, 500);
  }, [fetchTokens, requestsPending]);

  // Handle token selection
  const handleSelect = (token: TokenInfo) => {
    console.log("Selected Token:", token); // Log the selected token
    setSelectedToken(token);
    setIsOpen(false);
    onSelect({
      id: token.id,
      type: token.type,
      coinType: token.coinType,
      allObjectIds: token.allObjectIds,
    });
    setSearchTerm(""); // Clear search when token is selected
  };

  // Format a balance for display
  const formatBalance = (balance: string, decimals: number = 9): string => {
    try {
      const value = Number(balance) / Math.pow(10, decimals);

      // Use compact notation for large numbers
      if (value > 1000000) {
        return value.toLocaleString("en-US", {
          notation: "compact",
          maximumFractionDigits: 2,
        });
      }

      // Regular formatting with up to 4 decimal places
      return value.toLocaleString("en-US", {
        maximumFractionDigits: 4,
      });
    } catch (e) {
      console.error("Error formatting balance:", e);
      return "0";
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const activeElement = document.activeElement;
    const tokenElements =
      dropdownListRef.current?.querySelectorAll('[role="option"]');

    if (!tokenElements || tokenElements.length === 0) return;

    const firstToken = tokenElements[0] as HTMLElement;
    const lastToken = tokenElements[tokenElements.length - 1] as HTMLElement;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (activeElement === inputRef.current) {
          firstToken.focus();
        } else {
          const nextSibling = (activeElement as HTMLElement)
            .nextElementSibling as HTMLElement;
          if (nextSibling && nextSibling.hasAttribute("role")) {
            nextSibling.focus();
          } else {
            firstToken.focus();
          }
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (
          activeElement === inputRef.current ||
          activeElement === firstToken
        ) {
          lastToken.focus();
        } else {
          const prevSibling = (activeElement as HTMLElement)
            .previousElementSibling as HTMLElement;
          if (prevSibling && prevSibling.hasAttribute("role")) {
            prevSibling.focus();
          } else {
            lastToken.focus();
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Enter":
        if (
          activeElement !== inputRef.current &&
          activeElement?.hasAttribute("data-token-id")
        ) {
          e.preventDefault();
          const tokenId = activeElement.getAttribute("data-token-id");
          const token = tokens.find((t) => t.id === tokenId);
          if (token) {
            handleSelect(token);
          }
        }
        break;
      case "Tab":
        // Allow normal tab behavior
        break;
      default:
        // For letter keys, focus back on search input
        if (
          e.key.length === 1 &&
          e.key.match(/[a-z0-9]/i) &&
          activeElement !== inputRef.current
        ) {
          inputRef.current?.focus();
        }
        break;
    }
  };

  // Render token icon with fallback
  const renderTokenIcon = (token: TokenInfo) => {
    const isLP = token.type.includes("LPCoin");

    if (token.metadata?.iconUrl) {
      return (
        <img
          src={token.metadata.iconUrl}
          alt={token.metadata.symbol}
          className="w-6 h-6 rounded-full object-contain bg-blue-900"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_TOKEN_IMAGE;
          }}
        />
      );
    }

    // Use icon based on token type
    if (isLP) {
      return (
        <div className="w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs">
          <FaExchangeAlt />
        </div>
      );
    }

    // Use first character of symbol for placeholder
    const symbol = token.metadata?.symbol || "T";
    const firstChar = symbol.charAt(0).toUpperCase();

    return (
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
        {firstChar}
      </div>
    );
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <label className="block text-blue-300 text-sm mb-2">{label}</label>

      {/* Selected token or select button */}
      <button
        className={`w-full flex items-center justify-between p-3 
          ${
            isOpen
              ? "bg-blue-900/60 border-yellow-500/50"
              : "bg-blue-900/40 border-blue-800/50 hover:border-blue-700/50"
          } 
          border rounded-lg transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedToken ? (
          <div className="flex items-center">
            {renderTokenIcon(selectedToken)}
            <div className="ml-2 text-left">
              <div className="font-medium text-white">
                {selectedToken.metadata?.symbol}
                {selectedToken.type.includes("LPCoin") && (
                  <span className="ml-1 text-xs text-yellow-400 font-normal">
                    LP
                  </span>
                )}
              </div>
              <div className="text-xs text-blue-300">
                Balance:{" "}
                {formatBalance(
                  selectedToken.totalBalance,
                  selectedToken.metadata?.decimals || 9
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-blue-300">
            <FaWallet className="text-blue-400" />
            <span>{placeholder}</span>
          </div>
        )}
        <FaChevronDown
          className={`text-blue-300 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Token selection modal with portal for better z-index handling */}
      {isOpen && (
        <Portal onClose={handleCloseModal}>
          <div
            className="bg-blue-950 rounded-lg shadow-lg border border-blue-800/50 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col "
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-center p-4 border-b border-blue-800/50">
              <h3 className="text-lg font-medium text-white">Select Token</h3>
              <button
                onClick={handleCloseModal}
                className="text-blue-400 hover:text-white focus:outline-none"
              >
                <FaTimes />
              </button>
            </div>

            {/* Search box */}
            <div className="p-2 border-b border-blue-800/50 relative">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full pl-9 pr-2 py-2 bg-blue-900/40 border border-blue-800/50 text-white rounded-md focus:outline-none focus:border-yellow-500/50 placeholder-blue-400"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                {searchTerm && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300"
                    onClick={() => setSearchTerm("")}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center p-6 text-blue-300">
                <FaSpinner className="animate-spin mr-2" />
                <span>Loading tokens...</span>
              </div>
            )}

            {/* Error state with retry */}
            {error && (
              <div className="p-4 border border-red-500/20 m-4 rounded-lg bg-red-900/10">
                <div className="text-red-400 text-center flex flex-col items-center justify-center">
                  <FaExclamationCircle className="text-xl mb-2" />
                  <span className="mb-2">{error}</span>
                  <button
                    className="mt-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-1 rounded-md flex items-center text-sm"
                    onClick={handleRetry}
                    disabled={isRetrying || requestsPending}
                  >
                    {isRetrying ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        <span>Retrying...</span>
                      </>
                    ) : (
                      <>
                        <FaSync className="mr-2" />
                        <span>Retry</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && filteredTokens.length === 0 && (
              <div className="p-6 text-blue-300 text-center">
                {searchTerm
                  ? "No tokens found matching your search"
                  : "No tokens found in your wallet"}
              </div>
            )}

            {/* Network status indicator when using cached data */}
            {networkFailed && !isLoading && !isRetrying && (
              <div className="px-4 py-2 m-2 bg-yellow-900/20 border border-yellow-700/30 rounded-md">
                <div className="flex items-center justify-center text-yellow-400 text-xs">
                  <FaExclamationCircle className="mr-2" />
                  <span>Using cached data due to network issues</span>
                </div>
              </div>
            )}

            {/* Token list */}
            <div
              className="overflow-y-auto flex-1 max-h-[50vh] token-list-scrollbar"
              ref={dropdownListRef}
            >
              {isLoading ? (
                // Show skeletons while loading
                <>
                  <TokenSkeleton />
                  <TokenSkeleton />
                  <TokenSkeleton />
                  <TokenSkeleton />
                </>
              ) : (
                filteredTokens.map((token, index) => (
                  <TokenListItem
                  key={`${token.id}-${index}`} // Combine ID with index to ensure uniqueness
                    token={token}
                    isSelected={selectedToken?.id === token.id}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>

            {/* Footer with refresh button */}
            <div className="p-3 border-t border-blue-800/50">
              <button
                onClick={() => handleRetry()}
                disabled={isLoading || isRetrying || requestsPending}
                className="w-full flex items-center justify-center py-2 px-4 bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isRetrying ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <FaCoins className="mr-2" />
                    <span>Refresh Tokens</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* Add some global styles */}
      <style>{`
        .token-list-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .token-list-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 58, 138, 0.1);
        }

        .token-list-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.5);
          border-radius: 20px;
        }

      

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
