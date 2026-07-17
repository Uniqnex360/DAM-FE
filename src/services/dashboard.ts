import { api } from "../lib/api";

export interface DashboardData {
  summary: {
    totalImagesUploaded: number;
    totalImagesProcessed: number;
    failed: number;
     pending: number;
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

export const fetchDashboardStats = async (userId?: string, allUsers?: boolean): Promise<DashboardData> => {
  let url = '/dashboard/overview';
  const params = new URLSearchParams();
  if (userId) params.append('user_id', userId);
  if (allUsers) params.append('all', 'true');
  if (params.toString()) url += `?${params.toString()}`;
  const response = await api.get(url);
  return response.data;
};