import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { assetApi } from "../lib/api";
import { ProcessedImage } from "../lib/database.types";
import { mapToProcessedImage } from "../lib/formatters";

interface UseGalleryManagerOptions {
  userId?: string;
  allUsers?: boolean;
  filterProjectsOnly?: boolean;
  eventName?: string;
  pollInterval?: number;
}

export function useGalleryManager({
  userId,
  allUsers,
  filterProjectsOnly = false,
  eventName = "upload-complete",
  pollInterval = 10000,
}: UseGalleryManagerOptions = {}) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await assetApi.getGallery(userId, allUsers);
      let result = data || [];

      if (filterProjectsOnly) {
        result = result
          .filter((upload: any) => upload.metadata?.project_name)
          .map((upload: any) => ({
            ...upload,
            metadata: {
              ...upload.metadata,
              project_description: upload.metadata?.description,
            },
          }));
      }

      setSessions(result);
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [userId, allUsers, filterProjectsOnly]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, pollInterval);

    const handleUpdate = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        loadData();
      }, 1000);
    };

    window.addEventListener(eventName, handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener(eventName, handleUpdate);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loadData, eventName, pollInterval]);

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    try {
      await assetApi.deleteUpload(sessionId, userId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteImage = async (imageId: string, _sessionId?: string) => {
    setDeletingId(imageId);
    try {
      await assetApi.deleteImage(imageId, userId);
      setSessions((prev) =>
        prev
          .map((session) => ({
            ...session,
            images: session.images.filter((img: any) => img.id !== imageId),
          }))
          .filter((session) => session.images.length > 0)
      );
      toast.success("Image deleted successfully");
    } catch (error: any) {
      console.error("Delete image error:", error);
      toast.error(error?.message || "Failed to delete image");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadZip = async (session: any) => {
    try {
      await assetApi.downloadProjectZip(session.id);
    } catch (error) {
      console.error("Download ZIP error:", error);
      toast.error("Failed to download project ZIP");
    }
  };

  const handleImageClick = (image: any, session: any) => {
    setSelectedImage(mapToProcessedImage(image, session));
  };

  return {
    sessions,
    loading,
    deletingId,
    selectedImage,
    setSelectedImage,
    handleDeleteSession,
    handleDeleteImage,
    handleDownloadZip,
    handleImageClick,
  };
}