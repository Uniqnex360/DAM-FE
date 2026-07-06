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