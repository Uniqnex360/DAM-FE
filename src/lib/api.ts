import axios from 'axios';
const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';
export const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
 getGallery: async () => {
    const response = await api.get('/assets/gallery');
    return response.data;
  },
  analyze: async (file: File): Promise<AnalysisResponse> => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
    });

    const img = new Image();
    const dims = await new Promise<{w:number, h:number}>((resolve) => {
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

process: async (id: string, operations?: string[], options: any = {},autoDetect: boolean = false  ) => {
  const { data } = await api.post(`/assets/${id}/process`, {
    operations: operations || [],
    options,
    autoDetect
  });
  return data;
},
  
  proxyUrlToFile: async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }
};