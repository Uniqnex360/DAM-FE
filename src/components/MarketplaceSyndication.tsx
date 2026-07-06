import { useState, useEffect } from "react";
import {
  ChevronRight,
  Search,
  Bell,
  User,
  Globe,
  ShoppingBag,
  Maximize2,
  Palette,
  Crop,
  CheckCircle,
  Image as ImageIcon,
  Type,
  Sparkles,
  Layers,
  RefreshCw,
  Clock,
  XCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { PLATFORM_RULES } from "../utils/PlatformRules";

// Country data
const COUNTRIES = [
  { code: "US", name: "United States", count: 7, flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", count: 5, flag: "🇬🇧" },
  { code: "SG", name: "Singapore", count: 2, flag: "🇸🇬" },
  { code: "AU", name: "Australia", count: 3, flag: "🇦🇺" },
  { code: "DE", name: "Germany", count: 2, flag: "🇩🇪" },
  { code: "IN", name: "India", count: 2, flag: "🇮🇳" },
  { code: "AE", name: "UAE", count: 2, flag: "🇦🇪" },
  { code: "MY", name: "Malaysia", count: 2, flag: "🇲🇾" },
];

// Marketplaces by country
const MARKETPLACES: Record<string, string[]> = {
  US: [
    "Amazon US",
    "Walmart",
    "Wayfair",
    "eBay",
    "Target Plus",
    "TikTok Shop",
    "Homedepot",
  ],
  GB: ["Amazon UK", "eBay UK", "OnBuy", "Etsy UK", "Wayfair UK"],
  SG: ["Amazon SG", "Lazada SG"],
  AU: ["Amazon AU", "eBay AU", "Catch"],
  DE: ["Amazon DE", "Otto"],
  IN: ["Amazon IN", "Flipkart"],
  AE: ["Amazon AE", "Noon"],
  MY: ["Lazada MY", "Shopee MY"],
};

// Image functions
const IMAGE_FUNCTIONS = [
  {
    id: "auto-resize",
    label: "Marketplace-Specific Auto Resizing",
    description:
      "Automatically resize images to exact pixel dimensions required by the platform",
    icon: Maximize2,
    color: "sky",
  },
  {
    id: "bg-color",
    label: "Background Color Compliance",
    description:
      "Detect and correct background colors to meet marketplace requirements",
    icon: Palette,
    color: "emerald",
  },
  {
    id: "aspect-ratio",
    label: "Aspect Ratio Enforcement",
    description:
      "Crop or pad images to the exact aspect ratio required per platform and image slot",
    icon: Crop,
    color: "amber",
  },
  {
    id: "white-bg",
    label: "White Background Validation",
    description:
      "AI-powered check and auto-correction to ensure a pure white (#FFFFFF) background",
    icon: CheckCircle,
    color: "teal",
  },
  {
    id: "infographic",
    label: "Infographic Generator",
    description:
      "Auto-generate branded infographic images with product features and spec callouts",
    icon: ImageIcon,
    color: "orange",
  },
  {
    id: "watermark",
    label: "Watermark / Logo Detection",
    description:
      "Detect and cleanly remove supplier watermarks, logos, or unwanted overlays using AI inpainting",
    icon: Sparkles,
    color: "rose",
  },
  {
    id: "text-overlay",
    label: "Text Overlay Restrictions",
    description:
      "Detect forbidden text, pricing, or promotional text overlaid on images and flag or remove them",
    icon: Type,
    color: "violet",
  },
  {
    id: "variant",
    label: "Variant Generator",
    description:
      "Automatically generate color, size, and style variant images from a single product shot",
    icon: Layers,
    color: "cyan",
  },
];

type Step = "country" | "marketplace" | "functions";

interface Operation {
  id: string;
  country: string;
  marketplace: string;
  functions: string[];
  status: string;
  created_at: string;
}

export function MarketplaceSyndication() {
  const [currentStep, setCurrentStep] = useState<Step>("country");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>("");
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);

  const breadcrumbs = [
    {
      id: "country",
      label: "Select Country",
      active: currentStep === "country",
    },
    {
      id: "marketplace",
      label: "Select Marketplace",
      active: currentStep === "marketplace",
    },
    {
      id: "functions",
      label: "Image Functions",
      active: currentStep === "functions",
    },
  ];

  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code);
    setCurrentStep("marketplace");
  };

  const handleMarketplaceSelect = (marketplace: string) => {
    setSelectedMarketplace(marketplace);
    setCurrentStep("functions");
  };

  const toggleFunction = (funcId: string) => {
    setSelectedFunctions((prev) =>
      prev.includes(funcId)
        ? prev.filter((f) => f !== funcId)
        : [...prev, funcId],
    );
  };

  const handleStartOperation = async () => {
    if (selectedFunctions.length === 0) {
      alert("Select at least one function");
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      // Insert operation
      await supabase.from("marketplace_operations").insert({
        user_id: user.id,
        country: selectedCountry,
        marketplace: selectedMarketplace,
        functions: selectedFunctions,
        status: "pending",
      });

      // Reset
      setCurrentStep("country");
      setSelectedCountry("");
      setSelectedMarketplace("");
      setSelectedFunctions([]);
      fetchOperations();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data } = await supabase
        .from("marketplace_operations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setOperations(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  const getColorClasses = (color: string) =>
    ({
      sky: "bg-sky-100 text-sky-600",
      emerald: "bg-emerald-100 text-emerald-600",
      amber: "bg-amber-100 text-amber-600",
      teal: "bg-teal-100 text-teal-600",
      orange: "bg-orange-100 text-orange-600",
      rose: "bg-rose-100 text-rose-600",
      violet: "bg-violet-100 text-violet-600",
      cyan: "bg-cyan-100 text-cyan-600",
    })[color] || "bg-slate-100 text-slate-600";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button className="flex items-center space-x-2 px-6 py-2.5 border border-blue-200 bg-blue-50 rounded-xl transition-all">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-blue-700 text-sm">
              Browse Marketplaces
            </span>
          </button>

          <button className="flex items-center space-x-2 px-6 py-2.5 text-slate-600 hover:text-slate-700 transition-colors rounded-xl hover:bg-slate-50">
            <ShoppingBag className="w-4 h-4" />
            <span className="font-bold text-sm">Import for Marketplace</span>
          </button>
        </div>

        <div className="pr-4">
          <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg tracking-wide">
            Advanced marketplace processing
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Marketplace Syndication
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Prepare and optimize product images for global marketplaces
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <Search className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center space-x-2 bg-cyan-500 text-white px-3 py-2 rounded-lg">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-500" />
            </div>
            <span className="text-sm font-medium">Work</span>
          </div>
        </div>
      </div>

      <nav className="flex items-center space-x-2 text-sm font-medium mb-6">
        <button
          onClick={() => {
            setCurrentStep("country");
            setSelectedCountry("");
            setSelectedMarketplace("");
          }}
          className={`transition-colors ${
            currentStep === "country"
              ? "text-blue-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Select Country
        </button>

        {selectedCountry && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <button
              onClick={() => {
                setCurrentStep("marketplace");
                setSelectedMarketplace("");
              }}
              className={`transition-colors ${
                currentStep === "marketplace"
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {COUNTRIES.find((c) => c.code === selectedCountry)?.name ||
                selectedCountry}
            </button>
          </>
        )}

        {selectedMarketplace && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <button
              disabled={currentStep === "functions"}
              className={`transition-colors ${
                currentStep === "functions" ? "text-blue-600" : "text-slate-400"
              }`}
            >
              {selectedMarketplace}
            </button>
          </>
        )}
      </nav>

      <div className="bg-white rounded-xl border border-slate-200 p-8">
        {currentStep === "country" && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Select a Country
            </h2>
            <p className="text-slate-600 text-sm mb-6">
              Choose the target market for your product images
            </p>
            <div className="grid grid-cols-3 gap-4">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country.code)}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center font-bold text-lg text-slate-700">
                      {country.code}
                    </div>

                    <div className="text-left">
                      <div className="font-semibold text-slate-900">
                        {country.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {country.count} marketplaces
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "marketplace" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-slate-800 mb-1">
                {selectedCountry}
              </h2>
              <p className="text-slate-400 text-sm">
                Select the platform you're selling on
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {MARKETPLACES[selectedCountry]?.map((marketplace) => {
                const getBrandStyle = (name: string) => {
                  const n = name.toLowerCase();
                  if (n.includes("amazon"))
                    return {
                      bg: "bg-orange-50/50 border-orange-100",
                      icon: "bg-white border-orange-100 text-orange-600",
                      initial: "A",
                    };
                  if (n.includes("walmart"))
                    return {
                      bg: "bg-blue-50/50 border-blue-100",
                      icon: "bg-white border-blue-100 text-blue-700",
                      initial: "W",
                    };
                  if (n.includes("ebay"))
                    return {
                      bg: "bg-rose-50/50 border-rose-100",
                      icon: "bg-white border-rose-100 text-rose-600",
                      initial: "e",
                    };
                  if (n.includes("wayfair"))
                    return {
                      bg: "bg-purple-50/50 border-purple-100",
                      icon: "bg-white border-purple-100 text-purple-600",
                      initial: "Wf",
                    };
                  return {
                    bg: "bg-slate-50 border-slate-200",
                    icon: "bg-white border-slate-200 text-slate-600",
                    initial: name.charAt(0),
                  };
                };

                const style = getBrandStyle(marketplace);

                return (
                  <button
                    key={marketplace}
                    onClick={() => handleMarketplaceSelect(marketplace)}
                    className={`flex items-center justify-between p-4 border rounded-2xl transition-all hover:shadow-md group ${style.bg}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-xl shadow-sm ${style.icon}`}
                      >
                        {style.initial}
                      </div>

                      <div className="text-left">
                        <div className="font-bold text-slate-800 text-base">
                          {marketplace}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          8 image functions available
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentStep("country")}
              className="mt-8 flex items-center space-x-2 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to countries</span>
            </button>
          </div>
        )}

        {currentStep === "functions" && (
          <div className="flex gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex-1 space-y-4">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 rounded-xl border border-orange-100 bg-orange-50/50 flex items-center justify-center font-bold text-orange-600 shadow-sm">
                  {selectedMarketplace.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedMarketplace} — Image Functions
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {selectedCountry === "US"
                      ? "United States"
                      : selectedCountry}{" "}
                    · Select the operations to apply to your images
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {IMAGE_FUNCTIONS.map((func) => {
                  const Icon = func.icon;
                  const isSelected = selectedFunctions.includes(func.id);
                  const platformRule =
                    PLATFORM_RULES[selectedMarketplace]?.[func.id];
                  const isRecommended = platformRule?.recommended;

                  return (
                    <button
                      key={func.id}
                      onClick={() => toggleFunction(func.id)}
                      className={`w-full p-5 border rounded-2xl text-left transition-all flex items-center group ${
                        isSelected
                          ? "border-sky-400 bg-sky-50/50 ring-1 ring-sky-400"
                          : "border-slate-100 bg-white hover:border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start space-x-4 flex-1">
                        <div
                          className={`p-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-sky-500 border-sky-400 text-white"
                              : `bg-white border-slate-100 ${getColorClasses(func.color)} shadow-sm`
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-sm">
                              {func.label}
                            </span>
                            {isRecommended && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full border border-orange-200 flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" />{" "}
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                            {func.description}
                          </p>
                          {platformRule?.spec && (
                            <p className="text-[11px] mt-1.5 font-medium">
                              <span className="text-slate-400">
                                Platform spec:{" "}
                              </span>
                              <span className="text-sky-600">
                                {platformRule.spec.replace(
                                  "Platform spec: ",
                                  "",
                                )}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-sky-500 border-sky-500"
                            : "border-slate-200"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-72 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-6">
                <h3 className="font-bold text-slate-800 text-sm mb-4">
                  Selected Functions
                </h3>
                <p className="text-[11px] text-slate-400 mb-6">
                  {selectedFunctions.length} of {IMAGE_FUNCTIONS.length}{" "}
                  selected
                </p>

                <div className="space-y-4 mb-8">
                  {IMAGE_FUNCTIONS.filter((f) =>
                    selectedFunctions.includes(f.id),
                  ).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <f.icon
                          className={`w-4 h-4 ${getColorClasses(f.color)}`}
                        />
                        <span className="text-xs font-medium text-slate-600 truncate max-w-[140px]">
                          {f.label}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFunction(f.id);
                        }}
                        className="text-slate-300 hover:text-red-500"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStartOperation}
                  disabled={loading || selectedFunctions.length === 0}
                  className="w-full py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-sky-100"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Apply to Images</span>
                </button>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Platform
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                      {selectedCountry}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {selectedMarketplace}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        United States
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {operations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Recent Operations
          </h3>
          <div className="space-y-3">
            {operations.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-slate-900 text-sm">
                    {op.marketplace} • {op.country}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {op.functions.length} functions •{" "}
                    {new Date(op.created_at).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    op.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : op.status === "processing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {op.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
