/**
 * Timestamp utility functions for consistent handling of blockchain timestamps
 */

/**
 * Converts a timestamp string to milliseconds, automatically detecting if it's in seconds or milliseconds
 * @param timestamp The timestamp string from blockchain
 * @returns number Timestamp in milliseconds
 */
export const toMilliseconds = (timestamp: string | number): number => {
  const parsedTimestamp =
    typeof timestamp === "string" ? parseInt(timestamp) : timestamp;

  // If timestamp is in seconds (typical blockchain format)
  if (parsedTimestamp < 10000000000) {
    return parsedTimestamp * 1000;
  }

  // Already in milliseconds
  return parsedTimestamp;
};

/**
 * Formats a timestamp to a human-readable date
 * @param timestamp The timestamp string from blockchain
 * @returns string Formatted date string
 */
export const formatDate = (timestamp: string | number): string => {
  const date = new Date(toMilliseconds(timestamp));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formats a timestamp to show only date without time
 * @param timestamp The timestamp string from blockchain
 * @returns string Formatted date string without time
 */
export const formatDateNoTime = (timestamp: string | number): string => {
  const date = new Date(toMilliseconds(timestamp));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Calculates and formats the time elapsed since a timestamp
 * @param timestamp The timestamp string from blockchain
 * @returns string Formatted elapsed time (e.g., "2d 5h", "3h 45m", "12m")
 */
export const calculateTimeElapsed = (timestamp: string | number): string => {
  const timestampMs = toMilliseconds(timestamp);

  // Force current time to be the exact same moment for reliable debugging
  const now = Date.now();
  console.log("Current time (ms):", now);
  console.log("Stake time (ms):", timestampMs);

  const diffMs = now - timestampMs;
  console.log("Difference (ms):", diffMs);

  // Ensure we don't show negative time or zero when it's just happened
  if (diffMs < 60000) {
    // Less than a minute
    return "Just now";
  }

  // Calculate days, hours, minutes
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  console.log(`Time elapsed: ${days}d ${hours}h ${minutes}m`);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Debug function to log timezone information
 */
export const logTimezoneInfo = (): void => {
  const now = new Date();
  console.log(
    "Current timezone offset:",
    now.getTimezoneOffset() / -60,
    "hours"
  );
  console.log("Current time (local):", now.toString());
  console.log("Current time (UTC):", now.toUTCString());
  console.log("Current timestamp (ms):", now.getTime());
};
