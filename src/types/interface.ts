export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export interface UserCreate extends Omit<User, "id"> {
  password: string;
}

export type UserUpdate = Partial<UserCreate>;


export interface ApiErrorResponse {
  detail: string;
}
export interface ImageMetadata {
  model_3d_url?: string;
  depth_map_url?: string;
  normal_map_url?: string;
  [key: string]: unknown; 
}
export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  processing_status?: string;
  created_at?: string;
  uploadId?: string;
   exif_data?: ImageMetadata
}

export interface UploadRecord {
  id: string;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  images: ImageAsset[];
}

export interface ThreeDGeneratorPageProps {
  userId?: string;
  allUsers?: boolean;
}

export interface ThreeDGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  imageUrl: string;
  imageName: string;
  existingMetadata?: ImageMetadata;
}

export interface ThreeDResponse {
  model_url: string;
  status: string;
}

export  interface SearchFilters {
  q?: string;
  project_name?: string;
  status?: string;
  file_type?: string;
  aspect_ratio?: string;
  crop_mode?: string;
  operations?: string;
  has_output?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  limit?: number;
  offset?: number;
  user_id?: string;
  all_users?: boolean;
}

export  interface SearchResult {
  id: string;
  name: string;
  url: string;
  thumbnail_url: string;
  processed_url: string | null;
  dimensions: string | null;
  status: string;
  file_type: string;
  created_at: string;
  processing_time_ms: number | null;
  operations: string[];
  project_name: string;
  crop_mode: string | null;
  aspect_ratio: string | null;
  has_processed_output: boolean;
}

export  interface SearchResponse {
  results: SearchResult[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    pages: number;
    current_page: number;
  };
}

export  interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface SearchFilterOptions {
  statuses: FilterOption[];
  file_types: FilterOption[];
  aspect_ratios: FilterOption[];
  operations: FilterOption[];
  projects: FilterOption[];
  crop_modes: FilterOption[];
}
