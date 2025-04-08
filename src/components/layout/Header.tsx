// src/components/layout/Header.tsx
import React from "react";
import pic1 from "../../assets/images/pic4.png";

export const Header = () => {
  return (
    <header className="relative z-30 w-full bg-gradient-to-b from-blue-950/40 to-blue-900/30 border-b border-blue-800/20 shadow-lg backdrop-blur-md">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E')",
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Main content container with reduced padding */}
      <div className="max-w-7xl mx-auto px-4 py-1 md:py-2">
        <div className="flex flex-col items-center">
          {/* Logo section with professional lighting effects */}
          <div className="relative w-full flex justify-center">
            {/* Premium lighting effects */}
            <div className="absolute left-1/4 top-1/2 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl transform -translate-y-1/2"></div>
            <div className="absolute right-1/4 top-1/2 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl transform -translate-y-1/2"></div>
            <div className="absolute top-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl transform -translate-y-1/2"></div>

            {/* Logo with enhanced hover effect - slightly reduced height */}
            <div className="relative overflow-visible">
              <img
                src={pic1}
                alt="SuiTrump Farm"
                className="w-[280px] sm:w-[400px] h-auto object-contain relative z-10 transition-all duration-500 hover:scale-105 hover:drop-shadow-[0_0_15px_rgba(234,179,8,0.2)]"
              />

              {/* Ultra subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          </div>

          {/* Tagline with premium styling - added spacing */}
          <div className="mt-3 text-center relative">
            {/* Background glow effect for tagline */}
            <div className="absolute -inset-x-5 -inset-y-1 bg-yellow-400/5 blur-lg rounded-full opacity-0 hover:opacity-100 transition-opacity duration-700"></div>

            <h2 className="relative font-bold text-base xs:text-lg sm:text-xl md:text-2xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 drop-shadow-sm">
              IT'S ALL ABOUT WINNING
            </h2>

            {/* Animated decorative underline */}
            <div className="relative h-[2px] w-36 md:w-56 lg:w-64 bg-gradient-to-r from-blue-600/0 via-yellow-500 to-blue-600/0 rounded-full mx-auto mt-0 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r after:from-yellow-400/0 after:via-yellow-400 after:to-yellow-400/0 after:rounded-full after:animate-shine after:bg-[length:200%_100%]"></div>
          </div>
        </div>
      </div>

      {/* Enhanced bottom border with gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-blue-800/0 via-yellow-400/30 to-blue-800/0"></div>
    </header>
  );
};

export default Header;

// Add this CSS in your global styles or here as JSX style
<style>{`
  @keyframes shine {
    0% {
      background-position: -100% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`}</style>;
