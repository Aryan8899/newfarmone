import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { Link } from "react-router-dom";
import { suiClient } from "../../utils/suiClient";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CONSTANTS } from "../../constants/addresses";
import {
  FaInfoCircle,
  FaArrowRight,
  FaSpinner,
  FaExchangeAlt,
  FaCoins,
  FaExclamationCircle,
  FaCheck,
  FaTractor,
} from "react-icons/fa";

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

interface PoolDetails {
  totalStakedBigInt: bigint;
  depositFee: number;
  withdrawalFee: number;
  active: boolean;
  isNativePair?: boolean;
  isLpToken?: boolean;
  allocationPoints?: number;
  error?: string;
}

// Format percentage with 4 decimal places
const formatPercentage = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return "0.0000";
  return value.toFixed(4);
};

// Utility function to format BigInt for display with commas and proper decimal places
const formatBigIntForDisplay = (
  bigIntValue: bigint | string | number,
  decimals = 9
): string => {
  if (typeof bigIntValue !== "bigint") {
    try {
      bigIntValue = BigInt(bigIntValue);
    } catch {
      return "0";
    }
  }

  const divisor = BigInt(10 ** decimals);
  const integerPart = bigIntValue / divisor;
  const fractionalPart = bigIntValue % divisor;

  // Format with commas for the integer part
  const formattedInteger = integerPart
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Only show decimal part if non-zero
  if (fractionalPart === BigInt(0)) {
    return formattedInteger;
  }

  // Format the fractional part, padding with leading zeros if needed
  let fractionalStr = fractionalPart.toString().padStart(decimals, "0");

  // Trim trailing zeros
  fractionalStr = fractionalStr.replace(/0+$/, "");

  if (fractionalStr.length === 0) {
    return formattedInteger;
  }

  return `${formattedInteger}.${fractionalStr}`;
};

// Parser specifically designed for the exact format returned by the blockchain
const parseBlockchainValue = (value: any): any => {
  // Handle undefined/null cases
  if (value === undefined || value === null) {
    return 0;
  }

  // The specific format we're dealing with is a two-element array: [[data], "type"]
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[1] === "string"
  ) {
    const [dataArray, typeStr] = value;

    // Handle u256/u64/u128 number types
    if (typeStr.startsWith("u") && Array.isArray(dataArray)) {
      try {
        // Convert to BigInt for proper handling of large numbers
        let result = BigInt(0);
        let multiplier = BigInt(1);

        for (let i = 0; i < dataArray.length; i++) {
          if (typeof dataArray[i] === "number") {
            result += BigInt(dataArray[i]) * multiplier;
            multiplier *= BigInt(256);
          }
        }

        return result;
      } catch (e) {
        console.error("Error parsing number array:", e);
        return 0;
      }
    }

    // Handle boolean type
    if (typeStr === "bool" && Array.isArray(dataArray)) {
      // Boolean array format: [1] means true, [0] means false
      if (dataArray.length === 1) {
        return dataArray[0] === 1;
      }
      return false;
    }

    // Handle string type
    if (typeStr === "string" && Array.isArray(dataArray)) {
      try {
        return String.fromCharCode(...dataArray);
      } catch (e) {
        return "";
      }
    }
  }

  // Direct number value
  if (typeof value === "number") {
    return value;
  }

  // Direct boolean value
  if (typeof value === "boolean") {
    return value;
  }

  // Simple array (not in the [data, type] format)
  if (Array.isArray(value)) {
    if (value.length === 0) return 0;

    if (value.length === 1) return parseBlockchainValue(value[0]);

    // Return the first element processed recursively
    return parseBlockchainValue(value[0]);
  }

  // For any other formats, log and return a default
  console.warn("Could not parse blockchain value:", value);
  return typeof value === "number" ? value : 0;
};

