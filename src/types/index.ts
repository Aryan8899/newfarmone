// src/types.ts

import React, { ReactNode } from "react";

/**
 * Original types
 */
export interface Pool {
  id: number;
  token0: string;
  token1: string;
  network: string;
  version: string;
  feeTier: string;
  apr: {
    current: number;
    previous: number;
  };
  tvl: number;
  volume24h: number;
  poolType: string;
}

export interface Transaction {
  type: string;
  value: string;
  tokens: string;
  account: string;
  time: string;
  category: string;
}

export interface GraphData {
  date: string;
  value: number;
}

// Navigation type
export interface NavigationItem {
  name: string;
  path: string;
  icon?: React.ElementType;
  minRank?: number;
}

// Stats Card Props
export interface StatsCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: number | null;
}

// Value Card Props
export interface ValueCardProps {
  label: string;
  value: string;
  dollarValue: string;
  icon: React.ElementType;
}

// NavItem Props
export interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isOpen: boolean;
  toggleOpen: () => void;
  children: React.ReactNode;
  isActive?: boolean;
}

// DropdownItem Props
export interface DropdownItemProps {
  href: string;
  label: string;
  icon?: React.ElementType;
  isExternal?: boolean;
  isActive?: boolean;
  badge?:any;
}

// Background Effects Props
export interface BackgroundEffectsProps {
  intensity?: "low" | "medium" | "high";
}

// Layout Props
export interface LayoutProps {
  children: React.ReactNode;
}

// Market Stats interface
export interface MarketStats {
  marketCap: string;
  totalLiquidity: string;
  totalMinted: string;
  circulatingSupply: string;
  newVictoryPerBlock: string;
}

/**
 * New types for farm components
 */

// Background context types
export interface BackgroundContextType {
  intensity: "low" | "medium" | "high";
  setIntensity: (intensity: "low" | "medium" | "high") => void;
}

/**
 * Farm component types
 */
export interface PoolData {
  typeString: string;
  displayName: string;
  isLp: boolean;
  tokens: string[];
  allocPoints: number;
  totalStaked?: string;
  totalStakedBigInt?: bigint;
  depositFee?: number;
  withdrawalFee?: number;
  apr?: number;
  active?: boolean;
  isNativePair?: boolean;
  eventData?: any;
}

export interface StakingPosition {
  id: string;
  type: "lp" | "single";
  tokenInfo: TokenInfo;
  amount?: string;
  amountFormatted: string;
  initialStakeTimestamp: number;
  lastHarvestTimestamp: number;
  stakeDateFormatted: string;
  lastHarvestFormatted: string;
  vaultId: string;
  vaultData: any;
  pendingRewards: string;
  pendingRewardsFormatted: string;
  canHarvest: boolean;
  hoursUntilHarvest: number;
  stakedDays: number;
  apr?: string;
  url: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  type: string;
  decimals: number;
  isLp?: boolean;
  token0?: string;
  token1?: string;
  token0Type?: string;
  token1Type?: string;
  balance?: string;
  id?: string;
}

export interface LockInfo {
  id: string;
  amount: string;
  amountFormatted: string;
  lock_period: string;
  lock_end: string;
  multiplier: number;
  last_reward_time: string;
  weighted_amount: string;
  daysRemaining: number;
  formattedMultiplier: string;
  canUnlock: boolean;
  periodName: string;
  lockEndDate: string;
  lastRewardDate: string;
  eventId: string;
  createdAt: number;
}

export interface LockPeriod {
  days: number;
  name: string;
  multiplier: number;
}

/**
 * Pair/Exchange component types
 */
export interface TokenSwapInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
}
interface CoinMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

export interface PoolInfo {
  typeString: string;
  totalStaked: bigint;
  depositFee: number;
  withdrawalFee: number;
  active: boolean;
  isNativePair: boolean;
  isLpToken: boolean;
  allocPoints: number;
  metadata?: CoinMetadata;
  token0Type?: string;
  token1Type?: string;
  token0Metadata?: CoinMetadata;
  token1Metadata?: CoinMetadata;
}

/**
 * Transaction types
 */
export interface TransactionRequest {
  type: "stake" | "unstake" | "claim" | "lock" | "unlock" | "approve";
  amount?: string;
  pool?: PoolData;
  position?: StakingPosition;
  lock?: LockInfo;
}

export interface TransactionResult {
  success: boolean;
  digest?: string;
  error?: string;
}

/**
 * API Types
 */
export interface TokenPrice {
  tokenAddress: string;
  price: string;
  dailyChange: number;
}
