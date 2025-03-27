import { SuiClient } from "@mysten/sui/client";

// Create a single, shared instance to be used across the application
export const suiClient = new SuiClient({
  url: "https://fullnode.devnet.sui.io/",
});
