//@ts-nocheck

export const byteArrayToString = (byteArray: any[]): string => {
    if (!Array.isArray(byteArray)) {
      console.log("Not an array in byteArrayToString");
      return "Unknown";
    }
  
    try {
      // Handle case where the array contains objects with a `name` property
      if (byteArray.length > 0 && typeof byteArray[0] === 'object' && 'name' in byteArray[0]) {
        return byteArray.map((item: any) => item.name || "Unknown").join('::');
      }
  
      // Special case for TypeName vector
      const byteArrayStr = JSON.stringify(byteArray);
      if (byteArrayStr.includes('type_name') && byteArrayStr.includes('TypeName')) {
        return "vector<0x1::type_name::TypeName>";
      }
  
      // Check if the array contains string characters
      const allStrings = byteArray.every((b) => typeof b === 'string' && b.length === 1);
      if (allStrings) {
        return byteArray.join('');
      }
  
      // Process as character codes
      let result = '';
      for (let i = 0; i < byteArray.length; i++) {
        if (typeof byteArray[i] === 'number') {
          result += String.fromCharCode(byteArray[i]);
        } else {
          result += String(byteArray[i]);
        }
      }
  
      return result;
    } catch (e) {
      console.error("Error processing byte array:", e);
      return JSON.stringify(byteArray);
    }
  };
  
  // ✅ Extract Token Name from Type String
  export const extractTokenName = (typeString: string): string => {
    const parts = typeString.split('::');
    return parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
  };
  
  // ✅ Extract LP Tokens (if available)
  export const extractLpTokens = (typeString: string): string[] | null => {
    const lpRegex = /::pair::LPCoin<([^,]+),\s*([^>]+)>/;
    const match = lpRegex.exec(typeString);
    if (!match) return null;
    return [extractTokenName(match[1]), extractTokenName(match[2])];
  };
  
  // ✅ Process Pool Type and Extract Token Data
  export const processPoolType = (poolType, isLpToken, isNativePair) => {
    let typeString = "";
  
    // Convert pool type to string format
    if (typeof poolType === "string") {
      typeString = poolType;
    } else if (Array.isArray(poolType)) {
      typeString = byteArrayToString(poolType);
    } else if (poolType && typeof poolType === "object") {
      if (poolType.name) {
        typeString = poolType.name;
      } else if (poolType.module && poolType.module.name && poolType.name) {
        typeString = `${poolType.address}::${poolType.module.name}::${poolType.name}`;
      } else {
        typeString = JSON.stringify(poolType);
      }
    }
  
    // Handle LP tokens
    if (isLpToken) {
      const lpMatches = extractLpTokens(typeString);
      if (lpMatches && lpMatches.length > 0) {
        return {
          displayName: `${lpMatches[0]}-${lpMatches[1]} LP`,
          isLp: true,
          typeString: typeString,
          tokens: lpMatches,
        };
      }
    }
  
    // Handle single asset tokens
    const tokenName = extractTokenName(typeString);
    return {
      displayName: tokenName,
      isLp: false,
      typeString: typeString,
      tokens: tokenName ? [tokenName] : [], // ✅ Ensure `tokens` is always an array
    };
  };
  