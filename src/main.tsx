// src/main.tsx
import React from "react";
import * as ReactDOM from "react-dom/client";
import { WalletProvider, AllDefaultWallets } from "@suiet/wallet-kit";

import { SuiClientProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import App from "./App";
import "./index.css";
import "@suiet/wallet-kit/style.css";
import "./suiet-wallet-kit-custom.css"; // Custom styles for wallet kit

// Create query client
const queryClient = new QueryClient();

// Network configuration
const networks = {
  devnet: { url: getFullnodeUrl("devnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
};

// Root element for React rendering
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Create root and render app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="devnet">
        <WalletProvider defaultWallets={[...AllDefaultWallets]}>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
