// src/constants/addresses.ts

/**
 * Core contract addresses and constants for the SuiTrump Farm platform
 */

export const CONSTANTS = {
  // Core Package and Module IDs
  PACKAGE_ID: "0xf882b67867ad5675b77f9fda790f417c330ae58915f0f664b70bc70669445cbf",
  ROUTER_ID: "0xba8682b84022f543bcf82b9d66ee60491854092297196b883f7ad7979caec767",
  FACTORY_ID: "0x1391ce4492050b5c59fabddad964b5cda28729023fdfa5b461dab8ceaaa8816e",
  FARM_ID: "0x7402d190651222ed521aa01dde56113e34ef5fc4ce017d2e8b07d99018dc7833",
  FARM_CONFIG_ID: "0x52b42a084509ebd8ef91aa9a4a295bdd9839f4db6a93d1986edd907df689ea85",
  ADMIN_CAP_ID: "0x460b4cb0ef27f986f81db8f15e522d5387217df975b31ad2ad6c6f6df5b4071c",
  PAIR_ADMIN_CAP_ID: "0x83f69f8dcb9d7909674b43a5f281f53ee3b418275bab04bb852449840da1402d",
  UPGRADE_CAP_ID: "0x57d89902457bd75874a7acf490b4eeaa4c744a04d3c6823a12c03fa82137491d",
  TOKEN_LOCKER_ID: "0xa3bbf2e25880c6f122c731d8769f13aa1878dfac56b24f054c7d74984006d3d8",
  TOKEN_LOCKER_ADMIN_CAP_ID: "0xa2c3ae175010c45e11c242f727919aa91ad936e7071dad209923413fd19b0d9d",
  VICTORY_TOKEN: {
      TYPE: "0xf882b67867ad5675b77f9fda790f417c330ae58915f0f664b70bc70669445cbf::victory_token::VICTORY_TOKEN",
      TREASURY_CAP_WRAPPER_ID: "0xb6f29fe44b483d609e5e8a584464f678898aa3ae367381574bdea817f857a6c1",
      MINTER_CAP_ID: "0x7e1eb55423a1d5df4396acc59537d4fa2a7b1f75e246bb3a24123766544e0109",
      METADATA_ID: "0x30215ecad16425335bf9d9734303b2538feaa9e3ccd3170a3d56eb4dfb086e28"
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
      TOKEN_LOCKER: "token_locker"
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
