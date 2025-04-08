import { useState, useEffect } from "react";
import { FaLock, FaArrowRight } from "react-icons/fa";
import { useBackground } from "../contexts/BackgroundContext";
import TokenLockerComponent from "../components/farm/TokenLockerComponent";

// Token Locker Banner Component
const TokenLockerBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-xl card-bg-premium-gold p-6 shadow-xl">
      {/* Subtle glow elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-dela text-white mb-2">
            <span className="text-shimmer-gold">VICTORY Token Locker</span>
          </h1>
          <p className="text-blue-200 font-poppins">
            Lock your VICTORY tokens to earn multipliers for staking rewards and
            receive additional benefits. The longer you lock, the higher your
            multiplier and farming power.
          </p>
        </div>
      </div>
    </div>
  );
};

export const TokenLocker = () => {
  const { setIntensity } = useBackground();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Set background intensity when component mounts
  useEffect(() => {
    setIntensity("low"); // Reduced intensity for a more professional look

    // Animate on load
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [setIntensity]);

  // Add scroll animation observer
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [isLoaded]);

  return (
    <div
      className={`relative min-h-screen text-white pt-2 pb-10 transition-all duration-700 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-4 relative z-10">
        {/* Token Locker Banner */}
        <div className="mb-8 animate-on-scroll">
          <TokenLockerBanner />
        </div>

        {/* Token Locker Component */}
        <div className="animate-on-scroll stagger-1">
          <TokenLockerComponent />
        </div>

        {/* Learn More Link */}
        <div className="mt-8 text-center animate-on-scroll stagger-2">
          <a
            href="https://shitcoin-club.gitbook.io/suitrump-farm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <span>Learn more about Token Locking</span>
            <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default TokenLocker;
