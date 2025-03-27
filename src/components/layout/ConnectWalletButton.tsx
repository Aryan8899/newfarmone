import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { getShortAddress } from "../../utils/helpers";

export const ConnectWalletButton = () => {
  const { connected, account } = useWallet();

  return (
    <ConnectButton
      className="sui-connect-button w-full rounded-xl transition-all duration-300"
      style={{
        backgroundColor: "#22c55e",
        color: "white",
        borderRadius: "1rem",
        fontSize: connected ? "0.875rem" : "1rem",
        boxShadow: "0 0 10px rgba(34, 197, 94, 0.6)",
      }}
    >
      {connected ? (
        <div className="flex items-center space-x-1">
          <span className="hidden sm:inline-block">
            {getShortAddress(account?.address)}
          </span>
          <span className="inline-block sm:hidden text-ellipsis overflow-hidden max-w-[80px]">
            {getShortAddress(account?.address)}
          </span>
        </div>
      ) : (
        "Connect Wallet"
      )}
    </ConnectButton>
  );
};
