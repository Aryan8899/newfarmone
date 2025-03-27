// src/components/layout/Header.tsx
import { useState, useEffect, useRef } from "react";
import { useWallet } from "@suiet/wallet-kit";
import pic1 from "../../assets/images/pic4.png";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

export const Header = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { connected } = useWallet();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const walletButtonRef = useRef<HTMLButtonElement>(null);
  const prevConnected = useRef(connected); // Track previous connection state

  useEffect(() => {
    // Show toast only when connection state changes from disconnected to connected
    if (connected && !prevConnected.current) {
      toast.success("Wallet connected successfully!");
    }
    prevConnected.current = connected;
    setDropdownVisible(false);
  }, [connected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        walletButtonRef.current &&
        !walletButtonRef.current.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleWalletClick = () => {
    setDropdownVisible(!dropdownVisible);
  };

  return (
    <header className="flex flex-col items-center px-2 py-2 shadow-md relative backdrop-blur-sm bg-blue-900/10 border-b border-blue-800/30">
      {/* Logo */}
      <div className="relative overflow-hidden w-full flex justify-center">
        {/* Decorative elements */}
        <div className="absolute left-1/4 top-1/2 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl transform -translate-y-1/2"></div>
        <div className="absolute right-1/4 top-1/2 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl transform -translate-y-1/2"></div>

        <img
          src={pic1}
          alt="trump"
          className="w-[300px] sm:w-[500px] h-[150px] sm:h-[230px] object-contain mt-6 sm:-mt-10 relative z-10 transition-transform duration-500 hover:scale-105"
        />
      </div>

      <h2 className="font-dela text-[18px] xs:text-[24px] sm:text-[30px] md:text-[32px] lg:text-[32px] xl:text-[32px] font-normal tracking-normal leading-[1.2em] text-custombackgr text-center -mt-6 sm:-mt-10 md:-mt-12 lg:-mt-16 [text-shadow:2px_2px_0px_white,-2px_2px_0px_white,2px_-2px_0px_white,-2px_-2px_0px_white] whitespace-normal px-4 relative z-10">
        IT'S ALL ABOUT WINNING
      </h2>
      <div className="absolute top-4 right-4 z-20">
        <div className="hidden sm:block">
          <ConnectWalletButton />
        </div>
        <div className="sm:hidden relative mt-2">
          {!dropdownVisible && (
            <button
              ref={walletButtonRef}
              className="text-white p-2 rounded-full bg-[#22c55e] shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
              onClick={handleWalletClick}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={28} color="white" />
            </button>
          )}

          {dropdownVisible && (
            <div
              ref={dropdownRef}
              className="absolute right-0 z-50 animate-fadeIn"
            >
              <ConnectWalletButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
