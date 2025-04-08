// This assumes your tokenUtils.js has existing functionality - add these new functions to your file

// Add these new functions to your tokenUtils.js file
// Make sure to keep any existing functions and exports that are already there

/**
 * Dynamically finds an object ID for a given coin type
 * @param {string} coinType - The coin type (e.g. "0x2::sui::SUI")
 * @param {Object} suiClient - The SUI client instance
 * @param {string} address - User's wallet address
 * @returns {Promise<string|null>} - Object ID or null if not found
 */
export const getTokenObjectId = async (
  coinType: any,
  suiClient: any,
  address: any
) => {
  if (!coinType || !address) return null;

  try {
    console.log(
      `[getTokenObjectId] Fetching object ID for coin type: ${coinType}`
    );

    // Normalize the coin type format
    const normalizedCoinType = normalizeCoinType(coinType);
    console.log(
      `[getTokenObjectId] Normalized coin type: ${normalizedCoinType}`
    );

    // Get all coins of the given type
    const coinsResponse = await suiClient.getCoins({
      owner: address,
      coinType: normalizedCoinType,
    });

    if (coinsResponse.data && coinsResponse.data.length > 0) {
      // Return the ID of the first coin found
      const objectId = coinsResponse.data[0].coinObjectId;
      console.log(
        `[getTokenObjectId] Found object ID ${objectId} for type ${normalizedCoinType}`
      );
      return objectId;
    }

    console.warn(
      `[getTokenObjectId] No coins found for type: ${normalizedCoinType}`
    );
    return null;
  } catch (error) {
    console.error(
      `[getTokenObjectId] Error finding object ID for ${coinType}:`,
      error
    );
    return null;
  }
};

/**
 * Ensures coin type is in the proper format
 * @param {string} coinType - The coin type to normalize
 * @returns {string} - The normalized coin type
 */
export const normalizeCoinType = (coinType: any) => {
  if (!coinType) return "";

  // If it's already properly formatted, return as is
  if (coinType.startsWith("0x")) {
    return coinType;
  }

  // Handle special case for SUI
  if (coinType.toLowerCase().includes("sui::sui")) {
    return "0x2::sui::SUI";
  }

  // Add '0x' prefix if it's a full type without it
  if (coinType.includes("::")) {
    const parts = coinType.split("::");
    if (parts.length >= 3 && !parts[0].startsWith("0x")) {
      parts[0] = `0x${parts[0]}`;
      return parts.join("::");
    }
  }

  return coinType;
};

/**
 * Extracts token types from LP token string
 * @param {string} lpTypeString - The LP token type string
 * @returns {Object|null} - Object with token0Type and token1Type, or null if parsing failed
 */
export const extractTokenTypesFromLP = (lpTypeString: any) => {
  if (!lpTypeString || !lpTypeString.includes("::pair::LPCoin<")) return null;

  try {
    // Use a more robust regex that handles nested types
    const match = lpTypeString.match(/LPCoin<([^,>]+),\s*([^>]+)>/);

    if (match) {
      let token0Type = match[1].trim();
      let token1Type = match[2].trim();

      // If there are unbalanced angle brackets, use a different approach
      const openBrackets0 = (token0Type.match(/</g) || []).length;
      const closeBrackets0 = (token0Type.match(/>/g) || []).length;

      if (openBrackets0 !== closeBrackets0) {
        // Extract manually by parsing the full string
        const innerContent = lpTypeString.substring(
          lpTypeString.indexOf("<") + 1,
          lpTypeString.lastIndexOf(">")
        );

        // Find the proper split point by counting brackets
        let depth = 0;
        let splitIndex = -1;

        for (let i = 0; i < innerContent.length; i++) {
          if (innerContent[i] === "<") depth++;
          else if (innerContent[i] === ">") depth--;
          else if (innerContent[i] === "," && depth === 0) {
            splitIndex = i;
            break;
          }
        }

        if (splitIndex > 0) {
          token0Type = innerContent.substring(0, splitIndex).trim();
          token1Type = innerContent.substring(splitIndex + 1).trim();
        }
      }

      // Normalize the extracted types
      return {
        token0Type: normalizeCoinType(token0Type),
        token1Type: normalizeCoinType(token1Type),
      };
    }
  } catch (error) {
    console.error("Error extracting token types from LP:", error);
  }

  return null;
};
