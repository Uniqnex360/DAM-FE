import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { assetApi } from "../lib/api";
import { ImageGrid } from "./ImageGrid";
import { ImageDetailsModal } from "./ImageDetailsModal";
import { ProcessedImage } from "../lib/database.types";
interface UploadGalleryProps {
  userId?: string;
  allUsers?: boolean; 
}
export function UploadGallery({ userId, allUsers }: UploadGalleryProps) {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  useEffect(() => {
    loadUploads();
    const interval = setInterval(loadUploads, 10000);
    const handleUploadComplete = () => {
      setTimeout(() => loadUploads(), 1000);
    };
    window.addEventListener("upload-complete", handleUploadComplete);
    return () => {
      clearInterval(interval);
      window.removeEventListener("upload-complete", handleUploadComplete);
    };
  }, [userId, allUsers]);
  const loadUploads = async () => {
    try {
      const data = await assetApi.getGallery(userId, allUsers);
      setUploads(data);
    } catch (error) {
      console.error("Failed to load uploads:", error);
      toast.error("Failed to load uploads");
    } finally {
      setLoading(false);
    }
  };
 const handleDeleteSession = async (sessionId: string) => {
  setDeletingId(sessionId);
  try {
    await assetApi.deleteUpload(sessionId, userId);
    setUploads((prev) => prev.filter((u) => u.id !== sessionId));
    toast.success("Session deleted successfully");
  } catch (error: any) {
    console.error("Delete session error:", error);
    toast.error(error.message || "Failed to delete session");
  } finally {
    setDeletingId(null);
  }
};
  const handleDeleteImage = async (imageId: string, sessionId: string) => {
  setDeletingId(imageId);
  try {
    await assetApi.deleteImage(imageId, userId);
    setUploads((prev) => {
      const updated = prev
        .map((upload) => ({
          ...upload,
          images: upload.images.filter((img: any) => img.id !== imageId),
        }))
        .filter((upload) => upload.images.length > 0);
      return updated;
    });
    toast.success("Image deleted successfully");
  } catch (error: any) {
    console.error("Delete image error:", error);
    toast.error(error.message || "Failed to delete image");
  } finally {
    setDeletingId(null);
  }
};
   const handleDownloadProjectZip = async (session: any) => {
    try {
      await assetApi.downloadProjectZip(session.id);
    } catch (error) {
      console.error("Download ZIP error:", error);
      toast.error("Failed to download project ZIP");
    }
  };
 const handleImageClick = (image: any, session: any) => {
  const processedImage: ProcessedImage = {
    id: image.id,
    filename: image.name || "Untitled Image",
    file_size: image.file_size ?? 0,
    dimensions:
      image.width && image.height
        ? `${image.width}×${image.height}`
        : image.dimensions || "Unknown",
    status:
      image.processing_status === "completed"
        ? "done"
        : image.processing_status === "processing"
        ? "processing"
        : image.processing_status === "failed"
        ? "failed"
        : "queued",
    destinations: session.metadata?.destinations || image.destinations || [],
    outputs_count:
      image.output_urls?.length ??
      (image.processed_url ? 2 : 1),
    outputs_ready:
      image.outputs_ready ??
      (image.processed_url ? 1 : 0),
    original_url: image.original_url || image.url,  
    processed_url: image.processed_url || null,
    operations: image.applied_steps || [],
    created_at: image.created_at || session.created_at,
    thumbnail_url: image.thumbnail_url || image.url,
    output_urls: image.output_urls || (image.processed_url ? [image.processed_url] : []),
    project_name: session.metadata?.project_name || "Untitled Project",
  };
  setSelectedImage(processedImage);
};
  return (
    <>
    <ImageGrid
      sessions={uploads}
      loading={loading}
      emptyTitle="No uploads yet"
      emptyDescription="Upload some images to get started"
      headerTitle="Recent Projects"
      headerDescription="View your uploaded projects and their processing status"
      headerIcon={Package}
      onDeleteSession={handleDeleteSession}
      onDeleteImage={handleDeleteImage}
      onImageClick={handleImageClick}
      onDownloadSessionZip={handleDownloadProjectZip}  
      showStats={false}
      expandedByDefault={true}
      deletingId={deletingId}
    />
    <ImageDetailsModal
            selectedImage={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
          </>
  );
}
