import { useState, useEffect } from "react";
import {
  Upload,
  Link,
  FileText,
  Globe,
  Cloud,
  Loader2,
  CheckCircle,
  XCircle,
  Wand2,
  Crop,
  Ruler,
  Palette,
  X,
  Sparkles,
  Download,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Search,
  Bell,
  User,
  Filter,
  SortAsc,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Maximize2,
  Image as ImageIcon,
  Box,
  Minimize2,
  BarChart,
  ShoppingBag,
} from "lucide-react";
import { assetApi } from "../lib/api";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { MeasurementModal } from "./MeasurementModal";
import { ImageCropModal } from "./ImageCropModal";

const ECOMMERCE_DESTINATIONS = [
  {
    id: "unified-commerce",
    label: "Unified E-Commerce",
    initial: "U",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-100",
  },
  {
    id: "shopify",
    label: "Shopify",
    initial: "S",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  {
    id: "woocommerce",
    label: "WooCommerce",
    initial: "W",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
  },
  {
    id: "magento",
    label: "Magento",
    initial: "M",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  {
    id: "bigcommerce",
    label: "BigCommerce",
    initial: "B",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  {
    id: "wix-store",
    label: "Wix Store",
    initial: "W",
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100",
  },
];
const SOURCES = [
  { id: "files", label: "Files", icon: Upload },
  { id: "urls", label: "URLs", icon: Link },
  { id: "csv", label: "CSV", icon: FileText },
  { id: "page", label: "Page", icon: Globe },
  { id: "cloud", label: "Cloud", icon: Cloud },
];
const MARKETPLACE_DESTINATIONS = [
  {
    id: "amazon-us",
    label: "Amazon US",
    initial: "Am",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
  },
  {
    id: "walmart",
    label: "Walmart",
    initial: "Wa",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  {
    id: "ebay-us",
    label: "eBay US",
    initial: "eB",
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
  },
  {
    id: "wayfair-us",
    label: "Wayfair",
    initial: "Wa",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
];

const MARKETPLACE_GROUPS = [
  {
    id: "us",
    countryCode: "US",
    countryName: "United States",
    items: MARKETPLACE_DESTINATIONS,
  },
];

const PROCESSING_OPTIONS = [
  {
    id: "resize",
    label: "Image Resizing",
    description: "Resize to specific dimensions",
    icon: Ruler,
  },
  {
    id: "bg-remove",
    label: "Background Removal",
    description: "Remove background automatically",
    icon: Palette,
  },
  {
    id: "retouch",
    label: "Image Retouch / Enhancer",
    description: "Enhance color, sharpness, and quality",
    icon: Sparkles,
  },
  {
    id: "crop",
    label: "Image Cropping / Reframing",
    description: "Smart crop and aspect ratio adjust",
    icon: Crop,
  },
  {
    id: "compress",
    label: "Image Compression",
    description: "Optimize file size without quality loss",
    icon: Minimize2,
  },
  {
    id: "lifestyle",
    label: "Lifestyle Image Creation",
    description: "Generate lifestyle scene images",
    icon: ImageIcon,
  },
  {
    id: "infographic",
    label: "Infographic Creation",
    description: "Auto-generate product infographics",
    icon: BarChart,
  },
  {
    id: "line-diagram",
    label: "Line Diagram",
    description: "Technical line drawing generation",
    icon: Ruler,
  },
  {
    id: "swatch",
    label: "Material Swatch Creation",
    description: "Generate color and material swatches",
    icon: Palette,
  },
  {
    id: "3d-model",
    label: "3D Render",
    description: "Create photorealistic 3D product renders",
    icon: Box,
  },
];

type Step = "upload" | "destinations" | "processing" | "results";
type UploadSource = "files" | "urls" | "csv" | "page" | "cloud";

export function AdvancedUpload() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [projectName, setProjectName] = useState("");
  const [showMeasurementTool, setShowMeasurementTool] = useState(false);
  const [measurementImage, setMeasurementImage] = useState<any>(null);
  const [lineDiagramResults, setLineDiagramResults] = useState<any[]>([]);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [recoloringImage, setRecoloringImage] = useState<any>(null);
  const [pickedColor, setPickedColor] = useState("#000000");
  const [replaceColor, setReplaceColor] = useState("#ff0000");
  const [isApplyingRecolor, setIsApplyingRecolor] = useState(false);
  const [uploadSource, setUploadSource] = useState<UploadSource>("files");
  const [images, setImages] = useState<any[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([
    "shopify",
    "amazon-us",
    "walmart",
    "bigcommerce",
  ]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [autoDetect, setAutoDetect] = useState(false);
  const [selectedProcessing, setSelectedProcessing] = useState<string[]>([
    "retouch",
    "crop",
  ]);
  const [activeResizeMode, setActiveResizeMode] = useState<
    "original" | "preset" | "custom" | "percentage"
  >("preset");
  const [selectedPreset, setSelectedPreset] = useState("800x800");
  const [resizeDims, setResizeDims] = useState({ width: 800, height: 800 });
  const [resizePercentage, setResizePercentage] = useState(100);
  const [compressionQuality, setCompressionQuality] = useState(80);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });
  const [processedResults, setProcessedResults] = useState<any[]>([]);

  useEffect(() => {
    if (activeResizeMode === "preset") {
      const [w, h] = selectedPreset.split("x").map(Number);
      setResizeDims({ width: w, height: h });
    }
  }, [activeResizeMode, selectedPreset]);

  const handleProcessBatch = async () => {
    setUploading(true);
    setProgress({ current: 0, total: images.length, phase: "Uploading" });

    try {
      const project = projectName.trim();
      const formData = new FormData();
      if (project) formData.append("project_name", project);
      images.forEach(
        (img) => img.file && formData.append("files", img.file, img.name),
      );
      const batchResult = await assetApi.upload(formData);

      setProgress({
        current: 0,
        total: batchResult.images.length,
        phase: "Processing",
      });

      const results = await Promise.all(
        batchResult.images.map(async (asset: any, idx: number) => {
          let operationsToSend = [...selectedProcessing];
          const processOptions: any = {};

          if (selectedProcessing.includes("resize")) {
            switch (activeResizeMode) {
              case "original":
                operationsToSend = operationsToSend.filter(
                  (op) => op !== "resize",
                );
                break;
              case "preset":
              case "custom":
                processOptions.resize = {
                  width: resizeDims.width,
                  height: resizeDims.height,
                };
                break;
              case "percentage":
                const targetWidth = Math.round(
                  (asset.width || 1000) * (resizePercentage / 100),
                );
                const targetHeight = Math.round(
                  (asset.height || 1000) * (resizePercentage / 100),
                );
                processOptions.resize = {
                  width: targetWidth,
                  height: targetHeight,
                };
                break;
            }
          }

          if (selectedProcessing.includes("compress")) {
            processOptions.quality = compressionQuality;
          }

          const ops = autoDetect ? [] : operationsToSend;
          const res = await assetApi.process(
            asset.id,
            ops,
            processOptions,
            autoDetect,
          );

          setProgress((prev) => ({ ...prev, current: idx + 1 }));
          return {
            ...res,
            originalName: asset.name,
            metadata: asset,
            appliedOps: res.telemetry?.steps || ops,
            projectName: project,
          };
        }),
      );

      setProcessedResults(results);
      setCurrentStep("results");
      toast.success("Processing complete!");
    } catch (e: any) {
      toast.error("Failed to process batch");
    } finally {
      setUploading(false);
    }
  };
  const handleCropSave = (newFile: File) => {
    if (!editingImage) return;
    const newUrl = URL.createObjectURL(newFile);
    setImages((prev) =>
      prev.map((img) => {
        if (img.id === editingImage.id) {
          return {
            ...img,
            url: newUrl,
            preview: newUrl,
            file: newFile,
            name: newFile.name,
          };
        }
        return img;
      }),
    );
    setEditingImage(null);
  };

  const handleLineDiagramClick = (image: any) => {
    setMeasurementImage(image);
    setShowMeasurementTool(true);
  };

  const handleMeasurementSave = (
    measurements: any[],
    annotatedImageUrl: string,
  ) => {
    if (measurementImage) {
      setLineDiagramResults((prev) => {
        const existingIndex = prev.findIndex(
          (r) => r.imageId === measurementImage.id,
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            imageId: measurementImage.id,
            imageName: measurementImage.name,
            measurements,
            annotatedImageUrl,
          };
          return updated;
        }
        return [
          ...prev,
          {
            imageId: measurementImage.id,
            imageName: measurementImage.name,
            measurements,
            annotatedImageUrl,
          },
        ];
      });
    }
    setShowMeasurementTool(false);
    setMeasurementImage(null);
  };

  const handleImageColorPick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor(
      (e.clientY - rect.top) * (canvas.height / rect.height),
    );
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex =
      "#" +
      pixel[0].toString(16).padStart(2, "0") +
      pixel[1].toString(16).padStart(2, "0") +
      pixel[2].toString(16).padStart(2, "0");
    setPickedColor(hex.toUpperCase());
    toast.success(`Picked color: ${hex.toUpperCase()}`);
  };

  const getRecoloredPreviewUrl = (): string => {
    if (!recoloringImage) return "";
    if (recoloringImage.cloudinaryUrl) {
      const fromColor = pickedColor.replace("#", "").toLowerCase();
      const toColor = replaceColor.replace("#", "").toLowerCase();
      return `${recoloringImage.cloudinaryUrl}?e_replace_color:${fromColor}:${toColor}:30`;
    }
    return recoloringImage.preview || recoloringImage.url || "";
  };

  const applyRecoloring = async () => {
    setIsApplyingRecolor(true);
    try {
      const response = await assetApi.process(
        recoloringImage.id,
        ["recolor"],
        { fromColor: pickedColor, toColor: replaceColor, tolerance: 20 },
        false,
      );
      if (response?.url) {
        toast.success("Image recolored successfully!");
        setRecoloringImage(null);
      }
    } catch (error: any) {
      toast.error("Failed to recolor: " + error.message);
    } finally {
      setIsApplyingRecolor(false);
    }
  };
  const Stepper = () => {
    const steps = [
      { id: "upload", label: "Import Files" },
      { id: "destinations", label: "Destinations" },
      { id: "processing", label: "Processing" },
      { id: "results", label: "Results" },
    ];
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
const isValidImageFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"];
    return validTypes.includes(file.type);
};
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between mb-8 shadow-sm">
        {steps.map((s, idx) => {
          const isCompleted =
            steps.findIndex((x) => x.id === s.id) < currentIndex;
          const isActive = s.id === currentStep;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-blue-500 text-white ring-4 ring-blue-50"
                        : "bg-slate-100 text-slate-400",
                  )}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-sm font-bold tracking-tight",
                    isActive ? "text-slate-900" : "text-slate-400",
                  )}
                >
                  {idx + 1}. {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-8",
                    isCompleted ? "bg-emerald-200" : "bg-slate-100",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 ">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Import
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Import product images,select destinations and apply AI-powered
            processing at scale
          </p>
        </div>
        <div className="flex items-center space-x-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              placeholder="Search..."
              className="bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-sm transition-all w-80 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5"
            />
          </div>
          <div className="flex items-center space-x-5">
            <button className="text-slate-300 hover:text-slate-500 transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg shadow-blue-100">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-black text-[10px]">
                W
              </div>
              <span className="text-xs font-black tracking-widest uppercase leading-none">
                Work
              </span>
            </div>
          </div>
        </div>
      </div>

      <Stepper />

      {currentStep === "upload" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* NEW: Import Source Selector Container */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">
              Import Source
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {SOURCES.map((source) => {
                const isActive = uploadSource === source.id;
                const Icon = source.icon;

                return (
                  <button
                    key={source.id}
                    onClick={() => setUploadSource(source.id as UploadSource)}
                    className={cn(
                      "flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all gap-3",
                      isActive
                        ? "border-[#007BC7] bg-blue-50/50 text-[#007BC7] shadow-sm"
                        : "border-slate-50 hover:border-slate-200 text-slate-400 bg-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-6 h-6",
                        isActive ? "text-[#007BC7]" : "text-slate-300",
                      )}
                    />
                    <span className="text-sm font-bold tracking-tight">
                      {source.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area based on selected source */}
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 border-dashed p-24 text-center flex flex-col items-center group hover:border-blue-400 transition-colors relative">
            {uploadSource === "files" ? (
              <>
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Drag and drop images here
                </h3>
                <p className="text-slate-400 text-sm font-medium mb-8">
                  Supports JPG, PNG, WebP, AVIF — up to 50 MB each
                </p>
                <div className="flex items-center w-64 mb-8">
                  <div className="flex-grow h-px bg-slate-100"></div>
                  <span className="mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    or
                  </span>
                  <div className="flex-grow h-px bg-slate-100"></div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-px w-24 bg-slate-100 mb-2" />
                  <label className="bg-[#007BC7] hover:bg-[#0069ab] text-white px-10 py-4 rounded-xl font-bold flex items-center space-x-2 cursor-pointer shadow-xl shadow-blue-100 transition-all">
                    <Plus className="w-5 h-5" />
                    <span>Browse Files</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type));
    const validFiles = files.filter(f => validTypes.includes(f.type));
    
    if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map(f => f.name).join(", ");
        toast.error(`Invalid file types: ${invalidNames}. Only images (JPG, PNG, WebP, AVIF) and PDFs are allowed.`);
    }
    
    if (validFiles.length === 0) {
        toast.error("Please select valid image files");
        return;
    }
    
    setImages(
        validFiles.map((f) => ({
            file: f,
            name: f.name,
            id: Math.random(),
        })),
    );
    setCurrentStep("destinations");
    if (invalidFiles.length > 0) {
        toast.warning(`${invalidFiles.length} file(s) skipped due to invalid type`);
    }
}}
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                  {/* Dynamically show the icon for the active source */}
                  {(() => {
                    const activeSource = SOURCES.find(
                      (s) => s.id === uploadSource,
                    );
                    const Icon = activeSource?.icon || Upload;
                    return <Icon className="w-8 h-8 text-slate-300" />;
                  })()}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                  Import via {uploadSource}
                </h3>
                <p className="text-slate-400 text-sm font-medium mb-8">
                  Connect your {uploadSource} source to fetch product images
                  automatically.
                </p>
                <button className="border-2 border-slate-200 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all">
                  Configure Source
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === "destinations" && (
        <div className="flex gap-6 animate-in slide-in-from-right-4 duration-500 items-start">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              {/* 1. Imported Files - Now on Top */}
              <div className="mb-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
                  Imported Files ({images.length})
                </h3>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {images.map((image: any) => {
                    const previewUrl =
                      image.preview ||
                      image.url ||
                      (image.file ? URL.createObjectURL(image.file) : "");
                    return (
                      <div
                        key={image.id}
                        className="w-16 h-16 flex-shrink-0 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden shadow-sm"
                        title={image.name}
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {images.length === 0 && (
                    <div className="text-sm text-slate-400 py-2">
                      No imported files yet
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full mb-8" />

              {/* 2. Project Name - Now Below */}
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-900">
                    Project Name
                  </h3>
                  <p className="text-sm text-slate-400">
                    Group these images under a project for easy filtering in
                    Results & Reports.
                  </p>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                    📁
                  </span>
                 <input
    value={projectName}
    onChange={(e) => setProjectName(e.target.value)}
    placeholder="e.g. Summer Collection 2025"
    className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-6 py-4 text-sm transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white ${!projectName.trim() ? 'border-amber-300' : 'border-slate-200'}`}
/>
{!projectName.trim() && (
    <p className="text-amber-600 text-xs font-bold mt-2 flex items-center gap-1">
        <span>⚠️</span> Project name is required to continue
    </p>
)}
                </div>
              </div>
            </div>

            {/* E-Commerce Platforms */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    E-Commerce Platforms
                  </h3>
                  <p className="text-sm text-slate-400">
                    Websites and storefronts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const platformIds = ECOMMERCE_DESTINATIONS.map((d) => d.id);
                    const allSelected = platformIds.every((id) =>
                      selectedDestinations.includes(id),
                    );
                    setSelectedDestinations((prev) =>
                      allSelected
                        ? prev.filter((id) => !platformIds.includes(id))
                        : Array.from(new Set([...prev, ...platformIds])),
                    );
                  }}
                  className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline"
                >
                  Select all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ECOMMERCE_DESTINATIONS.map((dest) => {
                  const active = selectedDestinations.includes(dest.id);
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() =>
                        setSelectedDestinations((prev) =>
                          prev.includes(dest.id)
                            ? prev.filter((id) => id !== dest.id)
                            : [...prev, dest.id],
                        )
                      }
                      className={cn(
                        "p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all",
                        active
                          ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500"
                          : "border-slate-100 hover:border-slate-200 bg-white",
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shadow-sm",
                            dest.bg,
                            dest.text,
                            dest.border,
                          )}
                        >
                          {dest.initial}
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          {dest.label}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          active
                            ? "bg-blue-500 border-blue-500"
                            : "border-slate-200",
                        )}
                      >
                        {active && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marketplaces */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Marketplaces
                  </h3>
                  <p className="text-sm text-slate-400">
                    Global selling platforms
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const marketplaceIds = MARKETPLACE_DESTINATIONS.map(
                      (d) => d.id,
                    );
                    const allSelected = marketplaceIds.every((id) =>
                      selectedDestinations.includes(id),
                    );
                    setSelectedDestinations((prev) =>
                      allSelected
                        ? prev.filter((id) => !marketplaceIds.includes(id))
                        : Array.from(new Set([...prev, ...marketplaceIds])),
                    );
                  }}
                  className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline"
                >
                  Select all
                </button>
              </div>
              <div className="space-y-5">
                {MARKETPLACE_GROUPS.map((group) => {
                  const groupIds = group.items.map((item) => item.id);
                  return (
                    <div key={group.id}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-black text-slate-700 uppercase tracking-wide">
                          {group.countryCode} {group.countryName}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const allSelected = groupIds.every((id) =>
                              selectedDestinations.includes(id),
                            );
                            setSelectedDestinations((prev) =>
                              allSelected
                                ? prev.filter((id) => !groupIds.includes(id))
                                : Array.from(new Set([...prev, ...groupIds])),
                            );
                          }}
                          className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline"
                        >
                          Select all
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {group.items.map((dest) => {
                          const active = selectedDestinations.includes(dest.id);
                          return (
                            <button
                              key={dest.id}
                              type="button"
                              onClick={() =>
                                setSelectedDestinations((prev) =>
                                  prev.includes(dest.id)
                                    ? prev.filter((id) => id !== dest.id)
                                    : [...prev, dest.id],
                                )
                              }
                              className={cn(
                                "p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all",
                                active
                                  ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 shadow-sm"
                                  : "border-slate-100 hover:border-slate-200 bg-white",
                              )}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shadow-sm",
                                    dest.bg,
                                    dest.text,
                                    dest.border,
                                  )}
                                >
                                  {dest.initial}
                                </div>
                                <div className="text-sm font-bold text-slate-800">
                                  {dest.label}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                  active
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-slate-200",
                                )}
                              >
                                {active && (
                                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setCurrentStep("upload")}
                className="flex items-center space-x-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Import</span>
              </button>
            </div>
          </div>

          <div className="w-[340px] shrink-0">
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm sticky top-10">
              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900">
                  Selection Summary
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedDestinations.length} destinations selected
                </p>
              </div>
              <div className="space-y-3 mb-10 min-h-[150px]">
                {selectedDestinations.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">
                    No destinations selected
                  </div>
                ) : (
                  selectedDestinations.map((id) => {
                    const dest = [
                      ...ECOMMERCE_DESTINATIONS,
                      ...MARKETPLACE_DESTINATIONS,
                    ].find((item) => item.id === id);
                    if (!dest) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-3 py-2 px-1"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg border flex items-center justify-center font-black text-[10px]",
                              dest.bg,
                              dest.text,
                              dest.border,
                            )}
                          >
                            {dest.initial}
                          </div>
                          <span className="text-sm text-slate-700 font-medium truncate">
                            {dest.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDestinations((prev) =>
                              prev.filter((item) => item !== id),
                            )
                          }
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
             <button
    type="button"
    onClick={() => {
        if (!projectName.trim()) {
            toast.error("Please enter a project name before proceeding");
            return;
        }
        setCurrentStep("processing");
    }}
disabled={selectedDestinations.length === 0 || !projectName.trim()}
    className="w-full bg-[#007BC7] hover:bg-[#0069ab] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 transition-all flex items-center justify-center space-x-2"
>
    <span>Next: Processing Options</span>
    <ArrowRight className="w-5 h-5" />
</button>
            </div>
          </div>
        </div>
      )}

      {currentStep === "processing" && (
        <div className="flex gap-10 animate-in slide-in-from-right-4 duration-500 items-start">
          <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">
                  Select Processing Operations
                </h3>
                <p className="text-slate-400 text-sm font-medium">
                  Choose which operations to apply. Outputs generated per
                  destination.
                </p>
              </div>

              <div className="flex items-center space-x-6">
                <button
                  type="button"
                  onClick={() => setAutoDetect(!autoDetect)}
                  className="flex items-center space-x-3 cursor-pointer group focus:outline-none"
                >
                  <div
                    className={cn(
                      "text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1.5",
                      autoDetect
                        ? "text-blue-600"
                        : "text-slate-500 group-hover:text-blue-600",
                    )}
                  >
                    <Wand2 className="w-4 h-4" /> Auto
                  </div>

                  <div
                    className={cn(
                      "w-10 h-6 rounded-full transition-colors relative shadow-inner",
                      autoDetect ? "bg-blue-600" : "bg-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-sm",
                        autoDetect ? "translate-x-5" : "translate-x-1",
                      )}
                    />
                  </div>
                </button>

                {!autoDetect && (
                  <button
                    onClick={() =>
                      setSelectedProcessing(PROCESSING_OPTIONS.map((o) => o.id))
                    }
                    className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
                  >
                    Select all
                  </button>
                )}
              </div>
            </div>

            {autoDetect ? (
              <div className="p-8 bg-blue-50 border-2 border-blue-100 rounded-[2rem] text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                  <Wand2 className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-2">
                  AI Auto-Detection Enabled
                </h4>
                <p className="text-slate-600 max-w-md">
                  Our AI will automatically analyze each image and apply the
                  optimal set of enhancements, background removals, and crops
                  required for your selected destinations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 items-start">
                {PROCESSING_OPTIONS.map((op) => {
                  const active = selectedProcessing.includes(op.id);
                  return (
                    <div
                      key={op.id}
                      className={cn(
                        "border-2 rounded-[1.75rem] transition-all overflow-hidden h-fit",
                        active
                          ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500 shadow-md shadow-blue-50"
                          : "border-slate-100 hover:border-slate-200 bg-white",
                      )}
                    >
                      <button
                        onClick={() =>
                          setSelectedProcessing((prev) =>
                            active
                              ? prev.filter((x) => x !== op.id)
                              : [...prev, op.id],
                          )
                        }
                        className="w-full p-6 flex items-center space-x-5 text-left"
                      >
                        <div
                          className={cn(
                            "p-3 rounded-2xl shadow-sm shrink-0",
                            active
                              ? "bg-blue-500 text-white"
                              : "bg-blue-50 text-blue-500",
                          )}
                        >
                          <op.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-black text-slate-800 leading-tight truncate">
                            {op.label}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                            {op.description}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                            active
                              ? "bg-blue-500 border-blue-500"
                              : "border-slate-200",
                          )}
                        >
                          {active && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </button>

                      {active && op.id === "resize" && (
                        <div className="px-6 pb-6 pt-2 border-t border-blue-100/50 bg-white/50">
                          <div className="flex space-x-2 mb-4 bg-slate-100/50 p-1 rounded-xl">
                            {(
                              [
                                "original",
                                "preset",
                                "custom",
                                "percentage",
                              ] as const
                            ).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setActiveResizeMode(mode)}
                                className={cn(
                                  "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                                  activeResizeMode === mode
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600",
                                )}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>

                          {activeResizeMode === "preset" && (
                            <div className="grid grid-cols-3 gap-2">
                              {["500x500", "800x800", "1024x1024"].map(
                                (preset) => (
                                  <button
                                    key={preset}
                                    onClick={() => setSelectedPreset(preset)}
                                    className={cn(
                                      "py-2 text-xs font-bold rounded-lg border",
                                      selectedPreset === preset
                                        ? "bg-blue-100 border-blue-300 text-blue-700"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                                    )}
                                  >
                                    {preset}
                                  </button>
                                ),
                              )}
                            </div>
                          )}

                          {activeResizeMode === "custom" && (
                            <div className="flex gap-4">
                              <label className="flex-1 text-[10px] font-bold text-slate-500 uppercase">
                                Width{" "}
                                <input
                                  type="number"
                                  value={resizeDims.width}
                                  onChange={(e) =>
                                    setResizeDims((p) => ({
                                      ...p,
                                      width: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full mt-1 px-3 py-2 border rounded-xl"
                                />
                              </label>
                              <label className="flex-1 text-[10px] font-bold text-slate-500 uppercase">
                                Height{" "}
                                <input
                                  type="number"
                                  value={resizeDims.height}
                                  onChange={(e) =>
                                    setResizeDims((p) => ({
                                      ...p,
                                      height: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full mt-1 px-3 py-2 border rounded-xl"
                                />
                              </label>
                            </div>
                          )}

                          {activeResizeMode === "percentage" && (
                            <div>
                              <div className="flex justify-between mb-2 text-xs font-bold text-slate-600">
                                <span>Scale Factor</span>
                                <span className="text-blue-600">
                                  {resizePercentage}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="200"
                                step="10"
                                value={resizePercentage}
                                onChange={(e) =>
                                  setResizePercentage(Number(e.target.value))
                                }
                                className="w-full accent-blue-600"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {active && op.id === "compress" && (
                        <div className="px-6 pb-6 pt-2 border-t border-blue-100/50 bg-white/50">
                          <div className="flex justify-between mb-2 text-xs font-bold text-slate-600">
                            <span>Quality Ratio</span>
                            <span className="text-blue-600">
                              {compressionQuality}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={compressionQuality}
                            onChange={(e) =>
                              setCompressionQuality(Number(e.target.value))
                            }
                            className="w-full accent-blue-600"
                          />
                        </div>
                      )}
                      {active && op.id === "crop" && (
    <div className="px-6 pb-6 pt-2 border-t border-blue-100/50 bg-white/50">
        <p className="text-xs text-slate-500 mb-2">Select an image to crop</p>
        <button
            onClick={() => {
                const img = images[0];
                if (img) setEditingImage(img);
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold"
        >
            Open Crop Tool
        </button>
        {editingImage && (
            <ImageCropModal
                imageSrc={editingImage.url}
                fileName={editingImage.name}
                onClose={() => setEditingImage(null)}
                onSave={handleCropSave}
            />
        )}
    </div>
)}

                      {active && op.id === "line-diagram" && (
                        <div className="px-6 pb-6 pt-2 border-t border-blue-100/50 bg-white/50">
                          <p className="text-xs text-slate-500 mb-2">
                            Click on an image to add measurements
                          </p>
                          <button
                            onClick={() => {
                              const img = images[0];
                              if (img) handleLineDiagramClick(img);
                            }}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold"
                          >
                            Open Measurement Tool
                          </button>
                        </div>
                      )}

                      {active && op.id === "recolor" && (
                        <div className="px-6 pb-6 pt-2 border-t border-blue-100/50 bg-white/50">
                          <button
                            onClick={() => {
                              const img = images[0];
                              if (img) setRecoloringImage(img);
                            }}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold"
                          >
                            Open Color Picker
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-[340px] shrink-0 h-fit bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm sticky top-10">
            <h3 className="font-black text-slate-900 text-lg mb-1">
              Processing Plan
            </h3>
            <p className="text-[10px] text-slate-400 font-black  tracking-widest mb-10">
              {autoDetect ? "Auto" : selectedProcessing.length} operations ×{" "}
              {selectedDestinations.length} destinations
            </p>
            <div className="mb-10 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total outputs per image
              </span>
              <div className="text-5xl font-black text-[#007BC7] my-3 leading-none">
                {autoDetect
                  ? "~4"
                  : selectedProcessing.length * selectedDestinations.length}
              </div>
              <p className="text-[11px] text-slate-400 font-bold leading-tight">
                {images.length} files ×{" "}
                {autoDetect ? "AI Ops" : selectedProcessing.length + " ops"} ×{" "}
                {selectedDestinations.length} dests
              </p>
            </div>

            <button
              onClick={handleProcessBatch}
              disabled={
                uploading ||
                (!autoDetect && selectedProcessing.length === 0) ||
                images.length === 0
              }
              className="w-full bg-[#007BC7] hover:bg-[#0069ab] text-white py-5 rounded-2xl font-black flex items-center justify-center space-x-3 shadow-2xl shadow-blue-100 disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              <span>{uploading ? "Processing..." : "Start Processing"}</span>
            </button>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setCurrentStep("destinations")}
                className="group flex items-center space-x-2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Back to Destinations
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === "results" && (
        <div className="space-y-5 animate-in fade-in duration-500 pb-20">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4 px-2">
              <button
                onClick={() => {
                  setCurrentStep("upload");
                  setImages([]);
                  setProjectName("");

                  setProcessedResults([]);
                }}
                className="bg-[#007BC7] hover:bg-[#0069ab] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 transition-all shadow-lg shadow-blue-100"
              >
                <Plus className="w-4 h-4" /> <span>Import More</span>
              </button>

              <div className="h-8 w-px bg-slate-100" />

              <button className="flex items-center space-x-2 text-slate-500 text-xs font-black uppercase tracking-widest px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                <SortAsc className="w-4 h-4" />
                <span>Newest first</span>
              </button>

              <button className="flex items-center space-x-2 text-slate-500 text-xs font-black uppercase tracking-widest px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                <span>All destinations</span>
              </button>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex bg-slate-100 p-1.5 rounded-xl">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-500",
                  )}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-500",
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pr-4">
                {processedResults.length} images
              </span>
            </div>
          </div>

          {viewMode === "list" && (
            <div className="space-y-3">
              {processedResults.map((res, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-[2rem] border border-slate-200 p-5 flex items-center justify-between hover:border-blue-400 shadow-sm transition-all group"
                >
                  <div className="flex items-center space-x-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center p-2 group-hover:bg-white transition-colors">
                      <img
                        src={res.url}
                        className="w-full h-full object-contain drop-shadow-sm"
                        alt="Result"
                      />
                    </div>

                    <div>
                      <h4 className="font-black text-slate-800 text-base mb-1 tracking-tight">
                        {res.originalName}
                      </h4>
                      <div className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                        <span>
                          {res.metadata?.width || "1080"}×
                          {res.metadata?.height || "1080"}
                        </span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>233.2 KB</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>
                          {new Date().toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>01:29 PM</span>
                      </div>

                      <div className="flex items-center mt-3 space-x-2">
                        {selectedDestinations.map((dId) => {
                          const d = [
                            ...ECOMMERCE_DESTINATIONS,
                            ...MARKETPLACE_DESTINATIONS,
                          ].find((i) => i.id === dId);
                          return (
                            <span
                              key={dId}
                              className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black border border-slate-100 uppercase tracking-widest shadow-sm"
                            >
                              {d?.label || dId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-10 pr-4">
                    <div>
                      <div className="flex items-center space-x-1.5 text-emerald-500 mb-1 justify-end">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Done
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {selectedDestinations.length}/
                        {selectedDestinations.length} outputs ready
                      </div>
                    </div>
                    <button className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-slate-300 group-hover:text-blue-500">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {processedResults.map((res, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:border-blue-400 shadow-sm transition-all group p-4"
                >
                  {/* IMAGE CONTAINER WITH HOVER OVERLAY */}
                  <div className="aspect-square bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden mb-4 flex items-center justify-center p-4 relative">
                    <img
                      src={res.url}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                      alt="Result"
                    />

                    {/* DOWNLOAD BUTTON OVERLAY */}
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <button
                        onClick={() => window.open(res.url, "_blank")}
                        className="bg-white text-slate-700 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-xl flex items-center space-x-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-slate-50 hover:scale-105 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  <div className="px-1">
                    <h4 className="font-black text-slate-800 text-sm truncate mb-1">
                      {res.originalName}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-emerald-500">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          Done
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">
                        {selectedDestinations.length} Out
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showMeasurementTool && measurementImage && (
        <MeasurementModal
          imageUrl={measurementImage.preview || measurementImage.url}
          imageName={measurementImage.name}
          existingMeasurements={
            lineDiagramResults.find((r) => r.imageId === measurementImage.id)
              ?.measurements || []
          }
          onClose={() => {
            setShowMeasurementTool(false);
            setMeasurementImage(null);
          }}
          onSave={handleMeasurementSave}
        />
      )}

      {recoloringImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setRecoloringImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Palette className="w-6 h-6" />
                Recolor Product
              </h2>
              <button
                onClick={() => setRecoloringImage(null)}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
              <div>
                <h3 className="text-sm font-bold mb-3">
                  Original Image (click to pick color)
                </h3>
                <img
                  src={recoloringImage.preview || recoloringImage.url}
                  alt="Original"
                  className="w-full rounded-xl border cursor-crosshair"
                  onClick={handleImageColorPick}
                />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-3">Recolored Preview</h3>
                <img
                  src={getRecoloredPreviewUrl()}
                  alt="Preview"
                  className="w-full rounded-xl border"
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium mb-2">Color to Replace</p>
                    <input
                      type="color"
                      value={pickedColor}
                      onChange={(e) => setPickedColor(e.target.value)}
                      className="w-full h-10 cursor-pointer"
                    />
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium mb-2">Replacement</p>
                    <input
                      type="color"
                      value={replaceColor}
                      onChange={(e) => setReplaceColor(e.target.value)}
                      className="w-full h-10 cursor-pointer"
                    />
                  </div>
                </div>
                <button
                  onClick={applyRecoloring}
                  disabled={isApplyingRecolor}
                  className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isApplyingRecolor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isApplyingRecolor ? "Processing..." : "Apply Recoloring"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
