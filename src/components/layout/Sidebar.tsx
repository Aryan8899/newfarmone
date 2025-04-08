import { useState, useEffect, MouseEvent, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@suiet/wallet-kit";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome,
  FaExchangeAlt,
  FaTractor,
  FaInfoCircle,
  FaEllipsisH,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaDollarSign,
  FaLock,
  FaArrowUp,
  FaCodeBranch,
  FaGem,
  FaWallet,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaSignOutAlt,
  FaSpinner,
  FaShieldAlt,
} from "react-icons/fa";
import { NavItemProps, DropdownItemProps } from "../../types";
import pic1 from "../../assets/images/pic3.png";
import pic5 from "../../assets/images/victory3.svg";
import { toast } from "sonner";

// Utility function to get short address
const getShortAddress = (address: string | undefined): string => {
  if (!address) return "";
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
};

// NavItem component with improved styling and animations
const NavItem = ({
  icon,
  label,
  isOpen,
  toggleOpen,
  children,
  isActive = false,
  showStatus = false,
  statusColor = "",
  badge,
}: NavItemProps & {
  showStatus?: boolean;
  statusColor?: string;
  badge?: React.ReactNode;
}) => {
  const Icon = icon;
  const itemRef = useRef<HTMLDivElement>(null);

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
        toggleOpen();
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside as unknown as EventListener
    );
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside as unknown as EventListener
      );
  }, [isOpen, toggleOpen]);

  return (
    <div className="nav-item relative z-10" ref={itemRef}>
      <button
        onClick={toggleOpen}
        className={`flex items-center justify-between w-full px-3 py-3 text-base font-medium rounded-lg transition-all duration-300 group
          ${
            isActive
              ? "bg-gradient-to-r from-blue-900/70 to-indigo-900/70 text-yellow-400 border-l-4 border-yellow-400 shadow-lg shadow-blue-900/20"
              : "bg-blue-900/40 text-white hover:bg-blue-800/60 hover:shadow-md"
          }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`${
              isActive
                ? "text-yellow-400 bg-blue-900/60 p-1.5 rounded-md"
                : "text-yellow-400 p-1.5"
            } 
            group-hover:text-yellow-300 transition-colors duration-200`}
          >
            <Icon className="text-current" />
          </div>
          <span className="group-hover:translate-x-1 transition-transform duration-200">
            {label}
          </span>

          {showStatus && (
            <div className={`h-2 w-2 rounded-full ${statusColor} ml-1`}></div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {badge}
          <span
            className={`transition-transform duration-300 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            <FaChevronDown className="text-yellow-400" />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="dropdown-menu mt-1 overflow-hidden rounded-lg transition-all duration-300 animate-slideDown z-50">
          {children}
        </div>
      )}
    </div>
  );
};

