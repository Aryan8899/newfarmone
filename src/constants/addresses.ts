// src/constants/addresses.ts

/**
 * Core contract addresses and constants for the SuiTrump Farm platform
 */

export const CONSTANTS = {
  PACKAGE_ID:
    "0x594ac1bc574441936cc2c8bfe8ee98a8a1cc3cc2565934a35e4fbaa8ef9df9a9",
  ROUTER_ID:
    "0xee2b2f05cfa97b63fa750245e1dfa06889ad04aec7e87e52682a9760774b609d",
  FACTORY_ID:
    "0x9106aad90c3c7a3ee46af55b7f547658fab57f561fe327e57e4f9f5a9c9098c2",
  FARM_ID: "0xaf51d093dbc419696687409c217f646992e0287fbe160a30ccdaafe2426513c0",
  FARM_CONFIG_ID:
    "0x48c35a602439701f72323b2201ffe078c0271202e338e862ee13ac9e9ebb8ca7",
  ADMIN_CAP_ID:
    "0xba47ef6a5fe043b3fadf13445830388c1abed7b5f7213e3d83728a61fdaa2aaf",
  PAIR_ADMIN_CAP_ID:
    "0x53a427f81aa492a22dba385b0da2ee8adb77a20976f49b3e8c1058dabf0cf26f",
  UPGRADE_CAP_ID:
    "0xc9b832df1d3c8c05de1445671ab4d11dbf1840ac8f9339ecd733ca39bc451a98",
  TOKEN_LOCKER_ID:
    "0xfb226947613d2bfa235c1c8a66e56a3ae114ff577222816c1d657ca0f79feaa2",
  TOKEN_LOCKER_ADMIN_CAP_ID:
    "0xc6cf4d7027f3a63ee611959cacb3e8b86c1f556f7493b33eaa5f9c3586bbfc71",
  VICTORY_TOKEN: {
    TYPE: "0x594ac1bc574441936cc2c8bfe8ee98a8a1cc3cc2565934a35e4fbaa8ef9df9a9::victory_token::VICTORY_TOKEN",
    TREASURY_CAP_WRAPPER_ID:
      "0x7f64813edde05e0b3dc9bd4e0369b34db43044660c0d8b812a131aad7d475e98",
    MINTER_CAP_ID:
      "0x37f98ba0556ef254d8ae2f0570e747f50e1ff7d3158db81e8750f3db42d0943f",
    METADATA_ID:
      "0xb0275309584ec9f693fe5a1b084187ddd0260d66d9caa9cf0d4bf1c0a8812515",
  },
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
  CLOCK_ID: "0x6",

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
