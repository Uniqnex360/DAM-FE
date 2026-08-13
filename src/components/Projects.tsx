import { Folder } from "lucide-react";
import { ImageGrid } from "./ImageGrid";
import { ImageDetailsModal } from "./ImageDetailsModal";
import { useGalleryManager } from "../hooks/useGalleryManager";

interface ProjectsProps {
  userId?: string;
  allUsers?: boolean;
}

export function Projects({ userId, allUsers }: ProjectsProps) {
  const {
    sessions: projects,
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
    filterProjectsOnly: true,
    eventName: "project-update",
    pollInterval: 30000,
  });

  return (
    <>
      <ImageGrid
        sessions={projects}
        loading={loading}
        emptyTitle="No projects found"
        emptyDescription="Create your first project by uploading images with a project name"
        headerTitle="Projects"
        headerDescription="Manage your image processing projects and view their outputs"
        headerIcon={Folder}
        onDeleteSession={handleDeleteSession}
        onDeleteImage={handleDeleteImage}
        onImageClick={handleImageClick}
        onDownloadSessionZip={handleDownloadZip}
        showStats={true}
        expandedByDefault={false}
        deletingId={deletingId}
      />

      <ImageDetailsModal
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}