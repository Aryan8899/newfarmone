export const calculateApr = (rewardsPerDay: number, tvlValue: number): number => {
    if (!rewardsPerDay || !tvlValue) return 0;
    const dailyRate = rewardsPerDay / tvlValue;
    const apr = dailyRate * 365 * 100;
    return Number(apr.toFixed(4));
  };
  