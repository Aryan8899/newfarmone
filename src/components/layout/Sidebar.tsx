// src/components/layout/Sidebar.tsx
import { useState, useEffect, MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaExchangeAlt,
  FaTractor,
  FaInfoCircle,
  FaEllipsisH,
  FaBars,
  FaTimes,
  FaTelegram,
  FaTwitter,
  FaChevronDown,
  FaChevronUp,
  FaDollarSign,
  FaDiscord,
} from "react-icons/fa";
import { NavItemProps, DropdownItemProps } from "../../types";
import pic1 from "../../assets/images/pic3.png";
import pic2 from "../../assets/images/pic2.png";
import pic5 from "../../assets/images/pic5.png";

// NavItem component with improved styling and animations - darker version
const NavItem = ({
  icon,
  label,
  isOpen,
  toggleOpen,
  children,
  isActive = false,
}: NavItemProps) => {
  const Icon = icon;
  return (
    <div className="nav-item">
      <button
        onClick={toggleOpen}
        className={`flex items-center justify-between w-full px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 group
          ${
            isActive
              ? "bg-blue-900/70 text-yellow-400 border-l-4 border-yellow-400"
              : "bg-blue-900/40 text-white hover:bg-blue-800/50"
          }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <Icon
            className={`${
              isActive ? "text-yellow-400" : "text-yellow-400"
            } group-hover:text-yellow-300 transition-colors duration-200`}
          />
          <span className="group-hover:translate-x-1 transition-transform duration-200">
            {label}
          </span>
        </div>
        <span className="transition-transform duration-200">
          {isOpen ? (
            <FaChevronUp className="text-yellow-400" />
          ) : (
            <FaChevronDown className="text-yellow-400" />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="dropdown-menu mt-1 overflow-hidden rounded-lg transition-all duration-300 animate-slideDown">
          {children}
        </div>
      )}
    </div>
  );
};

// Dropdown Menu Item component with improved styling - darker version
const DropdownItem = ({
  href,
  label,
  icon,
  isExternal = false,
  isActive = false,
}: DropdownItemProps) => {
  const Icon = icon;

  const content = (
    <div
      className={`flex items-center py-2 px-8 transition-all duration-200 cursor-pointer
      ${
        isActive
          ? "text-yellow-400 bg-blue-900/60"
          : "text-gray-200 hover:text-yellow-400 hover:bg-blue-900/40"
      }`}
    >
      {Icon && <Icon className="mr-2 text-sm" />}
      <span className="ml-2">{label}</span>
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className="block">
      {content}
    </Link>
  );
};

type MenuType = "trade" | "farm" | "info" | "more" | null;

export const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [price, setPrice] = useState("$0.000018");
  const [priceChange, setPriceChange] = useState<number>(2.5); // Price change percentage

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
      const sidebar = document.getElementById("sidebar");
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

  // Toggle menu sections
  const toggleMenu = (menu: MenuType) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-30 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        id="sidebar-toggle"
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-950 rounded-full shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar Content - Darker Version */}
      <div
        id="sidebar"
        className={`fixed top-0 left-0 w-72 h-screen bg-gradient-to-b from-blue-950/95 to-blue-900/95 text-white flex flex-col py-6 px-4 border-r border-blue-800/50 shadow-xl z-40 
        transition-all duration-300 ease-in-out backdrop-blur-md
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:static overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500/30 scrollbar-track-blue-900/20`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8 px-2">
          <img
            src={pic1}
            alt="SuiTrump Farm"
            className="w-full max-w-[220px] h-auto object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Navigation */}
        <nav className="space-y-3 mb-6">
          <Link
            to="/"
            className={`flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 group
              ${
                location.pathname === "/"
                  ? "bg-blue-900/70 text-yellow-400 border-l-4 border-yellow-400"
                  : "bg-blue-900/40 text-white hover:bg-blue-800/50"
              }`}
          >
            <FaHome
              className={`${
                location.pathname === "/"
                  ? "text-yellow-400"
                  : "text-yellow-400"
              } group-hover:text-yellow-300 transition-colors duration-200`}
            />
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
            isActive={false}
          >
            <div className="bg-blue-950/60 py-1 rounded-b-lg">
              <DropdownItem
                href="https://suidex-sigma.vercel.app/#/swap"
                label="Exchange"
                isExternal={true}
              />
              <DropdownItem
                href="https://suidex-sigma.vercel.app/#/addliquidity"
                label="Liquidity"
                isExternal={true}
              />
            </div>
          </NavItem>

          {/* Farms Dropdown */}
          <NavItem
            icon={FaTractor}
            label="Farms"
            isOpen={activeMenu === "farm"}
            toggleOpen={() => toggleMenu("farm")}
            isActive={location.pathname.includes("/farm")}
          >
            <div className="bg-blue-950/60 py-1 rounded-b-lg">
              <DropdownItem
                href="/farm"
                label="Farms"
                isActive={location.pathname === "/farm"}
              />
            </div>
          </NavItem>

          {/* Info Dropdown */}
          <NavItem
            icon={FaInfoCircle}
            label="Info"
            isOpen={activeMenu === "info"}
            toggleOpen={() => toggleMenu("info")}
            isActive={false}
          >
            <div className="bg-blue-950/60 py-1 rounded-b-lg">
              <DropdownItem
                href="https://pulsex.mypinata.cloud/ipfs/bafybeiesh56oijasgr7creubue6xt5anivxifrwd5a5argiz4orbed57qi/#/info/token/0xe846884430d527168b4eaac80af9268515d2f0cc"
                label="Pulsex"
                isExternal={true}
              />
              <DropdownItem
                href="https://dexscreener.com/pulsechain/0x0e4b3d3141608ebc730ee225666fd97c833d553e"
                label="DexScreener"
                isExternal={true}
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
            <div className="bg-blue-950/60 py-1 rounded-b-lg">
              <DropdownItem
                href="https://shitcoin-club.gitbook.io/suitrump-farm"
                label="Gitbook"
                isExternal={true}
              />
              <DropdownItem
                href="https://atropine.gitbook.io/atropine/specs/security/audits"
                label="FAQ"
                isExternal={true}
              />
            </div>
          </NavItem>
        </nav>

        {/* Price Tracker - Enhanced with price change indicator - darker version */}
        <div className="bg-blue-900/40 backdrop-blur-sm rounded-lg p-3 mb-6 border border-blue-800/50 hover:border-yellow-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaDollarSign className="text-yellow-400" />
              <span className="text-sm font-medium">Token Price</span>
            </div>
            <a
              href="https://dexscreener.com/sui/0x2c2bbe5623c66e9ddf39185d3ab5528493c904b89c415df991aeed73c2427aa9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-300 hover:text-yellow-400 transition-colors"
            >
              View Chart
            </a>
          </div>
          <div className="flex items-center mt-2 bg-blue-950/70 rounded p-2 border border-blue-900/50">
            <img
              src={pic5}
              alt="Token"
              className="w-8 h-8 object-contain mr-2"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-yellow-400">{price}</p>
                <span
                  className={`text-xs ${
                    priceChange >= 0 ? "text-green-400" : "text-red-400"
                  } font-medium`}
                >
                  {priceChange >= 0 ? "+" : ""}
                  {priceChange}%
                </span>
              </div>
              <p className="text-xs text-gray-400">SUI/TRUMP</p>
            </div>
          </div>
        </div>

        {/* Footer Section - Darker version */}
        <div className="mt-auto">
          <div className="bg-blue-900/40 backdrop-blur-sm rounded-lg p-4 mb-4 border border-blue-800/50">
            <p className="text-sm text-gray-300 font-medium mb-3">
              Audited by:
            </p>
            <div className="flex flex-col space-y-4">
              <div className="bg-blue-950/70 p-2 rounded-lg hover:bg-blue-900/70 transition-colors border border-blue-800/50 hover:border-blue-700/60">
                <img
                  src={pic2}
                  alt="Auditor Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="bg-blue-950/70 p-2 rounded-lg hover:bg-blue-900/70 transition-colors border border-blue-800/50 hover:border-blue-700/60">
                <img
                  src="https://atropine.io/static/media/tech-rate.5f5b2d0902dbdef96856.png"
                  alt="Tech Rate Logo"
                  className="h-full w-full object-contain"
                />
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
                className="text-yellow-400 text-2xl hover:text-yellow-300 transition-all duration-300 hover:scale-110"
                aria-label="Telegram"
              >
                <FaTelegram />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 text-2xl hover:text-yellow-300 transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 text-2xl hover:text-yellow-300 transition-all duration-300 hover:scale-110"
                aria-label="Discord"
              >
                <FaDiscord />
              </a>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">
              © 2025 SuiTrump Farm
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