// Enhanced Pool Details Modal Component
export const PoolDetailsModal = ({
  isOpen,
  onClose,
  pool,
}: {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolType | null;
}) => {
  const [poolDetailsLoading, setPoolDetailsLoading] = useState(false);
  const [poolDetails, setPoolDetails] = useState<PoolDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { account } = useWallet();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore body scrolling when modal is closed
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Modal animation effect
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Reset animation by removing classes first
      modalRef.current.classList.remove("modal-enter", "modal-visible");

      // Force a reflow to make sure the reset takes effect
      void modalRef.current.offsetWidth;

      // Add animation classes
      modalRef.current.classList.add("modal-enter");

      // Start the animation after a slight delay
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.classList.add("modal-visible");
        }
      }, 10);
    }
  }, [isOpen]);

  // Fetch pool details when pool changes or modal opens
  useEffect(() => {
    if (!isOpen || !pool || !account?.address) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const fetchPoolDetails = async () => {
      setPoolDetailsLoading(true);
      setPoolDetails(null);
      setError(null);

      try {
        console.log(`Fetching details for pool: ${pool.displayName}`);

        // Create a transaction block to fetch pool info
        const tx = new TransactionBlock();
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::get_pool_info`,
          arguments: [tx.object(CONSTANTS.FARM_ID)],
          typeArguments: [pool.typeString],
        });

        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx as any,
          sender: account.address,
        });

        // Get the default details from the pool object
        const defaultDetails: PoolDetails = {
          totalStakedBigInt: BigInt(0),
          depositFee: pool.depositFee || 0.5,
          withdrawalFee: pool.withdrawalFee || 0.5,
          active: pool.active !== false,
          allocationPoints: pool.allocationPoints || 100,
          isLpToken: pool.isLp,
          isNativePair: pool.tokens.includes("SUI"),
        };

        // Process the blockchain result
        if (result?.results?.[0]?.returnValues) {
          const returnValues = result.results[0].returnValues;

          // Parse the return values
          // Typically: [totalStaked, depositFee, withdrawalFee, active, isNativePair, isLpToken]
          const parsedValues = returnValues.map(parseBlockchainValue);

          if (parsedValues.length >= 1 && typeof parsedValues[0] === "bigint") {
            defaultDetails.totalStakedBigInt = parsedValues[0];
          }

          if (parsedValues.length >= 2 && typeof parsedValues[1] === "number") {
            // Convert basis points to percentage (10000 = 100%)
            defaultDetails.depositFee = parsedValues[1] / 100;
          }

          if (parsedValues.length >= 3 && typeof parsedValues[2] === "number") {
            // Convert basis points to percentage (10000 = 100%)
            defaultDetails.withdrawalFee = parsedValues[2] / 100;
          }

          if (parsedValues.length >= 4) {
            defaultDetails.active = Boolean(parsedValues[3]);
          }

          if (parsedValues.length >= 5) {
            defaultDetails.isNativePair = Boolean(parsedValues[4]);
          }

          if (parsedValues.length >= 6) {
            defaultDetails.isLpToken = Boolean(parsedValues[5]);
          }
        }

        setPoolDetails(defaultDetails);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching pool details:", err);
        setError(err.message || "Failed to fetch pool details");

        // Still set default details
        setPoolDetails({
          totalStakedBigInt: BigInt(0),
          depositFee: pool.depositFee || 0.5,
          withdrawalFee: pool.withdrawalFee || 0.5,
          active: pool.active !== false,
          allocationPoints: pool.allocationPoints || 100,
          isLpToken: pool.isLp,
          isNativePair: pool.tokens.includes("SUI"),
          error: err.message,
        });
      } finally {
        setPoolDetailsLoading(false);
        abortControllerRef.current = null;
      }
    };

    fetchPoolDetails();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, pool, account?.address]);

  if (!isOpen || !pool) return null;

  // Handle overlay click (close modal when clicking outside)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        ref={modalRef}
        className="bg-blue-950 rounded-xl border border-blue-800/50 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden modal-animation flex flex-col lg:-mt-420 md:-mt-400 -mt-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-blue-800/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {pool.isLp ? (
              <FaExchangeAlt className="text-yellow-400" />
            ) : (
              <FaCoins className="text-yellow-400" />
            )}
            Pool Details: {pool.displayName}
          </h3>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white transition-colors focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {poolDetailsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaSpinner className="text-yellow-400 text-3xl animate-spin mb-4" />
              <p className="text-blue-200 text-center">
                Loading pool details...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-400/50 text-red-200 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FaExclamationCircle />
                <p className="font-medium">Error Loading Details</p>
              </div>
              <p>{error}</p>
            </div>
          ) : poolDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-900/30 rounded-lg p-4 shadow-inner border border-blue-800/40">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <FaInfoCircle className="text-yellow-400" />
                    Pool Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-300">Type:</span>
                      <span className="text-white font-medium flex items-center gap-1">
                        {poolDetails.isLpToken ? (
                          <>
                            <FaExchangeAlt className="text-yellow-400 text-sm" />
                            LP Token
                          </>
                        ) : (
                          <>
                            <FaCoins className="text-green-400 text-sm" />
                            Single Asset
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300">Total Staked:</span>
                      <span className="text-white font-medium bg-blue-900/40 px-2 py-1 rounded text-sm">
                        {formatBigIntForDisplay(poolDetails.totalStakedBigInt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Allocation Points:</span>
                      <span className="text-white font-medium">
                        {poolDetails.allocationPoints ||
                          pool.allocationPoints ||
                          "100"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Status:</span>
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          poolDetails.active ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {poolDetails.active ? (
                          <>
                            <FaCheck className="text-xs" />
                            Active
                          </>
                        ) : (
                          <>
                            <FaExclamationCircle className="text-xs" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/30 rounded-lg p-4 shadow-inner border border-blue-800/40">
                  <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <FaCoins className="text-green-400" />
                    Fee Structure
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-300">Deposit Fee:</span>
                      <span className="text-white font-medium">
                        {formatPercentage(poolDetails.depositFee)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Withdrawal Fee:</span>
                      <span className="text-white font-medium">
                        {formatPercentage(poolDetails.withdrawalFee)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">LP Token:</span>
                      <span className="text-white font-medium">
                        {poolDetails.isLpToken ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Native Pair:</span>
                      <span className="text-white font-medium">
                        {poolDetails.isNativePair ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/30">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <FaInfoCircle className="text-blue-400" />
                  Token Details
                </h4>
                <div className="mb-2">
                  <span className="text-blue-300 text-sm">
                    Token Type String:
                  </span>
                  <div className="mt-1 p-2 rounded bg-blue-900/40 border border-blue-800/40 overflow-x-auto">
                    <code className="text-white text-sm font-mono break-all">
                      {pool.typeString}
                    </code>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {pool.tokens.map((token, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pool.isLp
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}
                    >
                      {token}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-blue-800/50 mt-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2"
                  >
                    Close Details
                  </button>
                  <Link
                    to={`/pool/${encodeURIComponent(pool.typeString)}`}
                    className="flex-1"
                  >
                    <button className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2">
                      <FaTractor />
                      <span>Farm This Pool</span>
                      <FaArrowRight />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-blue-300">
              <p>No details available</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal animation styles */}
      <style>{`
        .modal-animation {
          transform: scale(0.9);
          opacity: 0;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .modal-enter {
          transform: scale(0.9);
          opacity: 0;
        }

        .modal-visible {
          transform: scale(1);
          opacity: 1;
        }
      `}</style>
    </div>
  );
};
