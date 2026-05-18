
export interface MarketplaceRule {
  id: string;
  label: string;
  resizeDimensions: {
    width: number;
    height: number;
  };
  recommended: boolean;
}

export const MARKETPLACE_RULES: Record<string, MarketplaceRule> = {
  "amazon-us": {
    id: "amazon-us",
    label: "Amazon US",
    resizeDimensions: { width: 2000, height: 2000 },
    recommended: true,
  },
  "amazon-uk": {
    id: "amazon-uk",
    label: "Amazon UK",
    resizeDimensions: { width: 2000, height: 2000 },
    recommended: true,
  },
  "walmart": {
    id: "walmart",
    label: "Walmart",
    resizeDimensions: { width: 2200, height: 2200 },
    recommended: true,
  },
  "wayfair-us": {
    id: "wayfair-us",
    label: "Wayfair US",
    resizeDimensions: { width: 2500, height: 2500 },
    recommended: true,
  },
  "wayfair-uk": {
    id: "wayfair-uk",
    label: "Wayfair UK",
    resizeDimensions: { width: 2500, height: 2500 },
    recommended: true,
  },
  "ebay-us": {
    id: "ebay-us",
    label: "eBay US",
    resizeDimensions: { width: 1600, height: 1600 },
    recommended: true,
  },
  "ebay-uk": {
    id: "ebay-uk",
    label: "eBay UK",
    resizeDimensions: { width: 1600, height: 1600 },
    recommended: true,
  },
  "target-plus": {
    id: "target-plus",
    label: "Target Plus",
    resizeDimensions: { width: 2400, height: 2400 },
    recommended: true,
  },
  "tiktok-shop": {
    id: "tiktok-shop",
    label: "TikTok Shop",
    resizeDimensions: { width: 800, height: 800 },
    recommended: true,
  },
  "homedepot": {
    id: "homedepot",
    label: "Home Depot",
    resizeDimensions: { width: 1000, height: 1000 },
    recommended: true,
  },
};

export const getResizeForMarketplace = (marketplaceId: string): { width: number; height: number } | null => {
  const rule = MARKETPLACE_RULES[marketplaceId];
  return rule?.resizeDimensions || null;
};

export const getResizeDimensionsForDestinations = (destinationIds: string[]): Array<{ id: string; width: number; height: number }> => {
  return destinationIds
    .map(id => {
      const rule = MARKETPLACE_RULES[id];
      return rule ? { id: rule.id, ...rule.resizeDimensions } : null;
    })
    .filter(Boolean) as Array<{ id: string; width: number; height: number }>;
};