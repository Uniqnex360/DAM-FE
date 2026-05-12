import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Clock, Image as ImageIcon, Loader2, Wand2 } from "lucide-react";
import { assetApi } from "../lib/api";

interface ProcessingReport {
  total_images_uploaded: number;
  total_images_processed: number;
  total_processing_time_ms: number;
  avg_processing_time_ms: number;
  operation_counts: Record<string, number>;
  daily_breakdown: {
    date: string;
    total_processed: number;
    total_uploaded: number;
    operations: Record<string, number>;
    time_ms: number;
  }[];
}

const OPERATION_LABELS: Record<string, { label: string; color: string }> = {
  bg_removal: { label: "Background Removal", color: "bg-purple-500" },
  smart_crop: { label: "Smart Crop", color: "bg-blue-500" },
  shadow_fix: { label: "Shadow Fix", color: "bg-amber-500" },
  resize: { label: "Resize", color: "bg-green-500" },
  upscale: { label: "Upscale", color: "bg-cyan-500" },
  compress: { label: "Compression", color: "bg-orange-500" },
  recolor: { label: "Recolor", color: "bg-pink-500" },
};

export function ReportsDashboard() {
  const [report, setReport] = useState<ProcessingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await assetApi.getReport();
      setReport(data);
    } catch (err) {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (!report) return null;

  const maxOpCount = Math.max(...Object.values(report.operation_counts), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Processing Reports</h2>
          <p className="text-slate-600 mt-1">Overview of all image processing operations</p>
        </div>
        <BarChart3 className="w-8 h-8 text-slate-400" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-slate-600">Total Processed</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{report.total_images_processed}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Wand2 className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-slate-600">Operations</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {Object.values(report.operation_counts).reduce((a, b) => a + b, 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-green-500" />
            <span className="text-sm text-slate-600">Total Time</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatTime(report.total_processing_time_ms)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-slate-600">Avg Time/Image</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatTime(report.avg_processing_time_ms)}
          </p>
        </div>
      </div>

      {/* Operation Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Operations Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(report.operation_counts).map(([op, count]) => {
            const config = OPERATION_LABELS[op] || { label: op, color: "bg-slate-500" };
            const percentage = Math.round((count / maxOpCount) * 100);
            return (
              <div key={op}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{config.label}</span>
                  <span className="text-sm text-slate-600">{count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${config.color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          {Object.keys(report.operation_counts).length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No operations recorded yet</p>
          )}
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Uploaded</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Processed</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {report.daily_breakdown?.slice(0, 14).map((day, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-700">{day.date}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{day.total_uploaded}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{day.total_processed}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{formatTime(day.time_ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}