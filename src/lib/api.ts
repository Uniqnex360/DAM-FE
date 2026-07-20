import axios from 'axios';
import { ProcessingOperation } from './database.types';

const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:8002';

export const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Token being sent:', token ? 'exists' : 'missing'); 
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.log('Auth error - redirecting to login');
      
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface AnalysisResponse {
  qualityScore: number;
  productCategory: string;
  backgroundAnalysis: { type: string };
  suggestions: {
    backgroundRemoval: boolean;
    upscaling: boolean;
    cropping: boolean;
    enhancement: boolean;
    compression: boolean;
  };
  issues: { type: string; severity: string; description: string; suggestedAction: string }[];
  compliance: {
    amazon: { isCompliant: boolean; violations: string[] };
    shopify: { isCompliant: boolean; violations: string[] };
  };
}

export const assetApi = {
  upload: async (files: File[] | FormData, userId?: string, onProgress?: (pct: number) => void) => {
    const formData = files instanceof FormData ? files : (() => {
      const fd = new FormData();
      (files as File[]).forEach((file) => fd.append('files', file));
      return fd;
    })();
    
    const params = userId ? `?user_id=${userId}` : '';
      const { data } = await api.post(`/assets/upload${params}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
    return data;
  },
  
  deleteImage: async (imageId: string, userId?: string) => {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const { data } = await api.delete(`/assets/${imageId}${params}`);
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to delete image";
      throw new Error(msg);
    }
  },

  // NEW: Batch delete multiple images
  batchDeleteImages: async (imageIds: string[], userId?: string) => {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const { data } = await api.delete(`/assets/batch${params}`, {
        data: { image_ids: imageIds }
      });
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to delete images";
      throw new Error(msg);
    }
  },

  // NEW: Delete an entire upload session with all its images
  deleteUpload: async (uploadId: string, userId?: string) => {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const { data } = await api.delete(`/assets/upload/${uploadId}${params}`);
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to delete upload session";
      throw new Error(msg);
    }
  },

  // NEW: Upload a single file (for annotated images, etc.)
  uploadSingle: async (formData: FormData, userId?: string) => {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const { data } = await api.post(`/assets/upload${params}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to upload file";
      throw new Error(msg);
    }
  },
  getReport: async (userId?: string) => {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const { data } = await api.get(`/reports/processing${params}`);   
      return data;
    } catch (error) {
      console.error("Failed to fetch processing report:", error);
      throw error;
    }
  },
  generate3D: async (imageId: string) => {
  try {
    const response = await api.post(`/assets/${imageId}/generate-3d`);
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.detail || "3D generation failed";
    throw new Error(msg);
  }
},
  getGallery: async (userId?: string, allUsers?: boolean) => {
  const params = new URLSearchParams();
  if (userId) params.append('user_id', userId);
  if (allUsers) params.append('all', 'true');
  const url = `/assets/gallery${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get(url);
  return response.data;
},
  
  analyze: async (file: File): Promise<AnalysisResponse> => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
    });

    const img = new Image();
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.src = URL.createObjectURL(file);
    });

    const { data } = await api.post('/assets/analyze', {
      imageBase64: base64,
      fileName: file.name,
      fileSize: file.size,
      width: dims.w,
      height: dims.h
    });
    
    return data.analysis;
  },

  process: async (
    id: string,
    operations: ProcessingOperation[] = [],
    options: Record<string, unknown> = {},
    autoDetect: boolean = false
  ) => {
    if (!id) {
      throw new Error("Asset ID is required for processing.");
    }

    const { data } = await api.post(`/assets/${id}/process`, {
      operations,
      options,
      autoDetect,
    });

    return data;
  },
  
  proxyUrlToFile: async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  },
   downloadProjectZip: async (projectId: string) => {
    const response = await api.get(`/assets/projects/${projectId}/download-zip`, {
      responseType: "blob",
    });

    let filename = `project-${projectId}.zip`;
    const disposition = response.headers["content-disposition"];
    if (disposition) {
      const encodedMatch = disposition.match(/filename\*=utf-8''([^;]+)/i);
      if (encodedMatch?.[1]) {
        filename = decodeURIComponent(encodedMatch[1]);
      } else {
        const plainMatch = disposition.match(/filename="?([^"; ]+)"?/i);
        if (plainMatch?.[1]) {
          filename = plainMatch[1];
        }
      }
    }

    const blob = response.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};