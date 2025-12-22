import { api } from "../lib/api";

export interface DashboardData {
  summary: {
    totalImagesUploaded: number;
    totalImagesProcessed: number;
    failed: number;
    avgProcessingTimeMs: number;
  };
  operationCounts: Record<string, number>;
  recentOperations: {
    id: string;
    operationType: string;
    status: string;
    createdAt: string;
    processingTimeMs: number | null;
    // NEW FIELDS
    fileName: string;
    thumbnailUrl: string; 
  }[];
}

export const fetchDashboardStats = async (): Promise<DashboardData> => {
  const response = await api.get("/dashboard/overview");
  return response.data;
};