// src/constants/addresses.ts

/**
 * Core contract addresses and constants for the SuiTrump Farm platform
 */

export const CONSTANTS = {
  // Core Package and Module IDs
  PACKAGE_ID:
    "0xdf026c0faf8930c852e5efc6c15edc15c632abdc22de4c2d766d22c42a32eda9",
  ROUTER_ID:
    "0xf2ee76e82b739e0d5b04fa9e40bcff7cd3246acbb2c4217776c481059f71b6ae",
  FACTORY_ID:
    "0x81404cd9555c6631e7d5b16824f7aa254e6665486ba29e2ca1866d6ec27a3426",
  FARM_ID: "0x8178826b58b6e29364f40a18b18ed1ab9cb9df7793e831eec4c208a25ea384ec",
  FARM_CONFIG_ID:
    "0xae5cf03f661d92b35eaeafb1241b886a6eda8da30dcdb105f2aee0b171735614",
  ADMIN_CAP_ID:
    "0x70d1ff76a118ac66fd4b0426aef1fafbc531370325df4625a7bb3caa133a4522",
  PAIR_ADMIN_CAP_ID:
    "0xbfe5d0ac2952cdbfb91756a2bfe0c425a122276a2d6ba6dfc923fef20fe340e2",
  UPGRADE_CAP_ID:
    "0x9ed83aa0e32d7fe8227b4b4d969531ad54988d918b4e6d27debbdb64db0f8b13",
  TOKEN_LOCKER_ID:
    "0x809b8fa8733300dccc3bf2e80e94c41c74d925db256e56eae670da3ae3a4988a",
  TOKEN_LOCKER_ADMIN_CAP_ID:
    "0x37adbef4967b2f32db1854ed26df6e79624a0d9b618d1414321e500ab2d34fca",
  CLOCK_ID: "0x6",

  // VICTORY Token Constants
  VICTORY_TOKEN: {
    TYPE: "0xdf026c0faf8930c852e5efc6c15edc15c632abdc22de4c2d766d22c42a32eda9::victory_token::VICTORY_TOKEN",
    TREASURY_CAP_WRAPPER_ID:
      "0x1dea3522d6cc07b9d05420f5e5456b6673fc101df54708110eaed406c2d3f291",
    MINTER_CAP_ID:
      "0x32f34af10742b8c1d667bb3f1568e0d5bbbe12994d40fa0c35842bc59ed9cef7",
    METADATA_ID:
      "0xdc7ed18409b54817129c612252dfd613bd952773203258d34f6ef2d917a3e8fa",
  },

  // Module names
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    FIXED_POINT_MATH: "fixed_point_math",
    FARM: "farm",
    FARM_CONFIG: "farm_config",
    VICTORY_TOKEN: "victory_token",
    TOKEN_LOCKER: "token_locker",
  },

  // Default Fees
  DEFAULT_FEES: {
    DEPOSIT_FEE_BPS: 100, // 1%
    WITHDRAWAL_FEE_BPS: 100, // 1%
    SWAP_FEE_BPS: 30, // 0.3%
  },

  // Lock Periods (in days)
  LOCK_PERIODS: [
    { days: 7, name: "1 Week", multiplier: 1000 }, // 10% in basis points
    { days: 30, name: "1 Month", multiplier: 2500 }, // 25% in basis points
    { days: 365, name: "1 Year", multiplier: 5000 }, // 50% in basis points
    { days: 5555, name: "Infinity", multiplier: 10000 }, // 100% in basis points
  ],

  // Decimals
  DECIMALS: {
    SUI: 9,
    VICTORY: 6,
    LP: 9,
  },

  // External URLs
  EXTERNAL_URLS: {
    DEX: "https://suidex-sigma.vercel.app",
    EXPLORER: "https://suiscan.xyz",
    DOCS: "https://shitcoin-club.gitbook.io/suitrump-farm",
  },

  // Helper function to get pair ID
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};

// Helper to convert basis points to percentage
export const bpsToPercentage = (bps: number): number => {
  return bps / 100;
};

// Helper to convert percentage to basis points
export const percentageToBps = (percentage: number): number => {
  return percentage * 100;
};

// Format percentage with 4 decimal places
export const formatPercentage = (value: number): string => {
  return value.toFixed(4);
};

// Helper to create pool type string for different token types
export const createPoolTypeString = (
  isLp: boolean,
  token0Type: string,
  token1Type?: string
): string => {
  if (isLp && token1Type) {
    return `${CONSTANTS.PACKAGE_ID}::pair::LPCoin<${token0Type}, ${token1Type}>`;
  }
  return token0Type;
};

export const formatBalance = (amount: string, decimals: number): string => {
  // Handle empty or invalid input
  if (!amount) return "0";

  try {
    const amountBigInt = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(decimals);
    const integerPart = amountBigInt / divisor;
    const fractionalPart = amountBigInt % divisor;

    // Convert to string and pad with leading zeros
    let fractionalStr = fractionalPart.toString().padStart(decimals, "0");

    // Limit to maximum 4 decimal places
    fractionalStr = fractionalStr.substring(
      0,
      Math.min(4, fractionalStr.length)
    );

    // Trim trailing zeros
    while (fractionalStr.endsWith("0") && fractionalStr.length > 0) {
      fractionalStr = fractionalStr.slice(0, -1);
    }

    // If the fractional part is only zeros, return just the integer part
    if (fractionalStr === "0" || fractionalStr === "") {
      return integerPart.toString();
    }

    return `${integerPart}.${fractionalStr}`;
  } catch (e) {
    console.error("Error formatting balance:", e);
    return "0";
  }
};

export default CONSTANTS;
