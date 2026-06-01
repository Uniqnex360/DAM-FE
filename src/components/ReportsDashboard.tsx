import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Image as ImageIcon,
  Loader2,
  Package,
  Grid3x3,
  List,
  ChevronDown,
  Search,
  Bell,
  User,
  Eye,
  Activity,
  SortAsc,
  Filter,
  Folder,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { assetApi } from "../lib/api";
interface ProcessedImage {
  id: string;
  filename: string;
  file_size: number;
  dimensions: string;
  status: "done" | "processing" | "queued" | "failed";
  destinations: string[];
  outputs_count: number;
  outputs_ready: number;
  original_url: string;
  processed_url?: string;
  operations: string[];
  created_at: string;
  thumbnail_url?: string;
  output_urls: string[];
}
interface DashboardStats {
  total_images: number;
  total_outputs: number;
  completed: number;
  total_file_size: number;
}
interface DailyImport {
  date: string;
  count: number;
}
interface ProcessingStatus {
  processing: number;
  queued: number;
  failed: number;
}
interface TopOperation {
  name: string;
  count: number;
  color: string;
}
interface TopDestination {
  name: string;
  count: number;
}
interface RecentSession {
  id: string;
  filename: string;
  timestamp: string;
  destinations: string[];
  outputs: string;
  status: string;
}
type ViewMode = "grid" | "list";
type Tab = "results" | "reports";
const STATUS_CONFIG = {
  done: { label: "Done", color: "text-green-600 bg-green-50 border-green-200" },
  processing: {
    label: "Processing",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  queued: {
    label: "Queued",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  failed: { label: "Failed", color: "text-red-600 bg-red-50 border-red-200" },
};
export function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("results");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyImports, setDailyImports] = useState<DailyImport[]>([]);
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus | null>(null);
  const [topOperations, setTopOperations] = useState<TopOperation[]>([]);
  const [topDestinations, setTopDestinations] = useState<TopDestination[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(
    null,
  );
  const [filterProject, setFilterProject] = useState("all");
  const [expandedSessions, setExpandedSessions] = useState<
    Record<string, boolean>
  >({});
  const [sessions, setSessions] = useState<any[]>([]); // To keep grouped data
  const [sortBy, setSortBy] = useState("newest");
  const [filterDestination, setFilterDestination] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  useEffect(() => {
    loadData();
  }, []);
 const  loadData = async () => {
  try {
    setLoading(true);
    const [galleryData, report] = await Promise.all([
      assetApi.getGallery(),
      assetApi.getReport(),
    ]);

    if (galleryData) {
      setSessions(galleryData);

      const flatImages: ProcessedImage[] = galleryData.flatMap((session: any) => {
        return session.images.map((img: any) => ({
          id: img.id,
          filename: img.name,
          file_size: img.size || 0,
          dimensions: img.width && img.height 
            ? `${img.width}×${img.height}` 
            : "1080×1080",
          status: (function () {
            const s = session.status?.toLowerCase();
            if (s === "completed" || s === "success" || s === "done") return "done";
            if (s === "uploaded" || s === "pending") return "queued";
            if (s === "failed" || s === "error") return "failed";
            if (s === "processing") return "processing";
            return "queued";
          })(),
          destinations: session.metadata?.destinations || ["Shopify"],
          outputs_count: session.images.length,
          outputs_ready: session.images.filter((i: any) => i.processed_url).length,
          operations: img.processedOperations || [],
          created_at: session.created_at,
          thumbnail_url: img.url,
          original_url: img.url,
          processed_url: img.processed_url,
          output_urls: img.processed_url ? [img.processed_url] : [],
          project_name: session.metadata?.project_name || "Untitled Project", // ← Added
        }));
      });

      setImages(flatImages);
      calculateStats(flatImages);
      calculateProcessingStatus(flatImages);
      calculateTopDestinations(flatImages);
      generateRecentSessions(flatImages);
    }

      if (report) {
        if (report.daily_breakdown) {
          const chartData = report.daily_breakdown.slice(-7).map((d: any) => ({
            date: d.date,
            count: d.total_processed,
          }));
          setDailyImports(chartData);
        }
        if (report.operation_counts) {
          const sortedOps = Object.entries(report.operation_counts)
            .map(([name, count]: [string, any]) => ({
              name: name.replace("_", " ").toUpperCase(),
              count: count as number,
              color: getOperationColor(name),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
          setTopOperations(sortedOps);
        }
      }
    } catch (err) {
      console.error("API Load Failed:", err);
    } finally {
      setLoading(false);
    }
  };
  const calculateStats = (data: ProcessedImage[]) => {
    const stats: DashboardStats = {
      total_images: data.length,
      total_outputs: data.reduce(
        (sum, img) => sum + (img.outputs_count || 0),
        0,
      ),
      completed: data.filter((img) => img.status === "done").length,
      total_file_size: data.reduce((sum, img) => sum + (img.file_size || 0), 0),
    };
    setStats(stats);
  };
  const calculateDailyImports = (data: ProcessedImage[]) => {
    const last7Days: DailyImport[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = data.filter(
        (img) => img.created_at.split("T")[0] === dateStr,
      ).length;
      last7Days.push({ date: dateStr, count });
    }
    setDailyImports(last7Days);
  };
  const calculateProcessingStatus = (data: ProcessedImage[]) => {
    setProcessingStatus({
      processing: data.filter((img) => img.status === "processing").length,
      queued: data.filter((img) => img.status === "queued").length,
      failed: data.filter((img) => img.status === "failed").length,
    });
  };
  const calculateTopOperations = (data: ProcessedImage[]) => {
    const opCounts: Record<string, number> = {};
    data.forEach((img) => {
      img.operations?.forEach((op) => {
        opCounts[op] = (opCounts[op] || 0) + 1;
      });
    });
    const sorted = Object.entries(opCounts)
      .map(([name, count]) => ({ name, count, color: getOperationColor(name) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    setTopOperations(sorted);
  };
  const calculateTopDestinations = (data: ProcessedImage[]) => {
    const destCounts: Record<string, number> = {};
    data.forEach((img) => {
      img.destinations?.forEach((dest) => {
        destCounts[dest] = (destCounts[dest] || 0) + 1;
      });
    });
    const sorted = Object.entries(destCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    setTopDestinations(sorted);
  };
  const generateRecentSessions = (data: ProcessedImage[]) => {
    const sessions = data.slice(0, 5).map((img) => ({
      id: img.id,
      filename: img.filename,
      timestamp: img.created_at,
      destinations: img.destinations || [],
      outputs: `${img.outputs_ready}/${img.outputs_count}`,
      status: img.status,
    }));
    setRecentSessions(sessions);
  };
  const getOperationColor = (op: string) => {
    const colors: Record<string, string> = {
      "Image Cropping": "bg-cyan-500",
      Reframing: "bg-purple-500",
      "Background Removal": "bg-blue-500",
      "Smart Crop": "bg-green-500",
    };
    return colors[op] || "bg-slate-500";
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const filteredImages = images.filter((img) => {
  // Project filter
  if (filterProject !== "all" && img.project_name !== filterProject) {
    return false;
  }

  // Status filter
  if (filterStatus !== "all" && img.status !== filterStatus) {
    return false;
  }

  // Destination filter
  if (
    filterDestination !== "all" &&
    !img.destinations?.includes(filterDestination)
  ) {
    return false;
  }

  return true;
});
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Results & Reports
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            View all processed image outputs and analytics across your import
            sessions
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

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "results"
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Results</span>
            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">
              {images.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "reports"
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports</span>
          </button>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <span className="text-2xl">+</span>
          <span className="font-medium">Import New</span>
        </button>
      </div>
      {activeTab === "results" && (
        <>
          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              {/* Sort Filter */}
              <div className="flex items-center space-x-2 px-3 py-2 border border-slate-100 rounded-xl bg-white">
                <SortAsc className="w-4 h-4 text-slate-400" />
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-transparent pr-6 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Projects Filter */}
              <div className="flex items-center space-x-2 px-3 py-2 border border-slate-100 rounded-xl bg-white">
                <Folder className="w-4 h-4 text-slate-400" />
                <div className="relative">
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="appearance-none bg-transparent pr-8 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All projects</option>
                    {/* Automatically generates project list from your sessions */}
                    {[
                      ...new Set(
                        sessions
                          .map((s) => s.metadata?.project_name)
                          .filter(Boolean),
                      ),
                    ].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Destinations Filter */}
              <div className="flex items-center space-x-2 px-3 py-2 border border-slate-100 rounded-xl bg-white">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="relative">
                  <select
                    value={filterDestination}
                    onChange={(e) => setFilterDestination(e.target.value)}
                    className="appearance-none bg-transparent pr-8 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All destinations</option>
                    <option value="Shopify">Shopify</option>
                    <option value="Walmart">Walmart</option>
                    <option value="Amazon">Amazon</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2 px-3 py-2 border border-slate-100 rounded-xl bg-white">
                <Activity className="w-4 h-4 text-slate-400" />
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none bg-transparent pr-8 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All statuses</option>
                    <option value="done">Done</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode Toggle (Grid/List) */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {images.length} images
              </span>
            </div>
          </div>
          {viewMode === "list" ? (
            /* LIST VIEW: Grouped by Project (Session) */
            <div className="space-y-4">
              {sessions
  .filter((s) => {
    const projectName = s.metadata?.project_name || "Untitled Project";
    return filterProject === "all" || projectName === filterProject;
  })
  .map((session) => (
                  <div key={session.id} className="space-y-2">
                    {/* Project Header Row - same as your screenshot */}
                    <div
                      onClick={() =>
                        setExpandedSessions((prev) => ({
                          ...prev,
                          [session.id]: !expandedSessions[session.id],
                        }))
                      }
                      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <Folder className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-slate-900">
                              {session.metadata?.project_name ||
                                "Untitled Project"}
                            </h3>
                            <span className="text-xs text-slate-400 font-bold uppercase">
                              {session.images.length} images
                            </span>
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                              100% done
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 font-bold">
                            Last updated{" "}
                            {new Date(session.created_at).toLocaleString()} ·{" "}
                            {session.images.length}/{session.images.length}{" "}
                            images complete
                          </p>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-40 px-4">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full w-full" />
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-slate-300 transition-transform ${expandedSessions[session.id] ? "rotate-90" : ""}`}
                      />
                    </div>

                    {/* Expandable Content */}
                    {expandedSessions[session.id] && (
                      <div className="pl-12 space-y-3">
                        {session.images.slice(0, 5).map((img: any) => (
                          <div
                            key={img.id}
                            className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-4">
                              <img
                                src={img.url}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100"
                              />
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {img.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">
                                  {img.width}x{img.height} ·{" "}
                                  {formatFileSize(img.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6 pr-4">
                              <div className="text-right">
                                <div className="flex items-center space-x-1 text-emerald-500">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-black uppercase">
                                    Done
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  2/2 outputs
                                </p>
                              </div>
                              {/* Eye Button: Re-decorated to fix "ALL OUTPUTS" grid */}
                              <button
  onClick={() =>
    setSelectedImage({
      id: img.id,
      filename: img.name,
      file_size: img.size || 0,
      dimensions: `${img.width}×${img.height}`,
      status: "done",
      destinations: session.metadata?.destinations || [],
      outputs_count: 1,
      outputs_ready: img.processed_url ? 1 : 0,
      original_url: img.url,
      processed_url: img.processed_url,
      operations: img.processedOperations || [],
      created_at: session.created_at,
      thumbnail_url: img.url,
      output_urls: img.processed_url ? [img.processed_url] : [],
    })
  }
  className="text-slate-300 hover:text-blue-500"
>
  <Eye className="w-5 h-5" />
</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            /* GRID VIEW: Flat grid of all images */
            <div className="grid grid-cols-4 gap-4">
              {filteredImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow text-left"
                >
                  <div className="aspect-square bg-slate-100 relative">
                    <img
                      src={img.thumbnail_url}
                      className="w-full h-full object-cover"
                      alt={img.filename}
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${STATUS_CONFIG[img.status].color}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{STATUS_CONFIG[img.status].label}</span>
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {img.filename}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">
                      {img.outputs_ready}/{img.outputs_count} outputs ready
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {/* Reports Tab */}
      {activeTab === "reports" && stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-4">
                {stats.total_images}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Images</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Package className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-4">
                {stats.total_outputs}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total Outputs</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-4">
                {stats.completed}
              </p>
              <p className="text-xs text-slate-500 mt-1">Completed</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-4">
                {formatFileSize(stats.total_file_size)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total File Size</p>
            </div>
          </div>
          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Imports Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Imports — Last 7 Days
              </h3>
              <div className="h-48 flex items-end justify-between space-x-2">
                {dailyImports.map((day, idx) => {
                  const maxCount = Math.max(
                    ...dailyImports.map((d) => d.count),
                    1,
                  );
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{
                          height: `${height}%`,
                          minHeight: day.count > 0 ? "8px" : "0",
                        }}
                      />
                      <span className="text-xs text-slate-500 mt-2">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Processing Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Processing Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Processing</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {processingStatus?.processing || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${
                        ((processingStatus?.processing || 0) /
                          (stats.total_images || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Queued</span>
                  <span className="text-2xl font-bold text-amber-600">
                    {processingStatus?.queued || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-amber-500 transition-all"
                    style={{
                      width: `${
                        ((processingStatus?.queued || 0) /
                          (stats.total_images || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Failed</span>
                  <span className="text-2xl font-bold text-red-600">
                    {processingStatus?.failed || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-red-500 transition-all"
                    style={{
                      width: `${
                        ((processingStatus?.failed || 0) /
                          (stats.total_images || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="pt-4 border-t border-slate-200 text-center">
                  <p className="text-sm text-green-600 font-medium">
                    100% complete
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Operations */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Top Operations Used
              </h3>
              <div className="space-y-3">
                {topOperations.map((op) => (
                  <div key={op.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {op.name}
                      </span>
                      <span className="text-sm text-slate-600">{op.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${op.color}`}
                        style={{
                          width: `${(op.count / (topOperations[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Top Destinations */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Top Destinations
              </h3>
              <div className="space-y-4">
                {topDestinations.map((dest, idx) => (
                  <div key={dest.name} className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-700">
                      {dest.name}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {dest.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Recent Sessions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Import Sessions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 text-sm font-medium text-slate-600">
                      FILE
                    </th>
                    <th className="pb-3 text-sm font-medium text-slate-600">
                      IMPORTED ON
                    </th>
                    <th className="pb-3 text-sm font-medium text-slate-600">
                      DESTINATIONS
                    </th>
                    <th className="pb-3 text-sm font-medium text-slate-600">
                      OUTPUTS
                    </th>
                    <th className="pb-3 text-sm font-medium text-slate-600">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-4 text-sm text-slate-700">
                        {session.filename}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {new Date(session.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {session.destinations.join(" → ")}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {session.outputs}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            STATUS_CONFIG[
                              session.status as keyof typeof STATUS_CONFIG
                            ]?.color || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {STATUS_CONFIG[
                            session.status as keyof typeof STATUS_CONFIG
                          ]?.label || session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content - image outputs grid */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg">
                    {selectedImage.thumbnail_url && (
                      <img
                        src={selectedImage.original_url}
                        alt={selectedImage.filename}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedImage.filename}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedImage.dimensions} ·{" "}
                      {formatFileSize(selectedImage.file_size)} ·{" "}
                      {new Date(selectedImage.created_at).toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      {selectedImage.destinations?.map((dest) => (
                        <span
                          key={dest}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                        >
                          {dest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedImage.outputs_count}
                  </p>
                  <p className="text-sm text-slate-600">Total Outputs</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedImage.outputs_ready}
                  </p>
                  <p className="text-sm text-slate-600">Completed</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedImage.destinations?.length || 0}
                  </p>
                  <p className="text-sm text-slate-600">Destinations</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedImage.operations?.length || 0}
                  </p>
                  <p className="text-sm text-slate-600">Operations</p>
                </div>
              </div>
              {/* Output images grid */}
              {/* Output images grid */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  ALL OUTPUTS
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    selectedImage.original_url,
                    ...selectedImage.output_urls,
                  ].map((url, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-slate-100 rounded-lg border border-slate-200 p-3 flex flex-col"
                    >
                      {/* Replace the empty div with this img tag */}
                      <div className="flex-1 bg-white rounded overflow-hidden">
                        <img
                          src={url}
                          alt={`Output ${idx}`}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="mt-2">
                        <p className="text-xs text-orange-600 font-medium">
                          {idx === 0 ? "Original" : "Processed Output"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {
                            selectedImage.destinations?.[
                              idx % selectedImage.destinations.length
                            ]
                          }
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          Ready
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
