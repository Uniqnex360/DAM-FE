import { useState, useEffect } from "react";
import {
  Upload,
  Loader2,
  CheckCircle,
  Wand2,
  Palette,
  X,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Search,
  Bell,
  Filter,
  SortAsc,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Image as ImageIcon,
  Folder,
  Download,
  ChevronDown,
} from "lucide-react";
import { assetApi } from "../lib/api";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { MeasurementModal } from "./MeasurementModal";
import { ImageCropModal } from "./ImageCropModal";
import {
  getResizeDimensionsForDestinations,
  MARKETPLACE_RULES,
} from "../utils/marketplaceRules";
import { useUserSelection } from "../contexts/UserSelectionContext";
import {
  BG_COLOR_PRESETS,
  ECOMMERCE_DESTINATIONS,
  MARKETPLACE_DESTINATIONS,
  MARKETPLACE_GROUPS,
  PROCESSING_OPTIONS,
  SOURCES,
} from "../utils/Selections";
type Step = "upload" | "destinations" | "processing" | "results";
type UploadSource = "files" | "urls" | "csv" | "page" | "cloud";
export function AdvancedUpload() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [projectName, setProjectName] = useState("");
  const [useMarketplaceResize, setUseMarketplaceResize] = useState(true);
  const [showPerImageOverrides, setShowPerImageOverrides] = useState(false);
  const [cropMode, setCropMode] = useState<"preset" | "free">("preset");
  const [existingProjects, setExistingProjects] = useState<string[]>([]);
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customHexColor, setCustomHexColor] = useState("#FFFFFF");
  const [showMeasurementTool, setShowMeasurementTool] = useState(false);
  const [measurementImage, setMeasurementImage] = useState<any>(null);
  const [lineDiagramResults, setLineDiagramResults] = useState<any[]>([]);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [recoloringImage, setRecoloringImage] = useState<any>(null);
  const [pickedColor, setPickedColor] = useState("#000000");
  const [replaceColor, setReplaceColor] = useState("#ff0000");
  const { selectedUserId } = useUserSelection();
  const [isApplyingRecolor, setIsApplyingRecolor] = useState(false);
  const [uploadSource, setUploadSource] = useState<UploadSource>("files");
  const [images, setImages] = useState<any[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [autoDetect, setAutoDetect] = useState(false);
  const [selectedProcessing, setSelectedProcessing] = useState<string[]>([]);
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
  
  useEffect(() => {
    const loadProjects = async () => {
      try {
        let allUsers = false;
        let userId = undefined;
        if (selectedUserId === null) {
          allUsers = true;
        } else {
          userId = selectedUserId;
        }
        const gallery = await assetApi.getGallery(userId, allUsers);
        const projects = [
          ...new Set(
            gallery.map((s: any) => s.metadata?.project_name).filter(Boolean),
          ),
        ] as string[];
        setExistingProjects(projects);
      } catch (e) {
        console.error("Failed to load projects:", e);
      }
    };
    loadProjects();
  }, [selectedUserId]);
  useEffect(() => {
    if (
      showPerImageOverrides &&
      images.length > 1 &&
      selectedProcessing.length > 0
    ) {
      setImages((prev) =>
        prev.map((img) => {
          if (!img.selectedOps || img.selectedOps.length === 0) {
            return {
              ...img,
              selectedOps: [...selectedProcessing],
            };
          }
          return img;
        }),
      );
    }
}, [showPerImageOverrides]); 
  const removeImage = (id: number) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };
  const handleProcessBatch = async () => {
    const anyImageNeedsCrop = images.some((img) =>
      (img.selectedOps?.length ? img.selectedOps : selectedProcessing).includes(
        "crop",
      ),
    );
    if (anyImageNeedsCrop) {
      const uncroppedTargets = images.filter((img) => {
        const ops = img.selectedOps?.length
          ? img.selectedOps
          : selectedProcessing;
        return ops.includes("crop") && !img.isCropped;
      });
      if (uncroppedTargets.length > 0) {
        toast.error(
          `Please crop ${uncroppedTargets.length} image(s) before processing.`,
        );
        return;
      }
    }
const anyImageNeedsLineDiagram = images.some((img) => {
  const ops = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
  return ops.includes("line-diagram");
});
if (anyImageNeedsLineDiagram) {
  const imagesWithoutMeasurements = images.filter((img) => {
    const ops = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
    return ops.includes("line-diagram") && 
      !lineDiagramResults.some((r) => r.imageId === img.id && r.measurements.length > 0);
  });
  if (imagesWithoutMeasurements.length > 0) {
    toast.error(
      `Please add measurements to ${imagesWithoutMeasurements.length} image(s) before processing. Images: ${imagesWithoutMeasurements.map(i => i.name).join(', ')}`,
    );
    return;
  }
}
    setUploading(true);
    setProgress({
      current: 0,
      total: images.length,
      phase: "Uploading",
    });
    try {
      const project = projectName.trim();
      const formData = new FormData();
      if (project) formData.append("project_name", project);
      const dimensionsMap: Record<string, { width: number; height: number }> =
        {};
      images.forEach((img) => {
        if (img.file) {
          formData.append("files", img.file, img.name);
          if (img.isCropped && img.originalDimensions) {
            dimensionsMap[img.name] = img.originalDimensions;
          }
        }
      });
      const cropSettings = images
        .filter((img) => img.isCropped)
        .map((img) => ({
          filename: img.name,
          cropMode: img.cropMode,
          targetAspectRatio: img.targetAspectRatio,
        }));
      if (cropSettings.length) {
        formData.append("crop_settings", JSON.stringify(cropSettings));
      }
      if (Object.keys(dimensionsMap).length > 0) {
        formData.append("original_dimensions", JSON.stringify(dimensionsMap));
      }
      const batchResult = await assetApi.upload(
        formData,
        selectedUserId,
        (pct) => {
          setProgress((prev) => ({
            ...prev,
            current: Math.round((pct / 100) * prev.total),
          }));
        },
      );
      const totalRequested = images.length;
      const uploadedCount = batchResult.images.length;
      const failedCount =
        batchResult.failed_files?.length ??
        Math.max(0, totalRequested - uploadedCount);
      if (failedCount === 0) {
        toast.success(
          `${uploadedCount} of ${totalRequested} image${
            totalRequested !== 1 ? "s" : ""
          } uploaded successfully.`,
        );
      } else if (uploadedCount === 0) {
        toast.error(`All ${totalRequested} uploads failed.`);
      } else {
        toast.warning(
          `${uploadedCount} of ${totalRequested} image${
            totalRequested !== 1 ? "s" : ""
          } uploaded successfully. ${failedCount} failed.`,
        );
      }
      if (batchResult.failed_files?.length) {
        console.warn("Failed uploads:", batchResult.failed_files);
      }
      setProgress({
        current: 0,
        total: batchResult.images.length,
        phase: "Processing",
      });
      const results = [];
      for (const asset of batchResult.images) {
        const matchingLocal = images.find((img) => img.name === asset.name);
        let operationsToSend = matchingLocal?.selectedOps?.length
          ? [...matchingLocal.selectedOps]
          : [...selectedProcessing];
        const processOptions: any = {};
if (operationsToSend.includes("bg-remove")) {
  if (backgroundColor && backgroundColor !== "transparent") {
    processOptions.background_color = backgroundColor;
  } else {
    processOptions.background_color = "transparent";
  }
}
       if (operationsToSend.includes("line-diagram")) {
  const lineDiagramData = lineDiagramResults.find(
    (r) => r.imageName === asset.name || r.imageName === matchingLocal?.name
  );
  if (lineDiagramData && lineDiagramData.measurements.length > 0) {
    processOptions.measurements = lineDiagramData.measurements;
    processOptions.annotated_image_url = lineDiagramData.annotatedImageUrl;
  }
}
const uploadId = batchResult.upload_id;

        if (operationsToSend.includes("resize")) {
          if (useMarketplaceResize) {
            const dimensions =
              getResizeDimensionsForDestinations(selectedDestinations);
            if (dimensions && dimensions.length > 0) {
              processOptions.resize = dimensions;
              operationsToSend = operationsToSend.filter(
                (op) => op !== "resize",
              );
            }
          } else {
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
        }
        if (operationsToSend.includes("compress")) {
          processOptions.quality = compressionQuality;
        }
        const ops = autoDetect ? [] : operationsToSend;
        const res = await assetApi.process(
          asset.id,
          ops,
          processOptions,
          autoDetect,
        );
        setProgress((prev) => ({
          ...prev,
          current: Math.min(prev.current + 1, prev.total),
        }));
        if (res.outputs && res.outputs.length > 0) {
          results.push({
            outputs: res.outputs,
            originalName: asset.name,
            metadata:{...asset,upload_id: uploadId},
            appliedOps: res.telemetry?.steps || ops,
          });
        } else {
          results.push({
            url: res.url,
            name: res.name,
            originalName: asset.name,
            metadata:{...asset,upload_id: uploadId},
            appliedOps: res.telemetry?.steps || ops,
          });
        }
      }
      setProcessedResults(results);
      setCurrentStep("results");
      toast.success("Processing complete!");
    } catch (e: any) {
      console.error("Process error:", e);
      const backendMessage =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to process batch";
      toast.error(backendMessage);
    } finally {
      setUploading(false);
    }
  };
  useEffect(() => {
    console.log("progress state changed", progress);
  }, [progress]);
  const handleCropSave = (newFile: File, mode: string, ratio?: string) => {
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
            isCropped: true,
            cropMode: mode,
            targetAspectRatio: ratio,
            originalDimensions: editingImage.originalDimensions || {
              width: img.originalDimensions?.width || 0,
              height: img.originalDimensions?.height || 0,
            },
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
  const toggleImageOperation = (imageId: number, opId: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              selectedOps: img.selectedOps?.includes(opId)
                ? img.selectedOps.filter((o: string) => o !== opId)
                : [...(img.selectedOps || []), opId],
            }
          : img,
      ),
    );
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
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "application/pdf",
      ];
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
      
      {/* {currentStep === "upload" && (
        <div className="flex gap-6 animate-in fade-in duration-500 items-start">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Import Source
                </h3>
                {images.length > 0 && (
                  <button
                    onClick={() => setCurrentStep("destinations")}
                    className="bg-[#007BC7] hover:bg-[#0069ab] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-100"
                  >
                    <span>Next: Destinations</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
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
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 border-dashed p-8 md:p-10 lg:p-12 flex flex-col md:flex-row gap-8 group hover:border-blue-400 transition-colors relative">
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {uploadSource === "files" ? (
                  <>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                      Drag and drop images here
                    </h3>
                    <p className="text-slate-400 text-sm font-medium mb-8"></p>
                    <div className="flex items-center w-64 mb-8">
                      <div className="flex-grow h-px bg-slate-100" />
                      <span className="mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        or
                      </span>
                      <div className="flex-grow h-px bg-slate-100" />
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
                            const validTypes = [
                              "image/jpeg",
                              "image/png",
                              "image/webp",
                              "image/avif",
                              "application/pdf",
                            ];
                            const invalidFiles = files.filter(
                              (f) => !validTypes.includes(f.type),
                            );
                            const validFiles = files.filter((f) =>
                              validTypes.includes(f.type),
                            );
                            if (invalidFiles.length > 0) {
                              const invalidNames = invalidFiles
                                .map((f) => f.name)
                                .join(", ");
                              toast.error(
                                `Invalid file types: ${invalidNames}. Only images (JPG, PNG, WebP, AVIF) and PDFs are allowed.`,
                              );
                            }
                            if (validFiles.length === 0) {
                              toast.error("Please select valid image files");
                              return;
                            }
                            const filePromises = validFiles.map((f) => {
                              return new Promise<any>((resolve) => {
                                const previewUrl = URL.createObjectURL(f);
                                const img = new Image();
                                img.onload = () => {
                                  resolve({
                                    file: f,
                                    name: f.name,
                                    id: Math.random(),
                                    preview: previewUrl,
                                    url: previewUrl,
                                    isCropped: false,
                                    originalDimensions: {
                                      width: img.naturalWidth,
                                      height: img.naturalHeight,
                                    },
                                    selectedOps: [],
                                  });
                                };
                                img.onerror = () => {
                                  resolve({
                                    file: f,
                                    name: f.name,
                                    id: Math.random(),
                                    preview: previewUrl,
                                    url: previewUrl,
                                    isCropped: false,
                                    originalDimensions: null,
                                    selectedOps: [],
                                  });
                                };
                                img.src = previewUrl;
                              });
                            });
                            Promise.all(filePromises).then((newImages) => {
                              setImages(newImages);
                              console.log(
                                "Images loaded with dimensions:",
                                newImages,
                              );
                            });
                            if (invalidFiles.length > 0) {
                              toast.warning(
                                `${invalidFiles.length} file(s) skipped due to invalid type`,
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
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
              <div className="w-full md:w-80 bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">
                    Selected Files
                  </h4>
                  {images.length > 0 && (
                    <button
                      onClick={() => setImages([])}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {images.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No files selected yet. Add files on the left.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square bg-white rounded-xl border border-slate-100 overflow-hidden">
                          <img
                            src={image.preview || image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-0 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                          {image.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )} */}
      {currentStep === "upload" && (
  <div className="flex gap-6 animate-in fade-in duration-500 items-start">
    {/* LEFT: Import Source - 40% */}
    <div className="w-[40%] space-y-6">
      {/* Import Source card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
            Import Source
          </h3>
          {images.length > 0 && (
            <button
              onClick={() => setCurrentStep("destinations")}
              className="bg-[#007BC7] hover:bg-[#0069ab] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-100"
            >
              <span>Next: Destinations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

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

      {/* Drag and drop area */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 border-dashed p-8 flex flex-col items-center justify-center text-center group hover:border-blue-400 transition-colors relative">
        {uploadSource === "files" ? (
          <>
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Drag and drop images here
            </h3>
            <p className="text-slate-400 text-sm font-medium mb-8"></p>
            <div className="flex items-center w-64 mb-8">
              <div className="flex-grow h-px bg-slate-100" />
              <span className="mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                or
              </span>
              <div className="flex-grow h-px bg-slate-100" />
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
                    const validTypes = [
                      "image/jpeg",
                      "image/png",
                      "image/webp",
                      "image/avif",
                      "application/pdf",
                    ];
                    const invalidFiles = files.filter(
                      (f) => !validTypes.includes(f.type),
                    );
                    const validFiles = files.filter((f) =>
                      validTypes.includes(f.type),
                    );

                    if (invalidFiles.length > 0) {
                      const invalidNames = invalidFiles
                        .map((f) => f.name)
                        .join(", ");
                      toast.error(
                        `Invalid file types: ${invalidNames}. Only images (JPG, PNG, WebP, AVIF) and PDFs are allowed.`,
                      );
                    }

                    if (validFiles.length === 0) {
                      toast.error("Please select valid image files");
                      return;
                    }

                    const filePromises = validFiles.map((f) => {
                      return new Promise<any>((resolve) => {
                        const previewUrl = URL.createObjectURL(f);
                        const img = new Image();
                        img.onload = () => {
                          resolve({
                            file: f,
                            name: f.name,
                            id: Math.random(),
                            preview: previewUrl,
                            url: previewUrl,
                            isCropped: false,
                            originalDimensions: {
                              width: img.naturalWidth,
                              height: img.naturalHeight,
                            },
                            selectedOps: [],
                          });
                        };
                        img.onerror = () => {
                          resolve({
                            file: f,
                            name: f.name,
                            id: Math.random(),
                            preview: previewUrl,
                            url: previewUrl,
                            isCropped: false,
                            originalDimensions: null,
                            selectedOps: [],
                          });
                        };
                        img.src = previewUrl;
                      });
                    });

                    Promise.all(filePromises).then((newImages) => {
                      setImages(prev=>[...prev,...newImages]);
                      console.log(
                        "Images loaded with dimensions:",
                        newImages,
                      );
                    });

                    if (invalidFiles.length > 0) {
                      toast.warning(
                        `${invalidFiles.length} file(s) skipped due to invalid type`,
                      );
                    }
                  }}
                />
              </label>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
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

    {/* RIGHT: Selected Files Preview - 60% */}
    <div className="w-[60%] bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Uploaded Files
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {images.length} file{images.length !== 1 ? 's' : ''} selected
          </p>
        </div>
        {images.length > 0 && (
          <button
            onClick={() => setImages([])}
            className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
            <ImageIcon className="w-10 h-10 text-slate-300" />
          </div>
          <h4 className="text-lg font-bold text-slate-400 mb-2">
            No files selected
          </h4>
          <p className="text-sm text-slate-400 max-w-sm">
            Drag and drop files or use the import options on the left to add images
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <img
                  src={image.preview || image.url}
                  alt={image.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>
              
              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => removeImage(image.id)}
                  className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Image info */}
              <div className="mt-2 px-1">
                <p className="text-xs font-medium text-slate-700 truncate">
                  {image.name}
                </p>
                {image.originalDimensions && (
                  <p className="text-[10px] text-slate-400">
                    {image.originalDimensions.width} × {image.originalDimensions.height}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
      <div className="pt-1">
        <button
          onClick={() => setCurrentStep("upload")}
          className="flex items-center space-x-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Import</span>
        </button>
      </div>
      {currentStep === "destinations" && (
        <div className="flex gap-6 animate-in slide-in-from-right-4 duration-500 items-start">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
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
          className="w-20 h-20 flex-shrink-0 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden shadow-sm"
          title={image.name}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={image.name}
              className="w-full h-full object-contain p-1"
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
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      setShowProjectSuggestions(true);
                    }}
                    onFocus={() => setShowProjectSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowProjectSuggestions(false), 200)
                    }
                    placeholder="e.g. Summer Collection 2025"
                    className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-6 py-4 text-sm transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white ${!projectName.trim() ? "border-amber-300" : "border-slate-200"}`}
                  />
                  {showProjectSuggestions && projectName.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                      {existingProjects
                        .filter((p) =>
                          p.toLowerCase().includes(projectName.toLowerCase()),
                        )
                        .map((project) => (
                          <button
                            key={project}
                            type="button"
                            onClick={() => {
                              setProjectName(project);
                              setShowProjectSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <Folder className="w-4 h-4 text-slate-400" />
                            {project}
                          </button>
                        ))}
                      {existingProjects.filter((p) =>
                        p.toLowerCase().includes(projectName.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-4 py-2.5 text-sm text-slate-400">
                          New project: "{projectName}"
                        </div>
                      )}
                    </div>
                  )}
                  {!projectName.trim() && (
                    <p className="text-amber-600 text-xs font-bold mt-2 flex items-center gap-1">
                      Project name is required to continue
                    </p>
                  )}
                </div>
              </div>
            </div>
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
                    toast.error(
                      "Please enter a project name before proceeding",
                    );
                    return;
                  }
                  setCurrentStep("processing");
                }}
                disabled={
                  selectedDestinations.length === 0 || !projectName.trim()
                }
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
                  <>
                    <button
                      onClick={() =>
                       {
                        const allSelected=PROCESSING_OPTIONS.every((o)=>selectedProcessing.includes(o.id))
                        if(allSelected)
                        {
                          setSelectedProcessing([])
                        }
                        else
                        {
                          setSelectedProcessing(PROCESSING_OPTIONS.map((o) => o.id));
                        }
                       }
                      }
                      className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
                    >
                       {PROCESSING_OPTIONS.every((o) => selectedProcessing.includes(o.id))
    ? "Deselect all"
    : "Select all"}
                    </button>
                    <button
                      type="button"
                      disabled={images.length <= 1}
                      onClick={() => setShowPerImageOverrides((v) => !v)}
                      className={cn(
                        "text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors",
                        images.length <= 1
                          ? "text-slate-300 border-slate-200 cursor-not-allowed"
                          : showPerImageOverrides
                            ? "text-blue-600 border-blue-500 bg-blue-50"
                            : "text-slate-500 border-slate-200 hover:border-slate-400",
                      )}
                    >
                      Per-image overrides
                    </button>
                  </>
                )}
              </div>

            </div>
            {images.length > 1 && showPerImageOverrides && selectedProcessing.length > 0 && (
        <div className="mb-6 bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Override for:
            </span>
            <div className="flex flex-wrap gap-2">
              {images.map((img) => {
                const imgOps = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
                const activeOpsCount = PROCESSING_OPTIONS.filter(
                  (op) => selectedProcessing.includes(op.id) && imgOps.includes(op.id)
                ).length;
                const hasCustomOps = img.selectedOps?.length > 0;
                
                return (
                  <div key={img.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        // Toggle a dropdown or modal for this image
                        const el = document.getElementById(`override-${img.id}`);
                        if (el) el.classList.toggle('hidden');
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        hasCustomOps
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <div className="w-5 h-5 rounded overflow-hidden bg-white border border-slate-200">
                        <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate max-w-[100px]">{img.name}</span>
                      {hasCustomOps && (
                        <span className="text-[9px] bg-amber-200 px-1.5 py-0.5 rounded-full font-bold">
                          {activeOpsCount}
                        </span>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {/* Dropdown for this image */}
                    <div
                      id={`override-${img.id}`}
                      className="hidden absolute top-full left-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[280px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Operations</span>
                        {hasCustomOps && (
                          <button
                            type="button"
                            onClick={() => {
                              setImages(prev => prev.map(i => 
                                i.id === img.id ? { ...i, selectedOps: [] } : i
                              ));
                            }}
                            className="text-[10px] text-red-500 hover:text-red-600"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PROCESSING_OPTIONS.filter((op) =>
                          selectedProcessing.includes(op.id),
                        ).map((op) => {
                          const isActive = imgOps.includes(op.id);
                          return (
                            <button
                              key={op.id}
                              type="button"
                              onClick={() => toggleImageOperation(img.id, op.id)}
                              className={cn(
                                "px-2 py-1 text-[10px] font-medium rounded-md border transition-all flex items-center gap-1.5",
                                isActive
                                  ? "bg-blue-50 text-blue-700 border-blue-300"
                                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300",
                              )}
                            >
                              {isActive ? (
                                <CheckCircle className="w-3 h-3 text-blue-600" />
                              ) : (
                                <X className="w-3 h-3 text-slate-300" />
                              )}
                              {op.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setImages(prev => prev.map(img => ({
                  ...img,
                  selectedOps: [...selectedProcessing]
                })));
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 whitespace-nowrap ml-auto"
            >
              Reset All
            </button>
          </div>
        </div>
      )}
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
              <>
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
                            setSelectedProcessing((prev) => {
                              if (op.id === "bg-remove" && !active) {
                                return [
                                  ...prev.filter((x) => x !== "shadow-remove"),
                                  op.id,
                                ];
                              }
                              return active
                                ? prev.filter((x) => x !== op.id)
                                : [...prev, op.id];
                            })
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
                        {active && op.id === "bg-remove" && (
  <div className="px-6 pb-6 pt-2 border-t border-blue-100/50 bg-white/50">
    <div className="mb-3 flex items-center justify-between">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
        Background Options
      </label>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400">Change Color:</span>
        <button
          type="button"
          onClick={() => {
            if (backgroundColor && backgroundColor !== "transparent") {
              setBackgroundColor("transparent");
              setCustomHexColor("#FFFFFF");
            } else {
              setBackgroundColor("#FFFFFF");
              setCustomHexColor("#FFFFFF");
            }
          }}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            backgroundColor && backgroundColor !== "transparent" 
              ? "bg-blue-600" 
              : "bg-slate-300"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
              backgroundColor && backgroundColor !== "transparent" 
                ? "translate-x-4" 
                : "translate-x-0.5"
            )}
          />
        </button>
      </div>
    </div>
    {backgroundColor && backgroundColor !== "transparent" ? (
      <>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {BG_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setBackgroundColor(preset.value);
                setCustomHexColor(preset.value);
              }}
              className={`relative aspect-square rounded-xl border-2 transition-all ${
                backgroundColor === preset.value
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              title={preset.label}
            >
              <div className={`absolute inset-1 rounded-lg ${preset.preview}`} />
              {backgroundColor === preset.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600 drop-shadow-sm" />
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={customHexColor}
              onChange={(e) => {
                let value = e.target.value;
                if (!value.startsWith("#")) {
                  value = "#" + value.replace(/#/g, "");
                }
                const hexPart = value.slice(1).replace(/[^0-9A-Fa-f]/g, "");
                value = "#" + hexPart;
                value = value.slice(0, 7);
                setCustomHexColor(value);
                if (value.length === 7) {
                  setBackgroundColor(value);
                }
              }}
              placeholder="#FFFFFF"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            />
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-slate-200"
              style={{ backgroundColor: customHexColor }}
            />
          </div>
          <button
            onClick={() => {
              if (/^#[0-9A-Fa-f]{6}$/.test(customHexColor)) {
                setBackgroundColor(customHexColor);
              }
            }}
            className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="mt-2 text-[10px] text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1"
        >
          <Palette className="w-3 h-3" />
          {showColorPicker ? "Hide" : "Show"} Advanced Color Picker
        </button>
        {showColorPicker && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customHexColor}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setCustomHexColor(value);
                  setBackgroundColor(value);
                }}
                className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
              />
              <span className="text-xs text-slate-600">
                Pick any color: <span className="font-mono font-bold">{customHexColor}</span>
              </span>
            </div>
          </div>
        )}
      </>
    ) : (
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3">
        <p className="text-xs text-slate-500">
          Background will be removed and kept transparent. Toggle "Change Color" to fill with a solid color.
        </p>
      </div>
    )}
  </div>
)}
                        {active && op.id === "resize" && (
                          <div className="px-6 pb-6 pt-2 border-t border-blue-100/50 bg-white/50">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-100">
                              <span className="text-xs font-bold text-slate-700">
                                Resize Mode
                              </span>
                              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                                <button
                                  onClick={() => setUseMarketplaceResize(true)}
                                  className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                    useMarketplaceResize
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "text-slate-500 hover:text-slate-700",
                                  )}
                                >
                                  Auto (Platform)
                                </button>
                                <button
                                  onClick={() => setUseMarketplaceResize(false)}
                                  className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                    !useMarketplaceResize
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "text-slate-500 hover:text-slate-700",
                                  )}
                                >
                                  Custom
                                </button>
                              </div>
                            </div>
                            {useMarketplaceResize ? (
                              <div className="space-y-2">
                                <p className="text-xs text-slate-500">
                                  Will resize to platform specifications:
                                </p>
                                {selectedDestinations.length === 0 ? (
                                  <p className="text-xs text-amber-600">
                                    Select destinations first to see dimensions
                                  </p>
                                ) : (
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {selectedDestinations.map((destId) => {
                                      const rule = MARKETPLACE_RULES[destId];
                                      if (!rule) return null;
                                      return (
                                        <div
                                          key={destId}
                                          className="flex items-center justify-between text-sm bg-white p-2 rounded-lg border border-slate-100"
                                        >
                                          <span className="font-medium text-slate-700">
                                            {rule.label}
                                          </span>
                                          <span className="text-blue-600 font-mono text-xs">
                                            {rule.resizeDimensions.width} ×{" "}
                                            {rule.resizeDimensions.height}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
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
                                          onClick={() =>
                                            setSelectedPreset(preset)
                                          }
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
                                        setResizePercentage(
                                          Number(e.target.value),
                                        )
                                      }
                                      className="w-full accent-blue-600"
                                    />
                                  </div>
                                )}
                              </>
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
    <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-100">
      <span className="text-xs font-bold text-slate-700">
        Crop Mode
      </span>
      <div className="flex items-center space-x-2 bg-slate-100 p-0.5 rounded-lg">
        <button
          onClick={() => setCropMode("preset")}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-all",
            cropMode === "preset"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          Marketplace Presets
        </button>
        <button
          onClick={() => setCropMode("free")}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-all",
            cropMode === "free"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          Free Crop
        </button>
      </div>
    </div>
    {cropMode === "preset" ? (
      <div>
        <p className="text-xs text-slate-500 mb-2">
          Select aspect ratio:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            ...new Set(
              selectedDestinations
                .map(
                  (d) =>
                    MARKETPLACE_RULES[d]?.aspectRatio
                      ?.default,
                )
                .filter(Boolean),
            ),
          ].map((ratio) => (
            <button
              key={ratio}
              onClick={() => {
                const uncropped = images.find(
                  (img) => {
                    const imgOps = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
                    return imgOps.includes("crop") && !img.isCropped;
                  }
                );
                if (uncropped) {
                  setEditingImage({
                    ...uncropped,
                    aspectRatio: ratio,
                    cropMode: "preset",
                  });
                }
              }}
              className="px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
            >
              {ratio}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400">
           Crops to exact marketplace requirements
        </p>
      </div>
    ) : (
      <div>
        <p className="text-xs text-slate-500 mb-2">
          Free crop (any shape):
        </p>
        <button
          onClick={() => {
            const uncropped = images.find(
              (img) => {
                const imgOps = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
                return imgOps.includes("crop") && !img.isCropped;
              }
            );
            if (uncropped) {
              setEditingImage({
                ...uncropped,
                aspectRatio: undefined,
                cropMode: "free",
              });
            }
          }}
          className="w-full py-2 text-xs bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200"
        >
          Free Crop (any aspect ratio)
        </button>
        <p className="text-[10px] text-amber-600 mt-2">
          Free cropping may not meet marketplace
          requirements
        </p>
      </div>
    )}
    <div className="mt-3 max-h-40 overflow-y-auto">
  {images.filter((img) => {
    const imgOps = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
    return imgOps.includes("crop");
  }).length === 0 ? (
    <div className="text-center py-4">
      <p className="text-xs text-slate-400 mb-3">
        No images selected for cropping
      </p>
      <p className="text-[10px] text-slate-400 mb-3">
        Select images to crop from per-image overrides or add crop globally
      </p>
      {images.length > 1 && showPerImageOverrides ? (
        <button
          onClick={() => setShowPerImageOverrides(true)}
          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100"
        >
          Open Per-Image Overrides
        </button>
      ) : (
        <button
          onClick={() => {
            setSelectedProcessing(prev => 
              prev.includes("crop") ? prev : [...prev, "crop"]
            );
            toast.success("Crop operation added globally");
          }}
          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100"
        >
          Add Crop to All Images
        </button>
      )}
    </div>
  ) : (
    images
      .filter((img) => {
        const imgOps = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
        return imgOps.includes("crop");
      })
      .map((img, idx) => (
        <button
          key={idx}
          onClick={() => {
            const previewUrl =
              img.preview ||
              img.url ||
              (img.file
                ? URL.createObjectURL(img.file)
                : "");
            setEditingImage({
              ...img,
              url: previewUrl,
              preview: previewUrl,
              aspectRatio:
                cropMode === "preset"
                  ? "1:1"
                  : undefined,
              cropMode: cropMode,
            });
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold mb-2 block w-full text-left truncate flex items-center justify-between ${
            img.isCropped
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          <span>
            {img.isCropped ? "✓" : "✂️"} Crop:{" "}
            {img.name}
          </span>
          {img.isCropped && (
            <CheckCircle className="w-4 h-4 text-green-600" />
          )}
        </button>
      ))
  )}
</div>
    {editingImage && editingImage.url && (
      <ImageCropModal
        key={editingImage.id}
        imageSrc={editingImage.url}
        fileName={editingImage.name}
        aspectRatio={editingImage.aspectRatio}
        cropMode={editingImage.cropMode}
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
    {images.filter((img) => {
      const imgOps = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
      return imgOps.includes("line-diagram");
    }).length === 0 ? (
      <div className="text-center py-4">
        <p className="text-xs text-slate-400 mb-3">
          No images selected for line diagram
        </p>
        {images.length > 1 && showPerImageOverrides ? (
          <button
            onClick={() => setShowPerImageOverrides(true)}
            className="px-3 py-1.5 text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-md hover:bg-purple-100"
          >
            Open Per-Image Overrides
          </button>
        ) : (
          <button
            onClick={() => {
              setSelectedProcessing(prev => 
                prev.includes("line-diagram") ? prev : [...prev, "line-diagram"]
              );
              toast.success("Line diagram added globally");
            }}
            className="px-3 py-1.5 text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-md hover:bg-purple-100"
          >
            Add Line Diagram to All Images
          </button>
        )}
      </div>
    ) : (
      images
        .filter((img) => {
          const imgOps = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
          return imgOps.includes("line-diagram");
        })
        .map((img) => (
          <button
            key={img.id}
            onClick={() => handleLineDiagramClick(img)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold w-full text-left mb-2"
          >
             {img.name}
          </button>
        ))
    )}
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
                {images.length > 1 &&
  showPerImageOverrides &&
  selectedProcessing.length > 0 && (
    <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-black text-slate-900">
            Per-Image Operation Overrides
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Customize which operations apply to each image. 
            <span className="text-blue-600 font-semibold"> Blue = Will be applied</span>
            {" • "}
            <span className="text-slate-400">Grey = Will be skipped</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setImages(prev => prev.map(img => ({
                ...img,
                selectedOps: [...selectedProcessing]
              })));
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            Reset All to Global
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {images.map((img) => {
          const imgOps = img.selectedOps?.length ? img.selectedOps : selectedProcessing;
          const activeOpsCount = PROCESSING_OPTIONS.filter(
            (op) => selectedProcessing.includes(op.id) && imgOps.includes(op.id)
          ).length;
          const hasCustomOps = img.selectedOps?.length > 0;
          return (
            <div
              key={img.id}
              className="flex items-center gap-4 border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors bg-slate-50/50"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 shadow-sm">
                <img
                  src={img.preview || img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                   e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-size="12">No preview</text></svg>';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {img.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasCustomOps ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          Custom ({activeOpsCount} of {selectedProcessing.length} ops)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setImages(prev => prev.map(i => 
                              i.id === img.id ? { ...i, selectedOps: [] } : i
                            ));
                          }}
                          className="text-[10px] font-bold text-red-500 hover:text-red-600 px-2 py-0.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Remove all custom operations (use global)"
                        >
                          Reset to Global
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                        Global ({activeOpsCount} ops)
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-slate-400 mb-2">
                    Click to toggle operations for this image:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PROCESSING_OPTIONS.filter((op) =>
                      selectedProcessing.includes(op.id),
                    ).map((op) => {
                      const isActive = imgOps.includes(op.id);
                      return (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => toggleImageOperation(img.id, op.id)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-2",
                            isActive
                              ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 shadow-sm"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-500",
                          )}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-semibold">{op.label}</span>
                              <span className="text-[9px] text-blue-500 font-bold ml-1">ON</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5 text-slate-400" />
                              <span>{op.label}</span>
                              <span className="text-[9px] text-slate-400 ml-1">OFF</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}
              </>
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
                {images.length}
              </div>
              <p className="text-[11px] text-slate-400 font-bold leading-tight">
                {images.length} files ×{" "}
                {autoDetect ? "AI Ops" : selectedProcessing.length + " ops"} ×{" "}
                {selectedDestinations.length} dests
              </p>
            </div>
            {selectedProcessing.includes("bg-remove") &&
              selectedProcessing.includes("shadow-remove") && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Background Color
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-6 h-6 rounded border border-slate-200"
                      style={{ backgroundColor: backgroundColor }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {backgroundColor}
                    </span>
                  </div>
                </div>
              )}
           <button
  onClick={handleProcessBatch}
  disabled={
    uploading ||
    (!autoDetect && selectedProcessing.length === 0) ||
    images.length === 0
  }
  className="w-full bg-[#007BC7] hover:bg-[#0069ab] text-white py-5 rounded-2xl font-black flex items-center justify-center space-x-3 shadow-2xl shadow-blue-100 disabled:opacity-50 transition-all uppercase tracking-widest text-xs relative overflow-hidden"
>
  {/* Progress fill background */}
  {uploading && progress.total > 0 && (
    <div
      className="absolute inset-0 bg-emerald-500 transition-all duration-500 ease-out"
      style={{
        width: `${Math.round((progress.current / progress.total) * 100)}%`,
      }}
    />
  )}
  
  {/* Button content (on top of fill) */}
  <span className="relative z-10 flex items-center justify-center space-x-3">
    {uploading ? (
      <>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>
          {progress.phase === "Processing" ? "Processing..." : "Uploading..."}
          {progress.total > 0 && ` (${progress.current}/${progress.total})`}
        </span>
      </>
    ) : (
      <>
        <Wand2 className="w-5 h-5" />
        <span>Start Processing</span>
      </>
    )}
  </span>
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
              {processedResults.length > 1 && (
  <>
    <div className="h-8 w-px bg-slate-100" />
    <button
      onClick={async () => {
        try {
          const uploadId = processedResults[0]?.metadata?.upload_id;
           console.log("uploadId for ZIP:", uploadId);
          if (uploadId) {
            toast.loading("Downloading ZIP...");
            await assetApi.downloadProjectZip(uploadId);
            toast.dismiss();
            toast.success("ZIP downloaded");
          }
        } catch (error) {
          toast.dismiss();
          toast.error("Failed to download ZIP");
        }
      }}
      className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 transition-all"
    >
      <Download className="w-4 h-4" />
      <span>Download All as ZIP</span>
    </button>
  </>
)}
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
                  className="bg-white rounded-[2rem] border border-slate-200 p-5 hover:border-blue-400 shadow-sm transition-all"
                >
                  <div className="flex items-center space-x-8 mb-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center p-2">
                      <img
                        src={res.metadata?.url}
                        className="w-full h-full object-contain"
                        alt={res.originalName}
                      />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base mb-1 tracking-tight">
                        {res.originalName}
                      </h4>
                      <div className="text-xs text-slate-400">
                        Original: {res.metadata?.width || "?"} ×{" "}
                        {res.metadata?.height || "?"}
                      </div>
                    </div>
                  </div>
                  {res.outputs && res.outputs.length > 0 ? (
                    <div className="border-t border-slate-100 pt-4">
                      <h5 className="text-sm font-black text-slate-700 mb-3">
                        Generated Images
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        {res.outputs.map((output, i) => (
                          <div
                            key={i}
                            className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm capitalize">
                                {output.marketplace}
                              </span>
                              <span className="text-xs text-slate-500">
                                {output.width}×{output.height}
                              </span>
                            </div>
                            <img
                              src={output.url}
                              alt={output.marketplace}
                              className="w-full h-32 object-contain bg-white rounded-lg"
                            />
                            <button
                              onClick={async () => {
                                const response = await fetch(output.url);
                                const blob = await response.blob();
                                const blobUrl = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = blobUrl;
                                link.download = `${res.originalName.split(".")[0]}_${output.marketplace}.jpg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(blobUrl);
                              }}
                              className="mt-2 w-full py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : res.url ? (
                    <div className="border-t border-slate-100 pt-4">
                      <h5 className="text-sm font-black text-slate-700 mb-3">
                        Processed Image
                      </h5>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm capitalize">
                            Result
                          </span>
                          <span className="text-xs text-slate-500">
                            {res.processed_width && res.processed_height
                              ? `${res.processed_width}×${res.processed_height}`
                              : `${res.metadata?.width || "?"}×${res.metadata?.height || "?"}`}
                          </span>
                        </div>
                        <img
                          src={res.url}
                          alt="Processed"
                          className="w-full h-32 object-contain bg-white rounded-lg"
                          onError={(e) => {
                            console.error("Failed to load image:", res.url);
                            e.currentTarget.src =
                              'data:image/svg+xml,<svg xmlns="http: www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-size="12">Load failed</text></svg>';
                          }}
                        />
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(res.url);
                              if (!response.ok)
                                throw new Error("Download failed");
                              const blob = await response.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = blobUrl;
                              link.download = `${res.originalName.split(".")[0]}_processed.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(blobUrl);
                              toast.success("Downloaded successfully");
                            } catch (error) {
                              console.error("Download error:", error);
                              toast.error("Failed to download image");
                            }
                          }}
                          className="mt-2 w-full py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download Processed Image
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-400">
                      Steps: {res.appliedOps?.join(", ") || "None"}
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-500">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Done
                      </span>
                    </div>
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
                  className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:border-blue-400 shadow-sm transition-all"
                >
                  {res.outputs && res.outputs.length > 0 ? (
                    <div>
                      <div className="aspect-square bg-slate-50 overflow-hidden flex items-center justify-center p-4">
                        <img
                          src={res.outputs[0].url}
                          className="w-full h-full object-contain"
                          alt={res.outputs[0].marketplace}
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-black text-slate-800 text-sm truncate">
                          {res.originalName}
                        </h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-bold text-slate-400">
                            {res.outputs.length} versions
                          </span>
                          <div className="flex gap-1">
                            {res.outputs.map((output, i) => (
                              <button
                                key={i}
                                onClick={async () => {
                                  const response = await fetch(output.url);
                                  const blob = await response.blob();
                                  const blobUrl = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = blobUrl;
                                  link.download = `${res.originalName.split(".")[0]}_${output.marketplace}.jpg`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(blobUrl);
                                  toast.success(
                                    `Downloaded ${output.marketplace}`,
                                  );
                                }}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600"
                                title={`Download ${output.marketplace}`}
                              >
                                {output.marketplace === "amazon-us"
                                  ? "Amazon"
                                  : output.marketplace === "walmart"
                                    ? "Walmart"
                                    : output.marketplace}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : res.url ? (
                    <div>
                      <div className="aspect-square bg-slate-50 overflow-hidden flex items-center justify-center p-4">
                        <img
                          src={res.url}
                          className="w-full h-full object-contain"
                          alt="Processed"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-black text-slate-800 text-sm truncate">
                          {res.originalName}
                        </h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-bold text-slate-400">
                            Processed
                          </span>
                          <button
                            onClick={async () => {
                              const response = await fetch(res.url);
                              const blob = await response.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = blobUrl;
                              link.download = `${res.originalName.split(".")[0]}_processed.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(blobUrl);
                              toast.success("Downloaded");
                            }}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
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
