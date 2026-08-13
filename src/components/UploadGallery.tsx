import { Package } from "lucide-react";
import { ImageGrid } from "./ImageGrid";
import { ImageDetailsModal } from "./ImageDetailsModal";
import { useGalleryManager } from "../hooks/useGalleryManager";

interface UploadGalleryProps {
  userId?: string;
  allUsers?: boolean;
}

export function UploadGallery({ userId, allUsers }: UploadGalleryProps) {
  const {
    sessions,
    loading,
    deletingId,
    selectedImage,
    setSelectedImage,
    handleDeleteSession,
    handleDeleteImage,
    handleDownloadZip,
    handleImageClick,
  } = useGalleryManager({
    userId,
    allUsers,
    eventName: "upload-complete",
    pollInterval: 10000,
  });

  return (
    <>
      <ImageGrid
        sessions={sessions}
        loading={loading}
        emptyTitle="No uploads yet"
        emptyDescription="Upload some images to get started"
        headerTitle="Recent Projects"
        headerDescription="View your uploaded projects and their processing status"
        headerIcon={Package}
        onDeleteSession={handleDeleteSession}
        onDeleteImage={handleDeleteImage}
        onImageClick={handleImageClick}
        onDownloadSessionZip={handleDownloadZip}
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