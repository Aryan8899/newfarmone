// src/components/farm/FarmStatsSection.tsx
import { useState, useEffect, useCallback } from "react";
import { FaTractor, FaChartLine, FaCoins, FaInfoCircle } from "react-icons/fa";
import { formatPercentage } from "../../constants/addresses";

interface PoolCountData {
  totalPools: number;
  lpPools: number;
  singleAssetPools: number;
}

interface FarmStats {
  tvl: string;
  aprRange: string;
  activeUsers: string;
  totalPools: string;
}

// Helper to format currency values
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Simple helper for random mock data with variation
const getRandomValue = (base: number, variance: number) => {
  return base + Math.random() * variance * 2 - variance;
};

// Farm Analytics Card
const FarmAnalyticsCard = ({
  title,
  value,
  icon,
  trend = null,
  suffix = "",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number | null;
  suffix?: string;
}) => {
  const Icon = icon;

  return (
    <div className="card-bg-premium p-5 rounded-xl overflow-hidden relative transition-all duration-300 hover:-translate-y-1">
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>

      {/* Only 3 particles for minimal animation */}
      <div className="particle-container">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`particle ${i % 2 === 0 ? "particle-gold" : ""}`}
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="pl-2 relative z-10">
        <div className="flex items-center mb-3 gap-2">
          <div className="bg-blue-900/60 p-2 rounded-lg border border-blue-800/50">
            <Icon className="text-yellow-400 text-xl transition-transform duration-300" />
          </div>
          <span className="text-blue-200 font-poppins text-sm">{title}</span>
        </div>
        <div className="font-dela text-xl stats-value transition-colors duration-300">
          <>
            {value}
            {suffix}
          </>
        </div>
        {trend !== null && (
          <div
            className={`text-xs mt-2 flex items-center gap-1 font-medium ${
              trend > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% from last week
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Farm Stats Section that uses mock data
export const FarmStatsSection = ({
  poolCountData,
}: {
  poolCountData: PoolCountData | null;
}) => {
  const [farmStats, setFarmStats] = useState<FarmStats>({
    tvl: "$0",
    aprRange: "0% - 0%",
    activeUsers: "0",
    totalPools: "0",
  });

  // Generate realistic mock data for UI stats
  const generateMockStats = useCallback(
    (actualPoolCount: number | null): FarmStats => {
      // TVL - generate a random value between $4M and $6M
      const tvlValue = getRandomValue(5000000, 1000000);

      // Generate realistic APR range - low end 30-50%, high end 90-150%
      const minApr = getRandomValue(40, 10);
      const maxApr = getRandomValue(120, 30);

      // Active farmers - generate a value between 2500-3200
      const userValue = Math.floor(getRandomValue(2800, 300));

      // Use actual pool count if available, otherwise use a realistic number
      const poolCount = actualPoolCount || 16;

      return {
        tvl: formatCurrency(tvlValue),
        aprRange: `${formatPercentage(minApr)}% - ${formatPercentage(maxApr)}%`,
        activeUsers: userValue.toLocaleString(),
        totalPools: poolCount.toString(),
      };
    },
    []
  );

  // Initialize stats with mock data and update when pool count changes
  useEffect(() => {
    const actualPoolCount = poolCountData?.totalPools || null;
    const mockData = generateMockStats(actualPoolCount);

    setFarmStats({
      ...mockData,
      // Always use the actual pool count if available
      totalPools: actualPoolCount
        ? actualPoolCount.toString()
        : mockData.totalPools,
    });
  }, [poolCountData, generateMockStats]);

  return (
    <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden relative">
      {/* Gold accent corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="accent-line"></div>
            <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
              <FaChartLine className="text-yellow-400 float-animation-minimal" />
              <span className="text-shimmer-gold">Farm Overview</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FarmAnalyticsCard
            title="Total Value Locked"
            value={farmStats.tvl}
            icon={FaCoins}
            trend={2.8}
          />
          <FarmAnalyticsCard
            title="APR Range"
            value={farmStats.aprRange}
            icon={FaChartLine}
            trend={1.2}
          />
          <FarmAnalyticsCard
            title="Active Farmers"
            value={farmStats.activeUsers}
            icon={FaTractor}
            trend={3.5}
          />
          <FarmAnalyticsCard
            title="Total Pools"
            value={farmStats.totalPools}
            icon={FaInfoCircle}
          />
        </div>
      </div>
    </div>
  );
};