// Dropdown Menu Item component with improved styling
const DropdownItem = ({
  href,
  label,
  icon,
  isExternal = false,
  isActive = false,
  badge,
  onClick,
}: DropdownItemProps & { onClick?: () => void }) => {
  const Icon = icon;

  const content = (
    <div
      className={`flex items-center justify-between py-2.5 px-6 transition-all duration-200 cursor-pointer rounded-md my-0.5 mx-1
      ${
        isActive
          ? "text-yellow-400 bg-blue-900/60 shadow-md shadow-blue-950/20"
          : "text-gray-200 hover:text-yellow-400 hover:bg-blue-900/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center">
        {Icon && <Icon className="mr-2 text-sm" />}
        <span className="ml-2">{label}</span>
      </div>

      {badge && (
        <span className="bg-blue-600 text-xs px-2 py-0.5 rounded-full text-white">
          {badge}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        aria-label={`Visit ${label}`}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className="block" aria-label={`Go to ${label}`}>
      {content}
    </Link>
  );
};

type MenuType = "trade" | "farm" | "info" | "more" | "wallet" | null;

export const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [price, setPrice] = useState("$0.000018");
  const [priceChange, setPriceChange] = useState<number>(2.5);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Wallet functionality
  const { connected, account, disconnect, connecting, select } = useWallet();
  const [copied, setCopied] = useState(false);
  const prevConnected = useRef(connected); // Track previous connection state

  // Show toast notification on wallet connection
  useEffect(() => {
    if (connected && !prevConnected.current) {
      toast.success("Wallet connected successfully!");
    }
    prevConnected.current = connected;
  }, [connected]);

  // Copy wallet address to clipboard
  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Address copied to clipboard!");
    }
  };

  // Handle wallet connection
  const handleWalletConnect = () => {
    if (!connected && !connecting) {
      select("Sui Wallet");
    } else {
      toggleMenu("wallet");
    }
  };

  // Determine active menu based on current route
  useEffect(() => {
    if (location.pathname.includes("/farm")) {
      setActiveMenu("farm");
    } else if (location.pathname === "/") {
      // Keep current active menu or set to null
    } else {
      setActiveMenu(null);
    }
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = sidebarRef.current;
      const toggle = document.getElementById("sidebar-toggle");
      const target = event.target as Node;

      if (
        isOpen &&
        sidebar &&
        !sidebar.contains(target) &&
        toggle &&
        !toggle.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside as unknown as EventListener
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside as unknown as EventListener
      );
  }, [isOpen]);

  // Show scroll to top button when scrolling down in sidebar
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleScroll = () => {
      if (sidebar.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    sidebar.addEventListener("scroll", handleScroll);
    return () => sidebar.removeEventListener("scroll", handleScroll);
  }, []);

  // Toggle menu sections
  const toggleMenu = (menu: MenuType) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  // Scroll to top of sidebar
  const scrollToTop = () => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Close sidebar on mobile when navigating
  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  // Dynamic price update simulation (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate price fluctuation for demo purposes
      const randomChange = (Math.random() * 0.5 - 0.25).toFixed(2);
      setPriceChange(parseFloat(randomChange));

      // Calculate new price based on change
      const currentPrice = parseFloat(price.replace("$", ""));
      const newPrice = currentPrice * (1 + parseFloat(randomChange) / 100);
      setPrice(`$${newPrice.toFixed(8)}`);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [price]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Toggle Button - Fix z-index and position */}
      <button
        id="sidebar-toggle"
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-950 rounded-full shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        style={{ boxShadow: "0 0 15px rgba(234, 179, 8, 0.6)" }}
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar Content */}
      <div
        ref={sidebarRef}
        id="sidebar"
        className={`fixed top-0 left-0 w-72 md:w-80 h-screen bg-gradient-to-b from-blue-950/95 to-blue-900/95 text-white flex flex-col py-6 px-4 border-r border-blue-800/50 shadow-xl z-40 
        transition-all duration-300 ease-in-out backdrop-blur-md
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:static overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500/30 scrollbar-track-blue-900/20`}
      >
        {/* Logo with glow effect */}
        <div className="flex items-center justify-center mb-6 px-2 relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full"></div>
          <img
            src={pic1}
            alt="SuiTrump Farm"
            className="w-full max-w-[220px] h-auto object-contain hover:scale-105 transition-transform duration-300 relative z-10"
          />
        </div>

        {/* Wallet Section as a NavItem - NEW IMPLEMENTATION */}
        <div className="mb-4">
          <NavItem
            icon={FaWallet}
            label={connected ? "Connected" : "Connect Wallet"}
            isOpen={activeMenu === "wallet"}
            toggleOpen={() => handleWalletConnect()}
            isActive={connected}
            showStatus={connected}
            statusColor="bg-green-500"
            badge={
              connected ? (
                <span className="text-xs bg-blue-800/60 text-blue-300 px-1 py-0.5 rounded-full">
                  {getShortAddress(account?.address)}
                </span>
              ) : connecting ? (
                <div className="flex items-center">
                  <FaSpinner
                    className="animate-spin text-yellow-400 mr-1"
                    size={14}
                  />
                  <span className="text-xs text-yellow-400">Connecting</span>
                </div>
              ) : (
                <motion.span
                  className="text-xs bg-yellow-500/30 text-yellow-300 px-1 py-0.5 rounded-full"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Click to connect
                </motion.span>
              )
            }
          >
            {connected && (
              <div className="bg-gradient-to-b from-blue-950/80 to-blue-900/80 py-3 px-2 rounded-b-lg backdrop-blur-sm shadow-lg border border-blue-800/30">
                {/* Wallet info summary */}
                <div className="bg-blue-900/50 p-3 rounded-lg mb-3 border border-blue-800/40">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                      <span className="text-lg font-bold">
                        {account?.address?.substring(0, 1)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Sui Wallet
                      </p>
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-white/70 font-mono mr-2">
                          {getShortAddress(account?.address)}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={copyAddress}
                          className="p-1 rounded-md bg-blue-700/30 text-blue-300 hover:bg-blue-700/50 transition-colors cursor-pointer"
                        >
                          {copied ? (
                            <FaCheck className="w-3 h-3" />
                          ) : (
                            <FaCopy className="w-3 h-3" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Actions */}
                <div className="space-y-1">
                  <DropdownItem
                    href={`https://explorer.sui.io/address/${account?.address}`}
                    label="View on Explorer"
                    isExternal={true}
                    icon={FaExternalLinkAlt}
                  />

                  <DropdownItem
                    href="#"
                    label="Disconnect Wallet"
                    icon={FaSignOutAlt}
                    onClick={disconnect}
                  />
                </div>
              </div>
            )}
          </NavItem>
        </div>

        {/* Navigation */}
        <nav className="space-y-3 mb-6">
          <Link
            to="/"
            className={`flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 group
              ${
                location.pathname === "/"
                  ? "bg-gradient-to-r from-blue-900/70 to-indigo-900/70 text-yellow-400 border-l-4 border-yellow-400 shadow-lg shadow-blue-900/20"
                  : "bg-blue-900/40 text-white hover:bg-blue-800/50 hover:shadow-md"
              }`}
            onClick={handleNavigation}
          >
            <div
              className={`${
                location.pathname === "/"
                  ? "text-yellow-400 bg-blue-900/60 p-1.5 rounded-md"
                  : "text-yellow-400 p-1.5"
              } 
              group-hover:text-yellow-300 transition-colors duration-200`}
            >
              <FaHome className="text-current" />
            </div>
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              Home
            </span>
          </Link>

          {/* Trade Dropdown */}
          <NavItem
            icon={FaExchangeAlt}
            label="Trade"
            isOpen={activeMenu === "trade"}
            toggleOpen={() => toggleMenu("trade")}
            isActive={location.pathname.includes("/trade")}
          >
            <div className="bg-gradient-to-b from-blue-950/80 to-blue-900/80 py-2 rounded-b-lg backdrop-blur-sm shadow-lg border border-blue-800/30">
              <DropdownItem
                href="https://testthing2.vercel.app/#/swap"
                label="Exchange"
                isExternal={true}
                icon={FaExchangeAlt}
              />
              <DropdownItem
                href="https://testthing2.vercel.app/#/addliquidity"
                label="Liquidity"
                isExternal={true}
                icon={FaGem}
              />
            </div>
          </NavItem>

          {/* Farm - Added as main navigation item */}
          <Link
            to="/farm"
            className={`flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 group
              ${
                location.pathname === "/farm"
                  ? "bg-gradient-to-r from-blue-900/70 to-indigo-900/70 text-yellow-400 border-l-4 border-yellow-400 shadow-lg shadow-blue-900/20"
                  : "bg-blue-900/40 text-white hover:bg-blue-800/50 hover:shadow-md"
              }`}
            onClick={handleNavigation}
          >
            <div
              className={`${
                location.pathname === "/farm"
                  ? "text-yellow-400 bg-blue-900/60 p-1.5 rounded-md"
                  : "text-yellow-400 p-1.5"
              } 
              group-hover:text-yellow-300 transition-colors duration-200`}
            >
              <FaTractor className="text-current" />
            </div>
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              Farms
            </span>
            <span className="ml-auto bg-green-600/90 text-xs px-2 py-0.5 rounded-full text-white">
              New
            </span>
          </Link>

          {/* Token Locker - Added as main navigation item */}
          <Link
            to="/token-locker"
            className={`flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 group
              ${
                location.pathname === "/token-locker"
                  ? "bg-gradient-to-r from-blue-900/70 to-indigo-900/70 text-yellow-400 border-l-4 border-yellow-400 shadow-lg shadow-blue-900/20"
                  : "bg-blue-900/40 text-white hover:bg-blue-800/50 hover:shadow-md"
              }`}
            onClick={handleNavigation}
          >
            <div
              className={`${
                location.pathname === "/token-locker"
                  ? "text-yellow-400 bg-blue-900/60 p-1.5 rounded-md"
                  : "text-yellow-400 p-1.5"
              } 
              group-hover:text-yellow-300 transition-colors duration-200`}
            >
              <FaLock className="text-current" />
            </div>
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              Token Locker
            </span>
          </Link>

          {/* Info Dropdown */}
          <NavItem
            icon={FaInfoCircle}
            label="Info"
            isOpen={activeMenu === "info"}
            toggleOpen={() => toggleMenu("info")}
            isActive={location.pathname.includes("/info")}
          >
            <div className="bg-gradient-to-b from-blue-950/80 to-blue-900/80 py-2 rounded-b-lg backdrop-blur-sm shadow-lg border border-blue-800/30">
              <DropdownItem
                href="https://dexscreener.com/pulsechain/0x0e4b3d3141608ebc730ee225666fd97c833d553e"
                label="DexScreener"
                isExternal={true}
                icon={FaChartLine}
                badge="Live"
              />
            </div>
          </NavItem>

          {/* More Dropdown */}
          <NavItem
            icon={FaEllipsisH}
            label="More"
            isOpen={activeMenu === "more"}
            toggleOpen={() => toggleMenu("more")}
            isActive={false}
          >
            <div className="bg-gradient-to-b from-blue-950/80 to-blue-900/80 py-2 rounded-b-lg backdrop-blur-sm shadow-lg border border-blue-800/30">
              <DropdownItem
                href="https://shitcoin-club.gitbook.io/suitrump-farm"
                label="Gitbook"
                isExternal={true}
                icon={FaBook}
              />
              <DropdownItem
                href="https://shitcoin-club.gitbook.io/suitrump-farm/faq"
                label="FAQ"
                isExternal={true}
                icon={FaQuestion}
              />
            </div>
          </NavItem>
        </nav>

        {/* Price Tracker - Enhanced with price change indicator */}
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 backdrop-blur-sm rounded-lg p-4 mb-6 border border-blue-800/50 hover:border-yellow-500/20 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-full bg-blue-900/60 text-yellow-400 group-hover:bg-blue-800/60 transition-colors">
                <FaDollarSign className="text-current" />
              </div>
              <span className="text-sm font-medium">Token Price</span>
            </div>
            <a
              href="https://dexscreener.com/sui/0x2c2bbe5623c66e9ddf39185d3ab5528493c904b89c415df991aeed73c2427aa9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-blue-900/60 px-2 py-1 rounded-full text-blue-300 hover:text-yellow-400 transition-colors hover:bg-blue-800/60"
            >
              View Chart
            </a>
          </div>

          <div className="flex items-center mt-3 bg-gradient-to-r from-blue-950/70 to-indigo-950/70 rounded-lg p-3 border border-blue-900/50 shadow-inner">
            <div className="relative flex items-center justify-center mr-3">
              <div className="absolute inset-0 bg-yellow-500/20 blur-md rounded-full"></div>
              <img
                src={pic5}
                alt="Token"
                className="w-15 h-15 object-contain relative z-10"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gradient-gold">{price}</p>
                <span
                  className={`text-xs ${
                    priceChange >= 0 ? "text-green-400" : "text-red-400"
                  } font-medium px-2 py-0.5 rounded-full ${
                    priceChange >= 0 ? "bg-green-900/30" : "bg-red-900/30"
                  }`}
                >
                  {priceChange >= 0 ? "+" : ""}
                  {priceChange}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">SUI/TRUMP</p>
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  <span className="text-xs text-gray-400">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-auto">
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-sm rounded-lg p-4 mb-4 border border-blue-500/30 shadow-lg relative overflow-hidden hover:shadow-indigo-900/20 transition-shadow group">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/10 via-transparent to-blue-500/10 animate-pulse-slow pointer-events-none"></div>

            <p className="text-sm text-gray-200 font-medium mb-3 flex items-center gap-2">
              <FaShieldAlt className="h-4 w-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              Security Audits
            </p>

            <div className="bg-gradient-to-br from-blue-950/80 to-indigo-950/80 p-6 rounded-lg border border-indigo-500/30 shadow-inner flex flex-col items-center justify-center relative overflow-hidden group-hover:border-indigo-500/50 transition-colors">
              {/* Pulsing dots */}
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-500 animate-ping-slow"></div>
              <div
                className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-blue-500 animate-ping-slow"
                style={{ animationDelay: "1s" }}
              ></div>

              <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent text-2xl font-bold tracking-wider">
                COMING SOON
              </div>

              <div className="w-16 h-1 bg-gradient-to-r from-yellow-500 to-blue-500 rounded-full my-3 opacity-60"></div>

              <p className="text-gray-300 text-sm text-center">
                Our protocol is currently undergoing comprehensive security
                audits
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 border border-blue-500/40 text-blue-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  In Progress
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/40 border border-yellow-500/40 text-yellow-300">
                  Q2 2025
                </div>
              </div>
            </div>
          </div>

          {/* Social Icons */}
          <div className="border-t border-blue-800/50 pt-4 pb-2">
            <div className="flex items-center justify-center space-x-6">
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-link"
                aria-label="Telegram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-link"
                aria-label="Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 9.99 9.99 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">
              © 2025 SuiTrump Farm • All rights reserved
            </p>
          </div>
        </div>

        {/* Scroll to top button - only visible when scrolled down */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="absolute bottom-4 right-4 bg-blue-900/80 hover:bg-blue-800 p-2 rounded-full text-yellow-400 hover:text-yellow-300 shadow-lg transition-all duration-300 animate-fadeIn"
            aria-label="Scroll to top"
          >
            <FaArrowUp />
          </button>
        )}
      </div>

      {/* CSS for global animations and effects */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 1000px;
            opacity: 1;
          }
        }

        @keyframes pingSlow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(234, 179, 8, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(234, 179, 8, 0.6);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pingSlow 3s infinite ease-in-out;
        }

        .text-gradient-gold {
          background: linear-gradient(to right, #f59e0b, #fbbf24);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .bg-grid-pattern {
          background-image: linear-gradient(
              to right,
              rgba(99, 102, 241, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(99, 102, 241, 0.1) 1px,
              transparent 1px
            );
          background-size: 24px 24px;
        }

        .social-icon-link {
          color: #eab308;
          transition: all 0.3s;
          transform: scale(1);
          display: inline-flex;
        }

        .social-icon-link:hover {
          color: #fcd34d;
          transform: scale(1.15);
          filter: drop-shadow(0 0 5px rgba(234, 179, 8, 0.5));
        }

        .button-gold {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px -3px rgba(245, 158, 11, 0.5);
        }

        .button-gold:hover {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px -4px rgba(245, 158, 11, 0.6);
        }

        .button-gold:active {
          transform: translateY(1px);
          box-shadow: 0 2px 10px -4px rgba(245, 158, 11, 0.4);
        }

        .button-gold::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.3),
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0)
          );
          transform: rotate(45deg);
          transition: all 0.5s;
        }

        .button-gold:hover::before {
          animation: shine 1.5s infinite;
        }

        @keyframes shine {
          0% {
            left: -100%;
            top: -100%;
          }
          100% {
            left: 100%;
            top: 100%;
          }
        }
      `}</style>
    </>
  );
};

// Define missing icon components
const FaChartLine = (props: any) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM464 96H345.94c-21.38 0-32.09 25.85-16.97 40.97l32.4 32.4L288 242.75l-73.37-73.37c-12.5-12.5-32.76-12.5-45.25 0l-68.69 68.69c-6.25 6.25-6.25 16.38 0 22.63l22.62 22.62c6.25 6.25 16.38 6.25 22.63 0L192 237.25l73.37 73.37c12.5 12.5 32.76 12.5 45.25 0l96-96 32.4 32.4c15.12 15.12 40.97 4.41 40.97-16.97V112c.01-8.84-7.15-16-15.99-16z"></path>
  </svg>
);

const FaBook = (props: any) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 448 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"></path>
  </svg>
);

const FaQuestion = (props: any) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 384 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M202.021 0C122.202 0 70.503 32.703 29.914 91.026c-7.363 10.58-5.093 25.086 5.178 32.874l43.138 32.709c10.373 7.865 25.132 6.026 33.253-4.148 25.049-31.381 43.63-49.449 82.757-49.449 30.764 0 68.816 19.799 68.816 49.631 0 22.552-18.617 34.134-48.993 51.164-35.423 19.86-82.299 44.576-82.299 106.405V320c0 13.255 10.745 24 24 24h72.471c13.255 0 24-10.745 24-24v-5.773c0-42.86 125.268-44.645 125.268-160.627C377.504 66.256 286.902 0 202.021 0zM192 373.459c-38.196 0-69.271 31.075-69.271 69.271 0 38.195 31.075 69.27 69.271 69.27s69.271-31.075 69.271-69.271-31.075-69.27-69.271-69.27z"></path>
  </svg>
);

export default Sidebar;
