
export interface MarketplaceRule {
  id: string;
  label: string;
  resizeDimensions: {
    width: number;
    height: number;
  };
   aspectRatio: {
    allowed: string[]; 
    default: string;   
  }
  recommended: boolean;
}

export const MARKETPLACE_RULES: Record<string, MarketplaceRule> = {
  "amazon-us": {
    id: "amazon-us",
    label: "Amazon US",
    resizeDimensions: { width: 2000, height: 2000 },
    aspectRatio: { allowed: ["1:1"], default: "1:1" },
    recommended: true,
  },
  "amazon-uk": {
    id: "amazon-uk",
    label: "Amazon UK",
    resizeDimensions: { width: 2000, height: 2000 },
    aspectRatio: { allowed: ["1:1"], default: "1:1" },
    recommended: true,
  },
  "walmart": {
    id: "walmart",
    label: "Walmart",
    resizeDimensions: { width: 2200, height: 2200 },
    aspectRatio: { allowed: ["1:1", "3:4"], default: "1:1" },
    recommended: true,
  },
  "wayfair-us": {
    id: "wayfair-us",
    label: "Wayfair US",
    resizeDimensions: { width: 2500, height: 2500 },
    aspectRatio: { allowed: ["1:1", "4:5"], default: "1:1" },
    recommended: true,
  },
  "wayfair-uk": {
    id: "wayfair-uk",
    label: "Wayfair UK",
    resizeDimensions: { width: 2500, height: 2500 },
    aspectRatio: { allowed: ["1:1", "4:5"], default: "1:1" },
    recommended: true,
  },
  "ebay-us": {
    id: "ebay-us",
    label: "eBay US",
    resizeDimensions: { width: 1600, height: 1600 },
    aspectRatio: { allowed: ["1:1"], default: "1:1" },
    recommended: true,
  },
  "ebay-uk": {
    id: "ebay-uk",
    label: "eBay UK",
    resizeDimensions: { width: 1600, height: 1600 },
    aspectRatio: { allowed: ["1:1"], default: "1:1" },
    recommended: true,
  },
  "target-plus": {
    id: "target-plus",
    label: "Target Plus",
    resizeDimensions: { width: 2400, height: 2400 },
    aspectRatio: { allowed: ["1:1"], default: "1:1" },
    recommended: true,
  },
  "tiktok-shop": {
    id: "tiktok-shop",
    label: "TikTok Shop",
    resizeDimensions: { width: 800, height: 800 },
    aspectRatio: { allowed: ["1:1"], default: "1:1" },
    recommended: true,
  },
  "homedepot": {
    id: "homedepot",
    label: "Home Depot",
    resizeDimensions: { width: 1000, height: 1000 },
    aspectRatio: { allowed: ["1:1"], default: "1:1" },
    recommended: true,
  },
};
export const getAspectRatioOptions = (marketplaceId: string): string[] => {
  const rule = MARKETPLACE_RULES[marketplaceId];
  return rule?.aspectRatio.allowed || ["1:1"];
};

export const getResizeForMarketplace = (marketplaceId: string): { width: number; height: number } | null => {
  const rule = MARKETPLACE_RULES[marketplaceId];
  return rule?.resizeDimensions || null;
};
export const calculateDimensionsFromAspectRatio = (
  currentWidth: number,
  currentHeight: number,
  targetRatio: string
): { width: number; height: number } => {
  const [ratioW, ratioH] = targetRatio.split(":").map(Number);
  const currentRatio = currentWidth / currentHeight;
  const targetRatioValue = ratioW / ratioH;

  if (currentRatio > targetRatioValue) {
    return {
      width: Math.round(currentHeight * targetRatioValue),
      height: currentHeight,
    };
  } else {
    return {
      width: currentWidth,
      height: Math.round(currentWidth / targetRatioValue),
    };
  }
};
export const getResizeDimensionsForDestinations = (destinationIds: string[]): Array<{ id: string; width: number; height: number }> => {
  return destinationIds
    .map(id => {
      const rule = MARKETPLACE_RULES[id];
      return rule ? { id: rule.id, ...rule.resizeDimensions } : null;
    })
    .filter(Boolean) as Array<{ id: string; width: number; height: number }>;
};