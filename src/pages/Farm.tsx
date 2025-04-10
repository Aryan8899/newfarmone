import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import {
  FaTractor,
  FaChartLine,
  FaCoins,
  FaInfoCircle,
  FaStar,
  FaChartPie,
  FaExclamationTriangle,
  FaArrowRight,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { useBackground } from "../contexts/BackgroundContext";
import EventBasedPoolListComponent from "../components/farm/EventBasedPoolListComponent";
import StakingComponent from "../components/farm/StakingComponent";
import UserStakesComponent from "../components/farm/UserStakesComponent";
import { FarmStatsSection } from "../components/farm/FarmStatsSection";
import { CONSTANTS } from "../constants/addresses";

interface FarmTabType {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface PoolCountData {
  totalPools: number;
  lpPools: number;
  singleAssetPools: number;
}

// Farm Banner Component
const FarmBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-xl card-bg-premium-gold p-6 shadow-xl">
      {/* Subtle glow elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-dela text-white mb-2">
            <span className="text-shimmer-gold">SuiTrump Farm</span>
          </h1>
          <p className="text-blue-200 font-poppins max-w-xl">
            Stake tokens, provide liquidity, and earn{" "}
            <span className="text-yellow-400">VICTORY tokens</span> as rewards.
            The more you stake, the more you earn.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/my-positions" className="w-full sm:w-auto">
                      <button className="button-secondary py-2 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 font-dela shadow-lg hover:shadow-blue-600/20 w-full cursor-pointer">
                        <FaChartPie />
                        My Positions
                      </button>
                    </Link>
        </div>
      </div>
    </div>
  );
};

// Custom EventBasedPoolListComponent wrapper to capture pool counts
const PoolListWrapper = ({
  calculateAPR,
  onPoolCountChange,
}: {
  calculateAPR?: Function;
  onPoolCountChange: (data: PoolCountData) => void;
}) => {
  // This function will be passed to the child component to report back the pool counts
  const handlePoolDataLoaded = useCallback(
    (totalPools: number, lpPools: number, singleAssetPools: number) => {
      if (totalPools > 0) {
        const newData = {
          totalPools,
          lpPools,
          singleAssetPools,
        };
        onPoolCountChange(newData);

        // Log success for debugging
        console.log("Pool data loaded successfully:", newData);
      }
    },
    [onPoolCountChange]
  );

  return (
    <EventBasedPoolListComponent
      calculateAPR={calculateAPR}
      onPoolDataLoaded={handlePoolDataLoaded}
    />
  );
};

// FAQ Section
const FarmFAQ = () => {
  const [openQuestions, setOpenQuestions] = useState<number[]>([]);

  const toggleQuestion = (index: number) => {
    if (openQuestions.includes(index)) {
      setOpenQuestions(openQuestions.filter((q) => q !== index));
    } else {
      setOpenQuestions([...openQuestions, index]);
    }
  };

  const faqs = [
    {
      question: "How do farm rewards work?",
      answer:
        "Farm rewards are distributed in VICTORY tokens based on your share of the total tokens staked in a pool. The APR varies by pool based on allocation points assigned to each pool, ensuring fair distribution of rewards.",
    },
    {
      question: "What are LP tokens?",
      answer:
        "LP (Liquidity Provider) tokens represent your share of a liquidity pool on SuiDex. When you provide liquidity, you receive LP tokens which can be staked in farms to earn additional rewards.",
    },
    {
      question: "How is APR calculated?",
      answer:
        "APR (Annual Percentage Rate) is calculated based on the current value of rewards distributed to a pool over a year, divided by the total value of tokens staked in that pool. It can fluctuate based on token prices and total staked amount.",
    },
    {
      question: "Are there fees for staking or unstaking?",
      answer:
        "Yes, there may be deposit and withdrawal fees for some pools. Typical fees range from 0.1% to 1% depending on the pool. These fees are used to buy back and burn VICTORY tokens and provide rewards to token lockers.",
    },
  ];

  return (
    <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden relative mt-8">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="accent-line"></div>
          <h2 className="text-2xl font-dela tracking-wider text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="card-bg-premium-gold rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center"
              >
                <h3 className="text-white font-medium">{faq.question}</h3>
                {openQuestions.includes(index) ? (
                  <FaChevronUp className="text-yellow-400" />
                ) : (
                  <FaChevronDown className="text-yellow-400" />
                )}
              </button>
              {openQuestions.includes(index) && (
                <div className="px-6 py-4 pt-0 bg-blue-900/30">
                  <p className="text-blue-200">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Farm APR calculator function
const calculatePoolAPR = (
  poolInfo: any,
  tokenPrice: string,
  stakedTokenPrice: string,
  farmInfo: any
) => {
  // Handle zero cases to avoid division by zero
  if (poolInfo.totalStaked === 0n || farmInfo.totalAllocationPoints === 0n) {
    return 0;
  }

  // Convert values to JavaScript numbers for calculation
  const tokenPriceNum = parseFloat(tokenPrice);
  const stakedTokenPriceNum = parseFloat(stakedTokenPrice);

  // Calculate pool's share of rewards
  const poolShare =
    Number(poolInfo.allocationPoints) / Number(farmInfo.totalAllocationPoints);

  // Calculate yearly rewards for this pool
  const yearlyRewards = Number(farmInfo.emissionsPerYear) * poolShare;

  // Convert to 18 decimal precision to match token decimals
  const yearlyRewardsAdjusted = yearlyRewards / 1e18;

  // Calculate value of yearly rewards in USD
  const yearlyRewardsValue = yearlyRewardsAdjusted * tokenPriceNum;

  // Calculate total value of staked tokens in USD
  const totalStakedValue =
    (Number(poolInfo.totalStaked) / 1e18) * stakedTokenPriceNum;

  // Calculate APR: (yearly rewards value / total staked value) * 100
  const apr = (yearlyRewardsValue / totalStakedValue) * 100;

  return apr;
};

// Main Farm Component
export const Farm = () => {
  const { setIntensity } = useBackground();
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("pools");
  const { connected } = useWallet();
  const poolListRef = useRef<HTMLDivElement>(null);
  const [poolCountData, setPoolCountData] = useState<PoolCountData | null>(
    null
  );

  // Define farm tabs (removed locker tab)
  const farmTabs: FarmTabType[] = [
    { id: "pools", label: "Farm Pools", icon: FaTractor },
    { id: "stake", label: "Stake", icon: FaCoins },
    { id: "positions", label: "My Positions", icon: FaChartLine },
  ];

  // Handle pool count data changes
  const handlePoolCountChange = useCallback((data: PoolCountData) => {
    console.log("Farm received pool count data:", data);
    setPoolCountData(data);
  }, []);

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

  // Scroll to pool list when tab changes
  useEffect(() => {
    if (activeTab === "pools" && poolListRef.current) {
      setTimeout(() => {
        poolListRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [activeTab]);

  // Connect wallet reminder
  const handleTabClick = (tabId: string) => {
    if (!connected && (tabId === "stake" || tabId === "positions")) {
      toast.warning("Please connect your wallet to access this feature", {
        description:
          "Wallet connection is required for staking and viewing positions.",
        duration: 5000,
      });
      return;
    }

    setActiveTab(tabId);
  };

  return (
    <div
      className={`relative min-h-screen text-white pt-2 pb-10 transition-all duration-700 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-4 relative z-10">
        {/* Farm Banner */}
        <div className="mb-8 animate-on-scroll">
          <FarmBanner />
        </div>

        {/* Farm Stats - Using the enhanced component */}
        <div className="mb-8 animate-on-scroll stagger-1">
          <FarmStatsSection poolCountData={poolCountData} />
        </div>

        {/* Farm Tabs Navigation */}
        <div className="mb-8 animate-on-scroll stagger-2">
          <div className="card-bg-premium rounded-xl shadow-xl overflow-hidden">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {farmTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`p-4 rounded-lg transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                        activeTab === tab.id
                          ? "bg-blue-900/70 text-yellow-400 border border-yellow-400/30"
                          : "bg-blue-900/30 text-white hover:bg-blue-800/60"
                      }`}
                    >
                      <Icon
                        className={`text-2xl ${
                          activeTab === tab.id
                            ? "text-yellow-400"
                            : "text-blue-200"
                        }`}
                      />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-on-scroll stagger-3">
          {/* Pool List */}
          {activeTab === "pools" && (
            <div ref={poolListRef}>
              <PoolListWrapper
                calculateAPR={calculatePoolAPR}
                onPoolCountChange={handlePoolCountChange}
              />
            </div>
          )}

          {/* Stake */}
          {activeTab === "stake" && (
            <div>
              {connected ? (
                <StakingComponent />
              ) : (
                <div className="card-bg-premium p-8 rounded-xl text-center">
                  <FaExclamationTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    Wallet Connection Required
                  </h3>
                  <p className="text-blue-200 mb-4">
                    Please connect your wallet to access staking features.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* My Positions */}
          {activeTab === "positions" && (
            <div>
              {connected ? (
                <UserStakesComponent />
              ) : (
                <div className="card-bg-premium p-8 rounded-xl text-center">
                  <FaExclamationTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    Wallet Connection Required
                  </h3>
                  <p className="text-blue-200 mb-4">
                    Please connect your wallet to view your positions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Farm FAQ Section */}
        <div className="animate-on-scroll stagger-4">
          <FarmFAQ />
        </div>

        {/* Learn More Link */}
        <div className="mt-8 text-center animate-on-scroll stagger-5">
          <a
            href="https://shitcoin-club.gitbook.io/suitrump-farm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <span>Learn more about SuiTrump Farming</span>
            <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Farm;
