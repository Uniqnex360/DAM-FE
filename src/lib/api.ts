// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://dam-be.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add the Token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export interface AssetResponse {
  id: string;
  url: string;
  thumbnail_url: string;
  processing_status: string;
  name: string;
}
export interface ProcessResponse {
  status: string;
  telemetry: {
    confidence: {
      bg_clean: number;
      shadow: number;
      crop: number;
      watermark: number;
      resize: number;
    };
    steps: string[];
    time_ms: number;
  };
}
export const assetApi = {
  upload: async (file: File): Promise<AssetResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  process: async (id: string): Promise<ProcessResponse> => {
    const response = await api.post(`/assets/${id}/process`);
    return response.data;
  },
  
  // Helper for URL uploads (Proxy via backend logic if you implement it later)
  uploadFromUrl: async (url: string) => {
    // For now, we handle files. URL handling would need a specific backend endpoint
    console.warn("URL upload not fully implemented in backend yet");
    return null; 
  }
};