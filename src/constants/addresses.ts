// src/constants/addresses.ts

/**
 * Core contract addresses and constants for the SuiTrump Farm platform
 */

export const CONSTANTS = {
  PACKAGE_ID:
    "0xf9bccc3fdd6e9ff0be0f17b580c2eee3b28ac8e612f988eae975ef56dfb66ec2",
  ROUTER_ID:
    "0xf1cd6b0d5b03a789da90e561918e7d93002509432b64dd47f86301334b34cba9",
  FACTORY_ID:
    "0x3e28203cdb55212a26cbf0b04f05e8b8af6e89d693e749f14b8d866e2a4a2554",
  FARM_ID: "0x78550768d08bdb9794d60539fabbf8ec2d3d5c62bb2a1e447d0af0ab40742105",
  FARM_CONFIG_ID:
    "0x7a5c448489fb4e3de17968bdccb1cd5004d8f9cf7f5bccdc06c5f86305048d09",
  ADMIN_CAP_ID:
    "0xcab124c3fb03e7c2fabec1999bddc86641987fe743036996f719c5c118a570ed",
  PAIR_ADMIN_CAP_ID:
    "0xef5e39c4bef8e197ef6d22dda516808b68a8a78f5186252e9511ec1c53e64408",
  UPGRADE_CAP_ID:
    "0x4d89fb3b2d509513b6a36e2fe8f2164605063f89235918a6814fca236b6ad2eb",
  TOKEN_LOCKER_ID:
    "0x5c304530e6417a13c8e60628bcb30fa9c6df2be4cc813a106c90eeb422128a3b",
  TOKEN_LOCKER_ADMIN_CAP_ID:
    "0xf15cff7d963cc613f0fc263eaf5c9a251944638643728b41740d24070f196cb2",
  VICTORY_TOKEN: {
    TYPE: "0xf9bccc3fdd6e9ff0be0f17b580c2eee3b28ac8e612f988eae975ef56dfb66ec2::victory_token::VICTORY_TOKEN",
    TREASURY_CAP_WRAPPER_ID:
      "0xff15a889e76b61a06e44853e5654a142ab04d6c04a863f73990a25bb950039ce",
    MINTER_CAP_ID:
      "0xfe6a49110683b26f29f75da07256134bfc3264846b9a844d124439384c5c4854",
    METADATA_ID:
      "0xaf40d779ed50db2048a8761ec98c7d2101e38648c0d99f6257ed1c6211a9c61a",
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
