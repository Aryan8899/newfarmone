// Enhanced Dashboard.tsx with reduced motion and sophisticated design
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaTractor,
  FaChartLine,
  FaTwitter,
  FaExclamationCircle,
  FaCoins,
  FaMoneyBillWave,
  FaChartPie,
  FaArrowRight,
  FaExternalLinkAlt,
  FaStar,
  FaFire,
} from "react-icons/fa";
import { useWallet } from '@suiet/wallet-kit';
import { SuiClient } from "@mysten/sui/client";
import { useBackground } from "../contexts/BackgroundContext";
import { StatsCardProps, ValueCardProps, MarketStats } from "../types";
import { suiClient } from "@/utils/suiClient";

// Enhanced Stats Card Component with reduced motion
const StatsCard = ({ label, value, icon, trend = null }: StatsCardProps) => {
  const Icon = icon;

  return (
    <div className="card-bg-premium p-5 rounded-xl overflow-hidden relative transition-all duration-300 hover:-translate-y-1">
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>

      {/* Only 3 particles for minimal animation */}
      <div className="particle-container">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`particle ${i % 2 === 0 ? "particle-gold" : ""}`}
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="pl-2 relative z-10">
        <div className="flex items-center mb-3 gap-2">
          <div className="bg-blue-900/60 p-2 rounded-lg border border-blue-800/50">
            <Icon className="text-yellow-400 text-xl transition-transform duration-300" />
          </div>
          <span className="text-blue-200 font-poppins text-sm">{label}</span>
        </div>
        <div className="font-dela text-xl stats-value transition-colors duration-300">
          {value}
        </div>
        {trend !== null && (
          <div
            className={`text-xs mt-2 flex items-center gap-1 font-medium ${
              trend > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last week
            {trend > 0 && <FaStar size={10} className="text-yellow-400" />}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Value Card Component with reduced animations
const ValueCard = ({ label, value, dollarValue, icon }: ValueCardProps) => {
  const Icon = icon;

  return (
    <div className="card-bg-premium-gold p-5 rounded-xl overflow-hidden relative transition-all duration-300 hover:-translate-y-1">
      {/* Golden accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-500/20 to-transparent rounded-full"></div>

      <div className="flex justify-between items-start mb-2 relative z-10">
        <p className="text-base font-poppins text-white">{label}</p>
        <div className="bg-blue-900/70 p-2 rounded-lg border border-yellow-500/30">
          <Icon className="text-yellow-400 text-xl" />
        </div>
      </div>

      <h3 className="text-3xl font-dela mt-3 relative z-10 text-white hover:text-yellow-300 transition-colors duration-300">
        {value}
      </h3>
      <p className="text-sm text-gray-400 font-poppins relative z-10">
        {dollarValue}
      </p>
    </div>
  );
};

// Featured Banner Component with reduced motion
const FeaturedBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-xl card-bg-premium-gold p-6 shadow-xl">
      {/* Subtle glow elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-dela text-white mb-2">
            Welcome to <span className="text-shimmer-gold">SuiTrump Farm</span>
          </h1>
          <p className="text-blue-200 font-poppins max-w-xl">
            Stake, Farm and Earn in the Most Presidential DeFi Platform.
            Experience{" "}
            <span className="text-yellow-400">unprecedented yields</span> with
            our innovative farming strategies.
          </p>
        </div>
        <Link to="/farm">
          <button className="button-gold py-3 px-8 rounded-xl flex items-center gap-2 font-dela shadow-lg hover:shadow-yellow-600/20">
            <FaTractor />
            Start Farming
          </button>
        </Link>
      </div>
    </div>
  );
};

// Twitter Card Component with proper content display
const TweetDisplay = ({ tweetId }: any) => {
  const [tweetContent, setTweetContent] = useState({
    text: "Loading tweet...",
    username: "SuiTrump",
    date: "Loading...",
  });

  // In a real implementation, you would fetch the tweet content from Twitter API
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      if (tweetId === "1868928300820971833") {
        setTweetContent({
          text: "Big announcement coming! Our VICTORY tokens are experiencing unprecedented growth. The best is yet to come! #SuiTrump #Crypto",
          username: "SuiTrump",
          date: "2h ago",
        });
      } else if (tweetId === "1868101777171923259") {
        setTweetContent({
          text: "Just launched our new farm with 128% APY. This is going to be HUGE! Many people are saying it's the best farm they've ever seen. #Farming #DeFi",
          username: "SuiTrump",
          date: "5h ago",
        });
      } else {
        setTweetContent({
          text: "We're making farming great again! Join thousands of happy farmers earning passive income with SuiTrump Farm.",
          username: "SuiTrump",
          date: "1d ago",
        });
      }
    }, 500);
  }, [tweetId]);

  return (
    <div className="tweet-card card-bg-premium rounded-xl p-4 h-[200px]">
      <div className="flex items-start space-x-3 mb-2">
        <div className="w-10 h-10 rounded-full user-badge-gold flex items-center justify-center">
          <FaTwitter className="text-white" />
        </div>
        <div>
          <div className="flex items-center">
            <h4 className="font-bold text-white">{tweetContent.username}</h4>
            <span className="text-yellow-400 text-xs ml-2">
              <FaTwitter />
            </span>
          </div>
          <p className="text-xs text-gray-400">{tweetContent.date}</p>
        </div>
      </div>

      <div className="embed-container overflow-hidden h-[110px]">
        <p className="text-white text-sm leading-relaxed">
          {tweetContent.text}
        </p>
      </div>

      <div className="flex justify-end mt-2">
        <a
          href={`https://twitter.com/user/status/${tweetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1 group"
        >
          View on Twitter
          <FaExternalLinkAlt
            size={12}
            className="group-hover:translate-x-1 transition-transform duration-300"
          />
        </a>
      </div>
    </div>
  );
};

// Market Stats Component with subtle animations
const MarketStatsSection = ({ stats }: { stats: MarketStats }) => {
  // Animate numbers on mount with reduced complexity
  const [animatedStats, setAnimatedStats] = useState<MarketStats>({
    marketCap: "$0",
    totalLiquidity: "$0",
    totalMinted: "0",
    circulatingSupply: "0",
    newVictoryPerBlock: "0",
  });

  useEffect(() => {
    // Animate key stats with simpler animation
    const duration = 1500; // Reduced duration
    const startTime = Date.now();
    const endTime = startTime + duration;

    const animateStats = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);

      // Update all stats at once for better performance
      setAnimatedStats({
        marketCap: `$${formatNumber(
          parseFloat(stats.marketCap.replace(/[$,]/g, "")) * progress
        )}`,
        totalLiquidity: `$${formatNumber(
          parseFloat(stats.totalLiquidity.replace(/[$,]/g, "")) * progress
        )}`,
        totalMinted: formatNumber(
          parseFloat(stats.totalMinted.replace(/,/g, "")) * progress
        ),
        circulatingSupply: formatNumber(
          parseFloat(stats.circulatingSupply.replace(/,/g, "")) * progress
        ),
        newVictoryPerBlock: formatNumber(
          parseFloat(stats.newVictoryPerBlock.replace(/,/g, "")) * progress
        ),
      });

      if (progress < 1) {
        requestAnimationFrame(animateStats);
      } else {
        setAnimatedStats(stats);
      }
    };

    // Helper function to format numbers with commas
    const formatNumber = (num: any) => {
      return Math.floor(num)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    animateStats();
  }, [stats]);

  return (
    <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden relative">
      {/* Gold accent corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaChartPie className="text-yellow-400 float-animation-minimal" />
            <span className="text-shimmer-gold">SuiTrump Stats</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Market Cap"
            value={animatedStats.marketCap}
            icon={FaMoneyBillWave}
            trend={2.4}
          />
          <StatsCard
            label="Total Liquidity"
            value={animatedStats.totalLiquidity}
            icon={FaChartLine}
            trend={1.7}
          />
          <StatsCard
            label="Total Minted"
            value={animatedStats.totalMinted}
            icon={FaCoins}
          />
          <StatsCard
            label="Circulating Supply"
            value={animatedStats.circulatingSupply}
            icon={FaChartLine}
            trend={-0.8}
          />
        </div>

        <div className="mt-6 card-bg-premium-gold backdrop-blur-sm rounded-lg p-4 shadow-inner shadow-blue-900/10">
          <div className="flex items-center gap-3 mb-2">
            <FaFire className="text-yellow-400 text-xl" />
            <h3 className="font-dela text-white text-lg">New VICTORY/block</h3>
          </div>
          <div className="text-2xl font-dela text-shimmer-gold">
            {animatedStats.newVictoryPerBlock}
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Actions Panel with enhanced styling
const QuickActionsPanel = () => {
  return (
    <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white">
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/farm" className="block group">
            <div className="card-bg-premium-gold rounded-xl p-4 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-blue-900/60 border border-yellow-500/30">
                  <FaTractor className="text-yellow-400 text-xl" />
                </div>
                <h3 className="font-dela text-lg text-white group-hover:text-yellow-300 transition-colors">
                  Stake in Farms
                </h3>
              </div>
              <p className="text-blue-200 text-sm mb-3">
                Earn <span className="text-yellow-400">VICTORY</span> by staking
                LP tokens in our high-yield farms
              </p>
              <div className="flex justify-end">
                <div className="text-yellow-400 flex items-center gap-1 text-sm group-hover:translate-x-1 transition-transform duration-300">
                  Go to Farms <FaArrowRight />
                </div>
              </div>
            </div>
          </Link>

          <a
            href="https://testthing2.vercel.app/#/swap"
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="card-bg-premium-gold rounded-xl p-4 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-blue-900/60 border border-yellow-500/30">
                  <FaCoins className="text-yellow-400 text-xl" />
                </div>
                <h3 className="font-dela text-lg text-white group-hover:text-yellow-300 transition-colors">
                  Buy VICTORY
                </h3>
              </div>
              <p className="text-blue-200 text-sm mb-3">
                Trade and acquire{" "}
                <span className="text-yellow-400">VICTORY</span> tokens to use
                in our platform
              </p>
              <div className="flex justify-end">
                <div className="text-yellow-400 flex items-center gap-1 text-sm group-hover:translate-x-1 transition-transform duration-300">
                  Go to Exchange <FaExternalLinkAlt size={12} />
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

// Farmer Dashboard Component with enhanced styling
const FarmerDashboard = ({ victoryBalance }: { victoryBalance: string }) => {

  return (
    <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full"></div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaTractor className="text-yellow-400" />
            Your Farm Stats
          </h2>
        </div>

        <div className="space-y-4">
          <ValueCard
            label="VICTORY to Harvest"
            value="0.000"
            dollarValue="~$0.00"
            icon={FaTractor}
          />
<ValueCard
  label="VICTORY in Wallet"
  value={victoryBalance}
  dollarValue="~$0.00"
  icon={FaCoins}
/>



          <div className="flex justify-end mt-4">
            <Link to="/farm" className="group">
              <button className="button-gold py-3 px-6 rounded-lg flex items-center gap-2 font-dela shadow-lg hover:shadow-yellow-600/20">
                <FaTractor className="text-lg" />
                <span>View All Farms</span>
                <FaArrowRight className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Market Chart Component with enhanced styling
const MarketChart = () => {
  return (
    <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden h-full">
      {/* Gold accent corner */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-br-full"></div>

      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaChartLine className="text-yellow-400" />
            Market Data
          </h2>
        </div>

        <div className="flex-grow rounded-lg overflow-hidden border border-yellow-500/20 shadow-inner shadow-blue-900/10">
          <iframe
            src="https://dexscreener.com/sui/0x2c2bbe5623c66e9ddf39185d3ab5528493c904b89c415df991aeed73c2427aa9?embed=1&theme=dark&trades=0&info=0"
            title="Dex Screener Chart"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

// Twitter Feed with enhanced styling
const TwitterFeed = () => {
  // Real tweet IDs
  const tweetIds = [
    "1868928300820971833",
    "1868101777171923259",
    "1867235689012345678",
  ];

  return (
    <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="accent-line"></div>
          <h2 className="text-2xl sm:text-3xl font-dela tracking-wider text-white flex items-center gap-2">
            <FaTwitter className="text-yellow-400" />
            <span className="text-shimmer-gold">Twitter Updates</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tweetIds.map((tweetId, index) => (
            <div
              key={tweetId}
              className={`animate-on-scroll stagger-${index + 1}`}
            >
              <TweetDisplay tweetId={tweetId} />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <a
            href="https://twitter.com/SuiTrump"
            target="_blank"
            rel="noopener noreferrer"
            className="button-gold px-5 py-2 rounded-full text-sm flex items-center gap-2 group"
          >
            <FaTwitter />
            Follow us on Twitter
            <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { setIntensity } = useBackground();
  const [victoryBalance, setVictoryBalance] = useState('0.000');
const { account, connected } = useWallet();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    marketCap: "$475,605",
    totalLiquidity: "$747,994",
    totalMinted: "27,555,347,489",
    circulatingSupply: "24,233,553,850",
    newVictoryPerBlock: "13,000",
  });

  // Set background intensity when component mounts
  useEffect(() => {
    setIntensity("low"); // Reduced intensity for a more professional look
  }, [setIntensity]);


  useEffect(() => {
    const fetchVictoryBalance = async () => {
      if (!connected || !account?.address) return;
      
      const all = await suiClient.getAllBalances({ owner: account.address });
      console.log("ALL BALANCES", all);
      
      try {
        const balances = await suiClient.getBalance({
          owner: account.address,
          coinType: '0xdf026c0faf8930c852e5efc6c15edc15c632abdc22de4c2d766d22c42a32eda9::victory_token::VICTORY_TOKEN',
        });
        
        // Convert the raw balance to billions
        const rawBalance: string = balances.totalBalance;
        
        // Given the discrepancy, it seems the wallet is dividing by 10^15 to get billions
        const billionsValue = parseFloat(rawBalance) / 1e15;
        
        // Format to 2 decimal places with commas for thousands
        const formattedBalance = billionsValue.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
        
        // Add the "B" suffix to match the wallet display
        setVictoryBalance(`${formattedBalance} B`);
      } catch (err) {
        console.error("Failed to fetch VICTORY balance:", err);
      }
    };
    
    fetchVictoryBalance();
  }, [connected, account]);

  // Animation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

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
        {/* Featured Banner */}
        <div className="mb-8 animate-on-scroll">
          <FeaturedBanner />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Farmer Dashboard */}
          <div className="animate-on-scroll stagger-1">
          <FarmerDashboard victoryBalance={victoryBalance} />

          </div>

          {/* Market Chart */}
          <div className="animate-on-scroll stagger-2">
            <MarketChart />
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8 animate-on-scroll stagger-3">
          <QuickActionsPanel />
        </div>

        {/* Market Stats Section */}
        <div className="mb-8 animate-on-scroll stagger-4">
          <MarketStatsSection stats={marketStats} />
        </div>

        {/* Twitter Feed */}
        <div className="animate-on-scroll stagger-5">
          <TwitterFeed />
        </div>
      </div>
    </div>
  );
};
