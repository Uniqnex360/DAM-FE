import { useState, useEffect } from "react";
import { Folder } from "lucide-react";
import { toast } from "sonner";
import { assetApi } from "../lib/api";
import { ImageGrid } from "./ImageGrid";
import { ImageDetailsModal } from "./ImageDetailsModal";
import { ProcessedImage } from "../lib/database.types";

interface ProjectsProps {
  userId?: string;
  allUsers?: boolean;
}

export function Projects({ userId, allUsers }: ProjectsProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);

  useEffect(() => {
    loadProjects(); 
    const interval = setInterval(loadProjects, 30000);
    
    const handleProjectUpdate = () => {
      setTimeout(() => loadProjects(), 1000);
    };
    
    window.addEventListener("project-update", handleProjectUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("project-update", handleProjectUpdate);
    };
  }, [userId, allUsers]);

  const loadProjects = async () => {
    try {
      const data = await assetApi.getGallery(userId, allUsers);
      
      
      const projectData = data
        .filter((upload: any) => upload.metadata?.project_name)
        .map((upload: any) => ({
          ...upload,
          
          metadata: {
            ...upload.metadata,
            project_description: upload.metadata?.description,
          }
        }));
      
      setProjects(projectData);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Delete project error:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleDeleteImage = async (imageId: string, projectId: string) => {
    try {
      
      setProjects((prev) =>
        prev.map((project) => ({
          ...project,
          images: project.images.filter((img) => img.id !== imageId),
        }))
      );
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Delete image error:", error);
      toast.error("Failed to delete image");
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

  const handleImageClick = (image: any, project: any) => {
    
    const processedImage: ProcessedImage = {
      id: image.id,
      filename: image.name || "Untitled Image",
      file_size: 0, 
      dimensions: image.width && image.height ? `${image.width}×${image.height}` : "Unknown",
      status: image.processing_status === "completed" ? "done" : 
              image.processing_status === "processing" ? "processing" :
              image.processing_status === "failed" ? "failed" : "queued",
      destinations: project.metadata?.destinations || [],
      outputs_count: image.processed_url ? 2 : 1,
      outputs_ready: image.processed_url ? 1 : 0,
      original_url: image.url,
      processed_url: image.processed_url,
      operations: image.applied_steps || [],
      created_at: image.created_at || project.created_at,
      thumbnail_url: image.thumbnail_url || image.url,
      output_urls: image.processed_url ? [image.processed_url] : [],
      project_name: project.metadata?.project_name || "Untitled Project",
    };

    setSelectedImage(processedImage);
  };

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
        onDeleteSession={handleDeleteProject}
        onDeleteImage={handleDeleteImage}
        onImageClick={handleImageClick}
          onDownloadSessionZip={handleDownloadProjectZip}  
        showStats={true}
        expandedByDefault={false}
      />

      <ImageDetailsModal
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}