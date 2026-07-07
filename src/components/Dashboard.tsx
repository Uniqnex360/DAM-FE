import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  Crop,
  Eraser,
  Sparkles,
  Minimize2,
  FileImage,
  Layers
} from "lucide-react";
import { fetchDashboardStats, DashboardData } from "../services/dashboard";
import { UserSelector } from "./UserSelector";
import { useAuth } from "../contexts/AuthContext";
import { useUserSelection } from "../contexts/UserSelectionContext";

const OPERATION_ICONS: Record<string, any> = {
  "resize": Minimize2,
  "bg_removal": Eraser,
  "shadow_fix": Layers,
  "smart_crop": Crop,
  "watermark_removal": Sparkles,
  "default": FileImage
};

const OPERATION_LABELS: Record<string, string> = {
  resize: "Image Resizing",
  "bg-remove": "Background Removal",
  bg_removal: "AI Background Removal",
  shadow_fix: "Shadow Correction",
  smart_crop: "Smart Object Cropping",
  watermark_removal: "Watermark Inpainting",
};

export function Dashboard() {
  const { userRole, isImpersonating } = useAuth();
  const { selectedUserId } = useUserSelection();
  const [stats, setStats] = useState<DashboardData>({
    summary: {
      totalImagesUploaded: 0,
      totalImagesProcessed: 0,
      failed: 0,
      avgProcessingTimeMs: 0
    },
    operationCounts: {},
    recentOperations: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      let userId = undefined;
      let allUsers = false;
      
      if (userRole === "admin" && !isImpersonating) {
        if (selectedUserId === null) {
          allUsers = true;
        } else if (selectedUserId) {
          userId = selectedUserId;
        }
      }
      
      const data = await fetchDashboardStats(userId, allUsers);
      setStats(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedUserId, userRole, isImpersonating]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-50 border-green-200";
      case "processing": return "text-blue-600 bg-blue-50 border-blue-200";
      case "failed": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const sortedOperations = Object.entries(stats.operationCounts).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of your image processing activities</p>
        </div>
        <div className="flex items-center gap-3">
          <UserSelector
           
          />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="font-medium text-slate-700">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg"><ImageIcon className="w-6 h-6 text-blue-600" /></div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Uploaded</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.summary.totalImagesUploaded}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Processed</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.summary.totalImagesProcessed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg"><Clock className="w-6 h-6 text-purple-600" /></div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Avg Process Time</h3>
          <p className="text-3xl font-bold text-slate-900">{(stats.summary.avgProcessingTimeMs / 1000).toFixed(2)}s</p>
        </div>
      </div>

      {/* Operations */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Enhancements Applied</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedOperations.map(([type, count]) => {
            const Icon = OPERATION_ICONS[type] || OPERATION_ICONS["default"];
            const label = OPERATION_LABELS[type] || type.replace('_', ' ');
            return (
              <div key={type} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="p-3 bg-white rounded-lg border border-slate-200"><Icon className="w-5 h-5 text-slate-700" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h2>
        <div className="space-y-3">
          {stats.recentOperations.map((op) => (
            <div key={op.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0">
                  <img 
                    src={op.thumbnailUrl} 
                    alt={op.fileName} 
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=IMG' }} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{op.fileName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {op.operationType.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">{new Date(op.createdAt).toLocaleString()}</p>
                  {op.processingTimeMs && (
                    <p className="text-xs font-medium text-slate-600">{(op.processingTimeMs / 1000).toFixed(2)}s</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(op.status)}`}>
                  {op.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}