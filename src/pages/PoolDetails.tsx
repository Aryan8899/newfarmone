// src/pages/PoolDetails.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import {
  FaTractor,
  FaChartLine,
  FaCoins,
  FaExchangeAlt,
  FaInfoCircle,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaHistory,
  FaStar,
  FaUsers,
  FaFireAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useBackground } from "../contexts/BackgroundContext";
import { CONSTANTS } from "../constants/addresses";
import StakingComponent from "../components/farm/StakingComponent";

// Pool Details Stat Card
const PoolStatCard = ({
  title,
  value,
  icon,
  description = null,
  suffix = "",
  trending = null,
}: any) => {
  const Icon = icon;

  return (
    <div className="card-bg-premium p-5 rounded-xl overflow-hidden relative transition-all duration-300 hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>

      <div className="pl-2 relative z-10">
        <div className="flex items-center mb-3 gap-2">
          <div className="bg-blue-900/60 p-2 rounded-lg border border-blue-800/50">
            <Icon className="text-yellow-400 text-xl transition-transform duration-300" />
          </div>
          <span className="text-blue-200 font-poppins text-sm">{title}</span>
        </div>
        <div className="font-dela text-xl stats-value transition-colors duration-300">
          {value}
          {suffix}
        </div>
        {description && (
          <p className="text-xs mt-2 text-blue-300">{description}</p>
        )}
        {trending && (
          <div
            className={`text-xs mt-2 font-medium ${
              trending > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {trending > 0 ? "↑" : "↓"} {Math.abs(trending)}% last 24h
          </div>
        )}
      </div>
    </div>
  );
};

// Farm history events component
const PoolHistoryEvents = ({ events }: { events: any[] }) => {
  return (
    <div className="card-bg-premium rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="accent-line"></div>
        <h3 className="text-xl font-dela tracking-wider text-white flex items-center gap-2">
          <FaHistory className="text-yellow-400" />
          Pool Activity
        </h3>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {events.length > 0 ? (
          events.map((event, index) => (
            <div
              key={index}
              className="bg-blue-900/40 rounded-lg p-3 border border-blue-800/50"
            >
              <div className="flex items-start">
                <div className="bg-blue-900/80 p-2 rounded-full mr-3">
                  {event.type === "stake" && (
                    <FaTractor className="text-green-400" />
                  )}
                  {event.type === "unstake" && (
                    <FaCoins className="text-red-400" />
                  )}
                  {event.type === "reward" && (
                    <FaStar className="text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{event.title}</p>
                  <p className="text-blue-300 text-sm">{event.description}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-blue-400">{event.time}</p>
                    <a
                      href={`https://suiscan.xyz/devnet/tx/${event.txId}`}
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
            <p>No recent activity for this pool</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Distribution Card with chart
const RewardsDistributionCard = ({ distribution }: { distribution: any[] }) => {
  return (
    <div className="card-bg-premium rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="accent-line"></div>
        <h3 className="text-xl font-dela tracking-wider text-white flex items-center gap-2">
          <FaCoins className="text-yellow-400" />
          Rewards Distribution
        </h3>
      </div>

      <div className="space-y-3">
        {distribution.map((item, index) => (
          <div key={index} className="bg-blue-900/40 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <p className="text-white font-medium">{item.label}</p>
              <p className="text-yellow-400 font-medium">{item.percentage}%</p>
            </div>
            <div className="w-full bg-blue-950/60 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-2.5 rounded-full"
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stakers Leaderboard
const StakersLeaderboard = ({ stakers }: { stakers: any[] }) => {
  return (
    <div className="card-bg-premium rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="accent-line"></div>
        <h3 className="text-xl font-dela tracking-wider text-white flex items-center gap-2">
          <FaUsers className="text-yellow-400" />
          Top Stakers
        </h3>
      </div>

      <div className="space-y-2">
        {stakers.map((staker, index) => (
          <div
            key={index}
            className={`bg-blue-900/40 rounded-lg p-3 flex items-center ${
              index < 3 ? "border border-yellow-500/30" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                index === 0
                  ? "bg-yellow-500"
                  : index === 1
                  ? "bg-gray-300"
                  : index === 2
                  ? "bg-yellow-700"
                  : "bg-blue-800"
              }`}
            >
              <span className="text-blue-950 font-bold">{index + 1}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="text-white font-medium">
                  {staker.address.substring(0, 8)}...
                  {staker.address.substring(staker.address.length - 6)}
                </p>
                <p className="text-yellow-400 font-medium">{staker.amount}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-blue-300">
                  Staked since {staker.since}
                </p>
                <p className="text-xs text-blue-300">${staker.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Pool Details Component
export default function PoolDetails() {
  const { setIntensity } = useBackground();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [poolDetails, setPoolDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("details");
  const { connected } = useWallet();
  const { typeString } = useParams<{ typeString: string }>();

  // Decode the type string from URL (it might be encoded)
  const decodedTypeString = decodeURIComponent(typeString || "");

  // Mock pool details data
  const mockPoolDetails = {
    name: decodedTypeString.includes("::pair::LPCoin<")
      ? "SUI-VICTORY LP"
      : decodedTypeString.includes("sui::SUI")
      ? "SUI"
      : "VICTORY",
    type: decodedTypeString.includes("::pair::LPCoin<") ? "lp" : "single",
    tokenSymbol: decodedTypeString.includes("::pair::LPCoin<")
      ? "SUI-VICTORY LP"
      : decodedTypeString.includes("sui::SUI")
      ? "SUI"
      : "VICTORY",
    apr: 78.5,
    tvl: "$425,682",
    tvlValue: 425682,
    tvlChange: 3.2,
    stakedTokens: "34,582,102",
    allocationPoints: 200,
    depositFee: 0.5,
    withdrawalFee: 0.5,
    rewardsPerDay: "11,024 VICTORY",
    rewardsValue: "$6,614",
    active: true,
  };

  // Mock pool history events
  const mockEvents = [
    {
      type: "stake",
      title: "100 SUI-VICTORY LP Staked",
      description: "User staked 100 SUI-VICTORY LP tokens in this pool",
      time: "22 minutes ago",
      txId: "0x123456789abcdef",
    },
    {
      type: "reward",
      title: "5,250 VICTORY Distributed",
      description: "Daily reward distribution to all stakers in the pool",
      time: "3 hours ago",
      txId: "0x123456789abcdef",
    },
    {
      type: "unstake",
      title: "250 SUI-VICTORY LP Unstaked",
      description: "User unstaked 250 SUI-VICTORY LP tokens from this pool",
      time: "5 hours ago",
      txId: "0x123456789abcdef",
    },
    {
      type: "stake",
      title: "500 SUI-VICTORY LP Staked",
      description: "User staked 500 SUI-VICTORY LP tokens in this pool",
      time: "8 hours ago",
      txId: "0x123456789abcdef",
    },
  ];

  // Mock distribution data
  const mockDistribution = [
    { label: "Stakers Rewards", percentage: 60 },
    { label: "Treasury", percentage: 20 },
    { label: "Token Burns", percentage: 15 },
    { label: "Development", percentage: 5 },
  ];

  // Mock stakers data
  const mockStakers = [
    {
      address: "0x1a2b3c4d5e6f7g8h9i0j",
      amount: "10,500 LP",
      value: "152,250",
      since: "Feb 12, 2025",
    },
    {
      address: "0x2b3c4d5e6f7g8h9i0j1a",
      amount: "8,750 LP",
      value: "126,875",
      since: "Feb 18, 2025",
    },
    {
      address: "0x3c4d5e6f7g8h9i0j1a2b",
      amount: "5,200 LP",
      value: "75,400",
      since: "Feb 05, 2025",
    },
    {
      address: "0x4d5e6f7g8h9i0j1a2b3c",
      amount: "3,100 LP",
      value: "44,950",
      since: "Feb 22, 2025",
    },
    {
      address: "0x5e6f7g8h9i0j1a2b3c4d",
      amount: "2,800 LP",
      value: "40,600",
      since: "Feb 25, 2025",
    },
  ];

  // Set background intensity when component mounts
  useEffect(() => {
    setIntensity("low");

    // Simulate loading pool details
    const timer = setTimeout(() => {
      setPoolDetails(mockPoolDetails);
      setIsLoading(false);
      setIsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setIntensity, decodedTypeString]);

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card-bg-premium rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-blue-900/50 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-32 bg-blue-900/30 rounded"></div>
              <div className="h-32 bg-blue-900/30 rounded"></div>
              <div className="h-32 bg-blue-900/30 rounded"></div>
              <div className="h-32 bg-blue-900/30 rounded"></div>
            </div>
            <div className="h-64 bg-blue-900/20 rounded"></div>
          </div>
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

        {/* Pool Header */}
        <div className="mb-8 animate-on-scroll">
          <div className="card-bg-premium-gold rounded-xl p-6 shadow-xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {poolDetails?.type === "lp" ? (
                      <div className="bg-yellow-400/20 p-2 rounded-full">
                        <FaExchangeAlt className="text-yellow-400 text-2xl" />
                      </div>
                    ) : (
                      <div className="bg-yellow-400/20 p-2 rounded-full">
                        <FaCoins className="text-yellow-400 text-2xl" />
                      </div>
                    )}
                    <h1 className="text-3xl font-dela text-white">
                      {poolDetails?.name} Pool
                    </h1>
                    {poolDetails?.active && (
                      <span className="bg-green-500/20 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-blue-200">
                    Stake your {poolDetails?.tokenSymbol} tokens and earn
                    VICTORY rewards.
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="flex flex-col items-end">
                    <div className="text-yellow-400 text-3xl font-dela">
                      {poolDetails?.apr}% APR
                    </div>
                    <div className="text-blue-300 text-sm">
                      Annual Percentage Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 animate-on-scroll stagger-1">
          <div className="flex border-b border-blue-800/50">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "details"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              Pool Details
            </button>
            <button
              onClick={() => setActiveTab("stake")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "stake"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              Stake
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "activity"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-on-scroll stagger-2">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div>
              {/* Pool Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <PoolStatCard
                  title="Total Value Locked"
                  value={poolDetails?.tvl}
                  icon={FaChartLine}
                  trending={poolDetails?.tvlChange}
                />
                <PoolStatCard
                  title="Total Staked"
                  value={poolDetails?.stakedTokens}
                  icon={FaTractor}
                  suffix={` ${poolDetails?.tokenSymbol}`}
                />
                <PoolStatCard
                  title="Allocation Points"
                  value={poolDetails?.allocationPoints}
                  icon={FaStar}
                  description="Higher allocation means more rewards"
                />
                <PoolStatCard
                  title="Rewards Per Day"
                  value={poolDetails?.rewardsPerDay}
                  icon={FaFireAlt}
                />
              </div>

              {/* Fee Details */}
              <div className="card-bg-premium rounded-xl p-6 shadow-xl mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="accent-line"></div>
                  <h3 className="text-xl font-dela tracking-wider text-white flex items-center gap-2">
                    <FaInfoCircle className="text-yellow-400" />
                    Pool Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">
                      Fee Structure
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between bg-blue-900/40 rounded p-3">
                        <span className="text-blue-200">Deposit Fee</span>
                        <span className="text-white font-medium">
                          {poolDetails?.depositFee}%
                        </span>
                      </div>
                      <div className="flex justify-between bg-blue-900/40 rounded p-3">
                        <span className="text-blue-200">Withdrawal Fee</span>
                        <span className="text-white font-medium">
                          {poolDetails?.withdrawalFee}%
                        </span>
                      </div>
                      <div className="flex justify-between bg-blue-900/40 rounded p-3">
                        <span className="text-blue-200">
                          Rewards Value (Daily)
                        </span>
                        <span className="text-white font-medium">
                          {poolDetails?.rewardsValue}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">
                      Pool Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between bg-blue-900/40 rounded p-3">
                        <span className="text-blue-200">Pool Type</span>
                        <span className="text-white font-medium capitalize">
                          {poolDetails?.type}
                        </span>
                      </div>
                      <div className="flex justify-between bg-blue-900/40 rounded p-3">
                        <span className="text-blue-200">Token</span>
                        <span className="text-white font-medium">
                          {poolDetails?.tokenSymbol}
                        </span>
                      </div>
                      <div className="text-xs text-blue-300 mt-4 bg-blue-900/30 p-3 rounded">
                        <p className="mb-2">
                          <span className="font-medium">Pool Type:</span>{" "}
                          {decodedTypeString}
                        </p>
                        <p>
                          <span className="font-medium">Note:</span> Fees
                          collected from this pool are distributed to VICTORY
                          token lockers and partially used for token buyback and
                          burn.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribution and Leaderboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RewardsDistributionCard distribution={mockDistribution} />
                <StakersLeaderboard stakers={mockStakers} />
              </div>
            </div>
          )}

          {/* Stake Tab */}
          {activeTab === "stake" && (
            <div>
              {connected ? (
                <StakingComponent
                  initialMode={poolDetails?.type}
                  initialToken={decodedTypeString}
                />
              ) : (
                <div className="card-bg-premium p-8 rounded-xl text-center">
                  <FaExclamationTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    Wallet Connection Required
                  </h3>
                  <p className="text-blue-200 mb-4">
                    Please connect your wallet to stake in this pool.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div>
              <PoolHistoryEvents events={mockEvents} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// // @ts-nocheck
// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useWallet } from "@suiet/wallet-kit";
// import { SuiClient } from "@mysten/sui.js/client";
// import { TransactionBlock } from "@mysten/sui.js/transactions";
// import { CONSTANTS } from "../constants/addresses";

// // Import Shadcn UI components
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
//   CardFooter,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { ArrowLeft } from "lucide-react";
// //import { Separator } from "@/components/ui/separator.tsx";

// export default function PoolDetails() {
//   const { typeString } = useParams();
//   const { connected, account } = useWallet();
//   const navigate = useNavigate();
//   const suiClient = new SuiClient({ url: "https://fullnode.devnet.sui.io/" });

//   const [poolDetails, setPoolDetails] = useState(null);
//   const [poolEvents, setPoolEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Helper to convert byte array to readable string
//   const byteArrayToString = (byteArray) => {
//     if (!Array.isArray(byteArray)) {
//       console.log("Not an array in byteArrayToString");
//       return "Unknown";
//     }

//     try {
//       // For TypeName objects with name property
//       if (
//         byteArray.length > 0 &&
//         typeof byteArray[0] === "object" &&
//         byteArray[0].name
//       ) {
//         return byteArray.map((item) => item.name).join("::");
//       }

//       // Special case for TypeName vector
//       if (
//         JSON.stringify(byteArray).includes("type_name") &&
//         JSON.stringify(byteArray).includes("TypeName")
//       ) {
//         return "vector<0x1::type_name::TypeName>";
//       }

//       // Check if the array is already characters
//       const allStrings = byteArray.every(
//         (b) => typeof b === "string" && b.length === 1
//       );
//       if (allStrings) {
//         return byteArray.join("");
//       }

//       // Process as character codes
//       let result = "";
//       for (let i = 0; i < byteArray.length; i++) {
//         if (typeof byteArray[i] === "number") {
//           result += String.fromCharCode(byteArray[i]);
//         } else {
//           result += String(byteArray[i]);
//         }
//       }

//       return result;
//     } catch (e) {
//       console.error("Error processing byte array:", e);
//       return JSON.stringify(byteArray);
//     }
//   };

//   // Extract a clean token name from a fully qualified type
//   const extractTokenName = (typeString) => {
//     // Check if it's a SUI token
//     if (typeString.includes("::sui::SUI")) {
//       return "SUI";
//     }

//     // Check for STK pattern
//     const stkMatch = typeString.match(/::STK(\d+)::STK\d+/);
//     if (stkMatch) {
//       return `STK${stkMatch[1]}`;
//     }

//     // Extract token name from module path (address::module::TokenName)
//     const parts = typeString.trim().split("::");
//     if (parts.length >= 3) {
//       return parts[parts.length - 1];
//     } else if (parts.length === 1) {
//       return parts[0];
//     }

//     return "Unknown";
//   };

//   // Extract LP tokens from a type string using regex patterns
//   const extractLpTokens = (typeString) => {
//     const lpTokens = [];

//     // Match LP tokens with pattern: address::pair::LPCoin<Token1, Token2>
//     const lpRegex = /([0-9a-f]{64})::pair::LPCoin<([^,]+),\s*([^>]+)>/g;
//     let match;

//     while ((match = lpRegex.exec(typeString)) !== null) {
//       const token1 = extractTokenName(match[2]);
//       const token2 = extractTokenName(match[3]);

//       // Create consistent display name
//       let displayName;
//       if (token2 === "SUI") {
//         displayName = `${token1}-SUI LP`;
//       } else if (token1 === "SUI") {
//         displayName = `SUI-${token2} LP`;
//       } else {
//         // For non-SUI pairs, sort alphabetically
//         const tokens = [token1, token2].sort();
//         displayName = `${tokens[0]}-${tokens[1]} LP`;
//       }

//       lpTokens.push({
//         displayName,
//         isLp: true,
//         typeString: match[0],
//         tokens: [token1, token2],
//       });
//     }

//     return lpTokens;
//   };

//   // Helper function to parse Sui u256 byte array without precision loss
//   const parseU256ByteArray = (byteArray) => {
//     if (!Array.isArray(byteArray) || byteArray.length === 0) {
//       return 0n;
//     }

//     // Convert to BigInt to handle large numbers properly
//     let result = 0n;
//     let multiplier = 1n;

//     for (let i = 0; i < byteArray.length; i++) {
//       if (typeof byteArray[i] === "number") {
//         result += BigInt(byteArray[i]) * multiplier;
//         multiplier *= 256n;
//       }
//     }

//     return result;
//   };

//   // Parser specifically designed for the exact format returned by the blockchain
//   const parseBlockchainValue = (value) => {
//     // The specific format we're dealing with is a two-element array: [[data], "type"]
//     if (
//       Array.isArray(value) &&
//       value.length === 2 &&
//       typeof value[1] === "string"
//     ) {
//       const [dataArray, typeStr] = value;

//       // Handle u256/u64/u128 number types - keep as BigInt for large numbers
//       if (typeStr.startsWith("u") && Array.isArray(dataArray)) {
//         return parseU256ByteArray(dataArray);
//       }

//       // Handle boolean type
//       if (typeStr === "bool" && Array.isArray(dataArray)) {
//         // Boolean array format: [1] means true, [0] means false
//         if (dataArray.length === 1) {
//           return dataArray[0] === 1;
//         }
//         return false;
//       }
//     }

//     // For any other format, log a warning and return a reasonable default
//     console.warn("Could not parse value:", value);
//     return typeof value === "number" ? value : false;
//   };

//   // Utility function to format BigInt for display with commas and proper decimal places
//   const formatBigIntForDisplay = (bigIntValue, decimals = 9) => {
//     if (typeof bigIntValue !== "bigint") {
//       try {
//         bigIntValue = BigInt(bigIntValue);
//       } catch {
//         return "0";
//       }
//     }

//     const divisor = BigInt(10 ** decimals);
//     const integerPart = bigIntValue / divisor;
//     const fractionalPart = bigIntValue % divisor;

//     // Format with commas for the integer part
//     const formattedInteger = integerPart
//       .toString()
//       .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//     // Only show decimal part if non-zero
//     if (fractionalPart === 0n) {
//       return formattedInteger;
//     }

//     // Format the fractional part, padding with leading zeros if needed
//     let fractionalStr = fractionalPart.toString().padStart(decimals, "0");

//     // Trim trailing zeros
//     fractionalStr = fractionalStr.replace(/0+$/, "");

//     if (fractionalStr.length === 0) {
//       return formattedInteger;
//     }

//     return `${formattedInteger}.${fractionalStr}`;
//   };

//   // Process pool type data to create consistent display objects
//   const processPoolType = (poolType, isLpToken, isNativePair) => {
//     let typeString = "";

//     // Convert pool type to string format
//     if (typeof poolType === "string") {
//       typeString = poolType;
//     } else if (Array.isArray(poolType)) {
//       typeString = byteArrayToString(poolType);
//     } else if (poolType && typeof poolType === "object") {
//       if (poolType.name) {
//         typeString = poolType.name;
//       } else if (poolType.module && poolType.module.name && poolType.name) {
//         typeString = `${poolType.address}::${poolType.module.name}::${poolType.name}`;
//       } else {
//         typeString = JSON.stringify(poolType);
//       }
//     }

//     // Handle LP tokens
//     if (isLpToken) {
//       const lpMatches = extractLpTokens(typeString);
//       if (lpMatches.length > 0) {
//         return lpMatches[0];
//       }
//     }

//     // Handle single asset tokens
//     const tokenName = extractTokenName(typeString);
//     return {
//       displayName: tokenName,
//       isLp: false,
//       typeString: typeString,
//       tokens: [tokenName],
//     };
//   };

//   // Fetch pool events
//   const fetchPoolEvents = async () => {
//     try {
//       console.log("🚀 Fetching PoolCreated events...");
//       const events = await suiClient.queryEvents({
//         query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::PoolCreated` },
//         limit: 50,
//       });

//       console.log("🟢 PoolCreated Events:", JSON.stringify(events, null, 2));
//       if (events?.data?.length > 0) {
//         // Transform the events into a consistent format
//         const processedEvents = events.data.map((event) => {
//           const parsedEvent = event.parsedJson;
//           return {
//             poolType: parsedEvent.pool_type,
//             allocationPoints: parsedEvent.allocation_points,
//             depositFee: parsedEvent.deposit_fee,
//             withdrawalFee: parsedEvent.withdrawal_fee,
//             isNativePair: parsedEvent.is_native_pair,
//             isLpToken: parsedEvent.is_lp_token,
//           };
//         });

//         setPoolEvents(processedEvents);
//       }
//     } catch (error) {
//       console.error("❌ Error fetching pool events:", error);
//       setError("Failed to fetch pool events.");
//     }
//   };

//   // Fetch pool details
//   const fetchPoolDetails = async () => {
//     if (!account?.address || !typeString) return;
//     setLoading(true);
//     setError(null);

//     try {
//       console.log(`Fetching details for pool: ${typeString}`);

//       // Find matching event from fetched pool events
//       let matchedEvent = null;

//       for (const event of poolEvents) {
//         // Check different possible formats of the pool type
//         const eventTypeString =
//           typeof event.poolType === "string"
//             ? event.poolType
//             : byteArrayToString(event.poolType);

//         if (
//           eventTypeString === typeString ||
//           JSON.stringify(eventTypeString) === JSON.stringify(typeString)
//         ) {
//           matchedEvent = event;
//           break;
//         }
//       }

//       console.log("🟡 Matched Pool Event:", matchedEvent);

//       // Create initial details object
//       let details = {
//         allocationPoints: matchedEvent?.allocationPoints || 0,
//         depositFee: (matchedEvent?.depositFee || 0) / 100, // Convert basis points to percentage
//         withdrawalFee: (matchedEvent?.withdrawalFee || 0) / 100, // Convert basis points to percentage
//         isNativePair: Boolean(matchedEvent?.isNativePair),
//         isLpToken: Boolean(matchedEvent?.isLpToken),
//         totalStakedBigInt: 0n, // Will be updated from blockchain
//         active: true, // Default until we get actual data
//       };

//       // Fetch additional details from blockchain
//       const tx = new TransactionBlock();
//       tx.moveCall({
//         target: `${CONSTANTS.PACKAGE_ID}::farm::get_pool_info`,
//         arguments: [tx.object(CONSTANTS.FARM_ID)],
//         typeArguments: [typeString],
//       });

//       const result = await suiClient.devInspectTransactionBlock({
//         transactionBlock: tx,
//         sender: account.address,
//       });

//       console.log(
//         "🟢 Raw Pool Info Response:",
//         JSON.stringify(result, null, 2)
//       );

//       if (result?.results?.[0]?.returnValues) {
//         const rawValues = result.results[0].returnValues;
//         const parsedValues = rawValues.map(parseBlockchainValue);

//         // Extract values in expected order from the contract
//         // (total_staked, deposit_fee, withdrawal_fee, active, is_native_pair, is_lp_token)
//         if (parsedValues.length >= 6) {
//           const [
//             totalStaked,
//             depositFee,
//             withdrawalFee,
//             active,
//             isNativePair,
//             isLpToken,
//           ] = parsedValues;

//           // Update details with values from blockchain
//           details = {
//             ...details,
//             totalStakedBigInt: totalStaked,
//             depositFee: Number(depositFee) / 100, // Convert to percentage
//             withdrawalFee: Number(withdrawalFee) / 100, // Convert to percentage
//             active: Boolean(active),
//             isNativePair: Boolean(isNativePair),
//             isLpToken: Boolean(isLpToken),
//           };
//         } else {
//           console.warn(
//             "Unexpected number of return values",
//             parsedValues.length
//           );
//         }
//       }

//       // Process pool type information for display
//       const poolTypeInfo = processPoolType(
//         typeString,
//         details.isLpToken,
//         details.isNativePair
//       );

//       // Combine all information
//       const fullDetails = {
//         ...details,
//         ...poolTypeInfo,
//         // Format totalStaked for logging
//         totalStakedDisplay: formatBigIntForDisplay(details.totalStakedBigInt),
//       };

//       console.log("🟢 Combined Pool Details:", {
//         ...fullDetails,
//         totalStakedBigInt: details.totalStakedBigInt.toString(), // Convert BigInt to string for logging
//       });

//       setPoolDetails(fullDetails);
//     } catch (error) {
//       console.error("❌ Error fetching pool details:", error);
//       setError("Failed to load pool details.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (connected) {
//       fetchPoolEvents().then(() => fetchPoolDetails());
//     }
//   }, [connected, account?.address, typeString, poolEvents.length]);

//   // Use decoded display name if available, otherwise use the raw type string
//   const displayName =
//     poolDetails?.displayName || decodeURIComponent(typeString || "");

//   return (
//     <div className="min-h-screen ">
//       <div className="container mx-auto px-4 py-1   ">
//         {/* Back Button */}
//         <Button
//           onClick={() => navigate(-1)}
//           variant="outline"
//           className="mb-6 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-500"
//         >
//           <ArrowLeft className="h-4 w-4" /> Back
//         </Button>
//         <div className="rotating-background"></div>

//         {!connected ? (
//           <Alert
//             variant="destructive"
//             className="mb-6 bg-red-800 border-red-700 text-white"
//           >
//             <AlertDescription className="text-center py-4">
//               🔴 Please connect your wallet to view pool details.
//             </AlertDescription>
//           </Alert>
//         ) : loading ? (
//           <div className="space-y-3 max-w-3xl mx-auto ">
//             <Skeleton className="h-12 w-48 mb-4 mx-auto bg-blue-700/30" />
//             <Card className="border-blue-600/30 bg-blue-800/20 backdrop-blur-sm">
//               <CardHeader className="pb-2">
//                 <Skeleton className="h-7 w-40 bg-blue-700/30" />
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <Skeleton className="h-6 w-full bg-blue-700/30" />
//                 <Skeleton className="h-6 w-full bg-blue-700/30" />
//                 <Skeleton className="h-6 w-3/4 bg-blue-700/30" />
//                 <Skeleton className="h-6 w-1/2 bg-blue-700/30" />
//               </CardContent>
//             </Card>
//             <p className="text-white text-center ">Loading pool details...</p>
//           </div>
//         ) : error ? (
//           <Alert
//             variant="destructive"
//             className="bg-red-800 border-red-700 text-white"
//           >
//             <AlertDescription className="py-3">
//               <p className="text-xl font-bold mb-2">Error</p>
//               <p>{error}</p>
//             </AlertDescription>
//           </Alert>
//         ) : (
//           <div className="max-w-3xl mx-auto  ">
//             {/* Pool Details Header */}
//             <h2 className="text-4xl font-extrabold text-white uppercase tracking-wide text-center mb-6">
//               {displayName} Pool Details
//             </h2>

//             {/* Pool Details Card */}
//             <Card className="relative border-[4px] border-black bg-blue-900 wavy-background shadow-lg rounded-[30px] p-6 overflow-hidden">
//               {/* Card Header */}
//               <CardHeader className="bg-[#88D8A4] border-[3px] border-black rounded-full px-6 py-3 flex justify-center items-center shadow-md">
//                 <CardTitle className="text-black font-bold text-lg">
//                   POOL INFORMATION
//                 </CardTitle>
//               </CardHeader>

//               {/* Card Content */}
//               <CardContent className="p-6 text-white">
//                 {poolDetails.error ? (
//                   <p className="text-red-400">{poolDetails.error}</p>
//                 ) : (
//                   <div className="space-y-6">
//                     {/* Token Pair */}
//                     <div>
//                       <h4 className="text-white font-semibold mb-2">
//                         Token Pair
//                       </h4>
//                       <div className="flex flex-wrap gap-2">
//                         {poolDetails.tokens.map((token, idx) => (
//                           <Badge
//                             key={idx}
//                             variant="secondary"
//                             className="px-4 py-1 bg-blue-700 hover:bg-blue-600 text-white border-none"
//                           >
//                             {token}
//                           </Badge>
//                         ))}
//                       </div>
//                     </div>

//                     {/* Fancy Gradient Divider */}

//                     {/* Pool Statistics */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {/* Total Staked */}
//                       <div>
//                         <h4 className="text-white font-semibold mb-1">
//                           Total Staked
//                         </h4>
//                         <p className="text-lg">
//                           {poolDetails.totalStakedDisplay ||
//                             formatBigIntForDisplay(
//                               poolDetails.totalStakedBigInt
//                             ) ||
//                             "0"}
//                         </p>
//                       </div>

//                       {/* Status */}
//                       <div>
//                         <h4 className="text-white font-semibold mb-1">
//                           Status
//                         </h4>
//                         <div className="flex items-center">
//                           <div
//                             className={`w-2 h-2 rounded-full mr-2 ${
//                               poolDetails.active ? "bg-green-500" : "bg-red-500"
//                             }`}
//                           ></div>
//                           <span>
//                             {poolDetails.active ? "Active" : "Inactive"}
//                           </span>
//                         </div>
//                       </div>

//                       {/* Deposit Fee */}
//                       <div>
//                         <h4 className="text-white font-semibold mb-1">
//                           Deposit Fee
//                         </h4>
//                         <p>{poolDetails.depositFee}%</p>
//                       </div>

//                       {/* Withdrawal Fee */}
//                       <div>
//                         <h4 className="text-white font-semibold mb-1">
//                           Withdrawal Fee
//                         </h4>
//                         <p>{poolDetails.withdrawalFee}%</p>
//                       </div>

//                       {/* LP Token */}
//                       <div>
//                         <h4 className="text-white font-semibold mb-1">
//                           LP Token
//                         </h4>
//                         <p>
//                           {poolDetails.isLp || poolDetails.isLpToken
//                             ? "Yes"
//                             : "No"}
//                         </p>
//                       </div>

//                       {/* Native Pair */}
//                       <div>
//                         <h4 className="text-white font-semibold mb-1">
//                           Native Pair
//                         </h4>
//                         <p>{poolDetails.isNativePair ? "Yes" : "No"}</p>
//                       </div>

//                       {/* Allocation Points */}
//                       <div className="col-span-2">
//                         <h4 className="text-blue-300 font-semibold mb-1">
//                           Allocation Points
//                         </h4>
//                         <p>
//                           This pool has {poolDetails.allocationPoints}{" "}
//                           allocation points.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>

//               {/* Card Footer */}
//               <CardFooter className="bg-[#FFD700] border-[3px] border-black rounded-full px-6 py-3 flex justify-center items-center shadow-md">
//                 <p className="text-black font-bold text-lg">
//                   Transaction fees: {poolDetails?.depositFee}% deposit,{" "}
//                   {poolDetails?.withdrawalFee}% withdrawal
//                 </p>
//               </CardFooter>
//             </Card>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

