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
  SlidersHorizontal,
  X,
  Download,
} from "lucide-react";
import { assetApi } from "../lib/api";
import {
  DailyImport,
  DashboardStats,
  ProcessedImage,
  ProcessingStatus,
  RecentSession,
  TopDestination,
  TopOperation,
} from "../lib/database.types";
import {
  searchService,
  type SearchFilters,
  type SearchResult,
  type SearchResponse,
  type SearchFilterOptions,
} from "../services/searchService";
import { ImageDetailsModal } from "./ImageDetailsModal";
import { toast } from "sonner";
type ViewMode = "grid" | "list";
type Tab = "results" | "reports" | "search";
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
interface CombinedDashboardProps {
  userId?: string;
  allUsers?: boolean;
}
export function CombinedDashboard({
  userId,
  allUsers,
}: CombinedDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("results");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyImports, setDailyImports] = useState<DailyImport[]>([]);
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus | null>(null);
  const [topOperations, setTopOperations] = useState<TopOperation[]>([]);
  const [topDestinations, setTopDestinations] = useState<TopDestination[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(
    null,
  );
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [expandedSessions, setExpandedSessions] = useState<
    Record<string, boolean>
  >({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchPagination, setSearchPagination] = useState({
    total: 0,
    has_next: false,
    pages: 0,
    current_page: 1,
  });
  const [filterOptions, setFilterOptions] = useState<SearchFilterOptions>({
    statuses: [],
    file_types: [],
    aspect_ratios: [],
    operations: [],
    projects: [],
    crop_modes: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterProject, setFilterProject] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filterDestination, setFilterDestination] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([loadReportsData(), fetchSearchFilters()]);
      } catch (err) {
        console.error("Failed to initialize data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [userId, allUsers]);
  const handleDebouncedSearch = (query: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const newTimer = setTimeout(() => {
      if (query || Object.values(searchFilters).some((v) => v)) {
        handleSearch(1);
      } else if (!query && Object.values(searchFilters).every((v) => !v)) {
        setSearchResults([]);
        setSearchPagination({
          total: 0,
          has_next: false,
          pages: 0,
          current_page: 1,
        });
      }
    }, 500); 
    setDebounceTimer(newTimer);
  };
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);
  const fetchSearchFilters = async () => {
    try {
      const filters = await searchService.getFilters(userId, allUsers);
      setFilterOptions(filters);
    } catch (error) {
      console.error("Failed to fetch search filters:", error);
    }
  };
  const handleSearch = async (page = 1, skipQuery = false) => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * 50;
      const searchParams: SearchFilters = {
        q: skipQuery ? undefined : searchQuery || undefined,
        ...searchFilters,
        user_id: userId,
        all_users: allUsers,
        limit: 50,
        offset,
      };
      const response = await searchService.searchImages(searchParams);
      setSearchResults(response.results);
      setSearchPagination(response.pagination);
      if (searchQuery || Object.values(searchFilters).some((v) => v)) {
        await updateFilterOptionsBasedOnSearch(searchParams);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const updateFilterOptionsBasedOnSearch = async (
    currentParams: SearchFilters,
  ) => {
    try {
      const updatedFilters = await searchService.getFilters(userId, allUsers);
      setFilterOptions(updatedFilters);
    } catch (error) {
      console.error("Failed to update filter options:", error);
    }
  };
  const clearSearchFilters = async () => {
    setSearchFilters({});
    setSearchQuery("");
    setSearchResults([]);
    setSearchPagination({
      total: 0,
      has_next: false,
      pages: 0,
      current_page: 1,
    });
    setError(null);
    await fetchSearchFilters();
  };
  const searchByProject = async (projectName: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchService.searchByProject(
        projectName,
        userId,
        allUsers,
      );
      setSearchResults(response.results);
      setSearchPagination(response.pagination);
    } catch (error) {
      console.error("Project search error:", error);
      setError(`Failed to search project: ${projectName}`);
    } finally {
      setLoading(false);
    }
  };
  const searchByStatus = async (status: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchService.searchByStatus(
        status,
        userId,
        allUsers,
      );
      setSearchResults(response.results);
      setSearchPagination(response.pagination);
    } catch (error) {
      console.error("Status search error:", error);
      setError(`Failed to search status: ${status}`);
    } finally {
      setLoading(false);
    }
  };
  const loadReportsData = async () => {
    try {
      const [galleryData, report] = await Promise.all([
        assetApi.getGallery(userId, allUsers),
        assetApi.getReport(),
      ]);
      if (galleryData) {
        setSessions(galleryData);
        const flatImages: ProcessedImage[] = galleryData.flatMap(
          (session: any) => {
            return session.images.map((img: any) => ({
              id: img.id,
              filename: img.name,
              file_size: img.size || 0,
              dimensions:
                img.width && img.height
                  ? `${img.width}×${img.height}`
                  : "1080×1080",
              status: (function () {
                const s = session.status?.toLowerCase();
                if (s === "completed" || s === "success" || s === "done")
                  return "done";
                if (s === "uploaded" || s === "pending") return "queued";
                if (s === "failed" || s === "error") return "failed";
                if (s === "processing") return "processing";
                return "queued";
              })(),
              destinations: session.metadata?.destinations || ["Shopify"],
              outputs_count: session.images.length,
              outputs_ready: session.images.filter((i: any) => i.processed_url)
                .length,
              operations: img.processedOperations || [],
              created_at: session.created_at,
              thumbnail_url: img.url,
              original_url: img.url,
              processed_url: img.processed_url,
              output_urls: img.processed_url ? [img.processed_url] : [],
              project_name:
                session.metadata?.project_name || "Untitled Project",
            }));
          },
        );
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
      throw err;
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
  const calculateProcessingStatus = (data: ProcessedImage[]) => {
    setProcessingStatus({
      processing: data.filter((img) => img.status === "processing").length,
      queued: data.filter((img) => img.status === "queued").length,
      failed: data.filter((img) => img.status === "failed").length,
    });
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
  const handleSearchWithNewFilters = async (newFilters: SearchFilters) => {
    try {
      setLoading(true);
      setError(null);
      const searchParams: SearchFilters = {
        q: searchQuery || undefined,
        ...newFilters,
        user_id: userId,
        all_users: allUsers,
        limit: 50,
        offset: 0,
      };
      const response = await searchService.searchImages(searchParams);
      setSearchResults(response.results);
      setSearchPagination(response.pagination);
      await updateFilterOptionsBasedOnSearch(searchParams);
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
    if (filterProject !== "all" && img.project_name !== filterProject)
      return false;
    if (filterStatus !== "all" && img.status !== filterStatus) return false;
    if (
      filterDestination !== "all" &&
      !img.destinations?.includes(filterDestination)
    )
      return false;
    return true;
  });
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (loading && activeTab !== "search") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Results, Reports & Search
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            View processed images, analytics, and search your image library
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
      {/* Tab Navigation */}
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
          <button
            onClick={() => {
              setActiveTab("search");
              if (
                searchResults.length === 0 &&
                !searchQuery &&
                Object.keys(searchFilters).length === 0
              ) {
                searchService
                  .getRecentImages(20, userId, allUsers)
                  .then((response) => {
                    setSearchResults(response.results);
                    setSearchPagination(response.pagination);
                  })
                  .catch(console.error);
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "search"
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">
              {searchResults.length}
            </span>
          </button>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <span className="text-2xl">+</span>
          <span className="font-medium">Import New</span>
        </button>
      </div>
      {activeTab === "search" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-1 relative">
  <Search className={`absolute left-3 top-3 w-5 h-5 ${loading && activeTab === "search" ? "text-blue-500 animate-pulse" : "text-slate-400"}`} />
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => {
      setSearchQuery(e.target.value);
      handleDebouncedSearch(e.target.value);
    }}
    placeholder="Search by image name or project..."
    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
  {loading && activeTab === "search" && (
    <div className="absolute right-3 top-3">
      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    </div>
  )}
</div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project
                  </label>
                  <select
                    value={searchFilters.project_name || ""}
                    onChange={async (e) => {
                      const newFilters = {
                        ...searchFilters,
                        project_name: e.target.value || undefined,
                      };
                      setSearchFilters(newFilters);
                      if (
                        e.target.value ||
                        searchQuery ||
                        Object.values(newFilters).some((v) => v)
                      ) {
                        await handleSearchWithNewFilters(newFilters);
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Projects</option>
                    {filterOptions.projects.map((project) => (
                      <option key={project.value} value={project.value}>
                        {project.label} ({project.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={searchFilters.status || ""}
                    onChange={async (e) => {
                      const newFilters = {
                        ...searchFilters,
                        status: e.target.value || undefined,
                      };
                      setSearchFilters(newFilters);
                      if (
                        e.target.value ||
                        searchQuery ||
                        Object.values(newFilters).some((v) => v)
                      ) {
                        await handleSearchWithNewFilters(newFilters);
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label} ({status.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Operations
                  </label>
                  <select
                    value={searchFilters.operations || ""}
                    onChange={async (e) => {
                      const newFilters = {
                        ...searchFilters,
                        operations: e.target.value || undefined,
                      };
                      setSearchFilters(newFilters);
                      if (
                        e.target.value ||
                        searchQuery ||
                        Object.values(newFilters).some((v) => v)
                      ) {
                        await handleSearchWithNewFilters(newFilters);
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Operations</option>
                    {filterOptions.operations.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label} ({op.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearSearchFilters}
                    className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors w-full"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>
            )}
            {error && activeTab === "search" && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Search Results ({searchPagination.total})
              </h2>
              {searchPagination.total > 0 && (
                <div className="text-sm text-slate-600">
                  Page {searchPagination.current_page} of{" "}
                  {searchPagination.pages}
                </div>
              )}
            </div>
            {loading && activeTab === "search" ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  {searchQuery || Object.values(searchFilters).some((v) => v)
                    ? "No results found. Try adjusting your search."
                    : "Enter search terms or apply filters to find images."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchResults.map((image) => (
                    <div
                      key={image.id}
                      className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors cursor-pointer"
                      onClick={() =>
                        setSelectedImage({
                          id: image.id,
                          filename: image.name,
                          file_size: 0,
                          dimensions: image.dimensions || "",
                          status:
                            image.status === "completed"
                              ? "done"
                              : (image.status as any),
                          destinations: [],
                          outputs_count: image.has_processed_output ? 1 : 0,
                          outputs_ready: image.has_processed_output ? 1 : 0,
                          original_url: image.url,
                          processed_url: image.processed_url,
                          operations: image.operations || [],
                          created_at: image.created_at,
                          thumbnail_url: image.thumbnail_url,
                          output_urls: image.processed_url
                            ? [image.processed_url]
                            : [],
                        } as ProcessedImage)
                      }
                    >
                      <div className="aspect-square bg-slate-100 relative">
                        <img
                          src={image.thumbnail_url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              image.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : image.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : image.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {image.status}
                          </span>
                        </div>
                        {image.has_processed_output && (
                          <div className="absolute top-2 left-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p
                          className="text-sm font-medium text-slate-900 truncate"
                          title={image.name}
                        >
                          {image.name}
                        </p>
                        <p
                          className="text-xs text-slate-600 truncate"
                          title={image.project_name}
                        >
                          📁 {image.project_name}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">
                            {image.dimensions}
                          </span>
                          {image.operations.length > 0 && (
                            <span
                              className="text-xs text-blue-600 truncate max-w-20"
                              title={image.operations.join(", ")}
                            >
                              {image.operations.length} ops
                            </span>
                          )}
                        </div>
                        {image.aspect_ratio && (
                          <div className="mt-1">
                            <span className="text-xs text-purple-600">
                              {image.aspect_ratio}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {searchPagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                    <button
                      onClick={() =>
                        handleSearch(searchPagination.current_page - 1)
                      }
                      disabled={searchPagination.current_page === 1 || loading}
                      className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Previous</span>
                    </button>
                    <span className="text-sm text-slate-600">
                      Showing {(searchPagination.current_page - 1) * 50 + 1} to{" "}
                      {Math.min(
                        searchPagination.current_page * 50,
                        searchPagination.total,
                      )}{" "}
                      of {searchPagination.total} results
                    </span>
                    <button
                      onClick={() =>
                        handleSearch(searchPagination.current_page + 1)
                      }
                      disabled={!searchPagination.has_next || loading}
                      className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {activeTab === "results" && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
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
              <div className="flex items-center space-x-2 px-3 py-2 border border-slate-100 rounded-xl bg-white">
                <Folder className="w-4 h-4 text-slate-400" />
                <div className="relative">
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="appearance-none bg-transparent pr-8 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All projects</option>
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
            <div className="space-y-4">
              {sessions
                .filter((s) => {
                  const projectName =
                    s.metadata?.project_name || "Untitled Project";
                  return (
                    filterProject === "all" || projectName === filterProject
                  );
                })
                .map((session) => (
                  <div key={session.id} className="space-y-2">
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
                              <button
                                onClick={() =>
                                  setSelectedImage({
                                    id: img.id,
                                    filename: img.name,
                                    file_size: img.size || 0,
                                    dimensions: `${img.width}×${img.height}`,
                                    status: "done",
                                    destinations:
                                      session.metadata?.destinations || [],
                                    outputs_count: 1,
                                    outputs_ready: img.processed_url ? 1 : 0,
                                    original_url: img.url,
                                    processed_url: img.processed_url,
                                    operations: img.processedOperations || [],
                                    created_at: session.created_at,
                                    thumbnail_url: img.url,
                                    output_urls: img.processed_url
                                      ? [img.processed_url]
                                      : [],
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
  <div className="space-y-6">
    {sessions
      .filter((s) => {
        const projectName = s.metadata?.project_name || "Untitled Project";
        return filterProject === "all" || projectName === filterProject;
      })
      .map((session) => (
        <div key={session.id} className="space-y-3">
          <div className="flex items-center space-x-3">
  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
    <Folder className="w-4 h-4 text-blue-500" />
  </div>
  <h3 className="font-bold text-slate-900 text-sm">
    {session.metadata?.project_name || "Untitled Project"}
  </h3>
  <span className="text-xs text-slate-400">
    {session.images.length} images
  </span>
  {session.images.length > 1 && (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          toast.loading("Downloading ZIP...");
          await assetApi.downloadProjectZip(session.id);
          toast.dismiss();
          toast.success("ZIP downloaded");
        } catch (error) {
          toast.dismiss();
          toast.error("Failed to download ZIP");
        }
      }}
      className="flex items-center space-x-1 px-2 py-1 bg-emerald-500 text-white rounded-md text-xs font-bold hover:bg-emerald-600 transition-colors"
    >
      <Download className="w-3 h-3" />
      <span>Download as ZIP</span>
    </button>
  )}
</div>
          <div className="grid grid-cols-4 gap-4">
            {session.images.map((img: any) => (
              <button
                key={img.id}
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
                    project_name: session.metadata?.project_name || "Untitled Project",
                  })
                }
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow text-left"
              >
                <div className="aspect-square bg-slate-100 relative">
                  <img
                    src={img.url}
                    className="w-full h-full object-cover"
                    alt={img.name}
                  />
                  <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-600 border-green-200">
                    Done
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {img.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">
                    {img.processed_url ? "1/1" : "0/1"} outputs ready
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
  </div>
)}
        </>
      )}
      {activeTab === "reports" && stats && (
        <div className="space-y-6">
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
          <div className="grid grid-cols-2 gap-6">
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
          <div className="grid grid-cols-2 gap-6">
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
     <ImageDetailsModal
  selectedImage={selectedImage}
  onClose={() => setSelectedImage(null)}
/>
    </div>
  );
}
