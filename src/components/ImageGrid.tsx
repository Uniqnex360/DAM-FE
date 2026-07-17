import { useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Calendar,
  ExternalLink,
  Download,
  Wand2,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface ImageGridImage {
  id: string;
  name?: string;
  url: string;
  processed_url?: string;
  width?: number;
  height?: number;
  processing_status?: string;
  applied_steps?: string[];
  processing_time_ms?: number;
  created_at?: string;
}

interface ImageGridSession {
  id: string;
  status: string;
  created_at: string;
  metadata?: {
    project_name?: string;
    description?: string;
    source?: string;
  };
  images: ImageGridImage[];
}

interface ImageGridProps {
  sessions: ImageGridSession[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  headerTitle: string;
  headerDescription: string;
  headerIcon: React.ComponentType<any>;
  onDeleteSession?: (sessionId: string) => void;
  onDeleteImage?: (imageId: string, sessionId: string) => void;
  onImageClick?: (image: ImageGridImage, session: ImageGridSession) => void;
   onDownloadSessionZip?: (session: ImageGridSession) => void;
  showStats?: boolean;
  expandedByDefault?: boolean;
}

export function ImageGrid({
  sessions,
  loading,
  emptyTitle,
  emptyDescription,
  headerTitle,
  headerDescription,
  headerIcon: HeaderIcon,
  onDeleteSession,
  onDeleteImage,
  onImageClick,
  onDownloadSessionZip,
  showStats = false,
  expandedByDefault = false,
}: ImageGridProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(
    expandedByDefault && sessions.length > 0 ? sessions[0].id : null
  );

  const handleDownload = async (url: string, fallbackName: string) => {
    try {
      let filename = fallbackName || 'image.png';
      
      if (!fallbackName) {
        try {
          const urlObj = new URL(url);
          const parts = urlObj.pathname.split("/");
          const lastPart = parts[parts.length - 1];
          if (lastPart.length > 3) filename = decodeURIComponent(lastPart);
        } catch {
          filename = "image.png";
        }
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const dotIdx = filename.lastIndexOf(".");
const finalName = dotIdx > 0
  ? `${filename.slice(0, dotIdx)}_output${filename.slice(dotIdx)}`
  : `${filename}_output`;
link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download error:", error);
      window.open(url, "_blank");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!onDeleteSession) return;
    
    toast.warning("Delete entire session?", {
      action: {
        label: "Delete",
        onClick: () => onDeleteSession(sessionId),
      },
      cancel: { label: "Cancel", onClick: () => toast.dismiss() },
      duration: Infinity,
    });
  };

  const handleDeleteImage = (imageId: string, sessionId: string) => {
    if (!onDeleteImage) return;
    
    toast.warning("Delete this image permanently?", {
      action: {
        label: "Delete",
        onClick: () => onDeleteImage(imageId, sessionId),
      },
      cancel: { label: "Cancel", onClick: () => toast.dismiss() },
      duration: Infinity,
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{headerTitle}</h2>
          <p className="text-slate-600 mt-1">{headerDescription}</p>
        </div>
        <HeaderIcon className="w-8 h-8 text-slate-400" />
      </div>

      {/* Content */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">{emptyTitle}</p>
          <p className="text-slate-500 text-sm mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const processedCount = session.images.filter(img => img.processed_url).length;
            const totalProcessingTime = session.images.reduce((sum, img) => sum + (img.processing_time_ms || 0), 0);
            
            return (
              <div
                key={session.id}
                className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Session Header */}
                <div
                  className="p-4 bg-slate-50 cursor-pointer"
                  onClick={() =>
                    setExpandedSession(
                      expandedSession === session.id ? null : session.id
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <ImageIcon className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold text-slate-900">
                            {session.metadata?.project_name || "Session"}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                              session.status
                            )}`}
                          >
                            {session.status}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {session.images.length} {session.images.length === 1 ? "image" : "images"}
                          </span>
                          {showStats && processedCount > 0 && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              {processedCount} processed
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(session.created_at).toLocaleString()}</span>
                          </div>
                          {session.metadata?.source && (
                            <span className="text-slate-500">
                              Source: {session.metadata.source}
                            </span>
                          )}
                          {showStats && totalProcessingTime > 0 && (
                            <span className="text-slate-500">
                              Processing: {(totalProcessingTime / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 font-mono">
                        {session.id.slice(0, 8)}
                      </span>
                      {onDownloadSessionZip && session.images.length > 1 && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDownloadSessionZip(session);
      }}
      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
      title="Download all images as ZIP"
    >
      <Download className="w-4 h-4" />
    </button>
  )}
                      {onDeleteSession && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Images */}
                {expandedSession === session.id && (
                  <div className="border-t border-slate-200 bg-white">
                    {session.images.length > 0 ? (
                      <div className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {session.images.map((image) => {
                            const displayUrl = image.processed_url || image.url;
                            const isProcessed = !!image.processed_url;
                            
                            return (
                              <div
                                key={image.id}
                                className="group relative border border-slate-100 rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => onImageClick?.(image, session)}
                              >
                                <div className="aspect-square bg-slate-100 rounded-md overflow-hidden relative mb-2">
                                  <img
                                    src={displayUrl}
                                    alt={image.name || "Image"}
                                    className="w-full h-full object-contain"
                                  />
                                  {isProcessed && (
                                    <div
                                      className="absolute top-2 left-2 bg-green-500/90 text-white p-1 rounded-full shadow-sm"
                                      title="AI Processed"
                                    >
                                      <Wand2 className="w-3 h-3" />
                                    </div>
                                  )}
                                  
                                  {/* Hover Actions */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(displayUrl, "_blank");
                                      }}
                                      className="p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                                      title="View Full Size"
                                    >
                                      <ExternalLink className="w-4 h-4 text-slate-700" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(displayUrl, image.name || "image");
                                      }}
                                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                      title="Download Image"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    {onDeleteImage && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteImage(image.id, session.id);
                                        }}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-700 transition-colors"
                                        title="Delete Image"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Image Info */}
                                <div className="flex items-center justify-between px-1">
                                  <span className={`text-xs font-mono truncate max-w-[80px] ${
                                    isProcessed ? 'text-green-600 font-bold' : 'text-slate-500'
                                  }`}>
                                    {isProcessed ? "Processed" : "Original"}
                                  </span>
                                  {image.width && image.height && (
                                    <span className="text-[10px] text-slate-400">
                                      {image.width}×{image.height}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600">No images in this session</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-sm text-slate-600">
          Click on a session to expand and view all images. 
          {showStats && " Green indicators show AI-processed images."}
        </p>
      </div>
    </div>
  );
}