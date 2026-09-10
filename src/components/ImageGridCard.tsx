import { ExternalLink, Download, Wand2, Trash2 } from "lucide-react";
import { useOutputDimensions } from "../utils/outputDimensions";
export interface ImageGridImage {
  id: string;
  name?: string;
  url: string;
  processed_url?: string;
  width?: number;
  height?: number;
  processing_status?: string;
  applied_steps?: string[];
  operations?: string[];
  processing_time_ms?: number;
  created_at?: string;
}

export interface ImageGridSession {
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
export function ImageGridCard({
  image,
  onImageClick,
  onDownload,
  onDeleteImage,
  sessionId,
  session,
}: {
  image: ImageGridImage;
  onImageClick?: (image: ImageGridImage, session: ImageGridSession) => void;
  onDownload: (url: string, name: string) => void;
  onDeleteImage?: (imageId: string, sessionId: string) => void;
  sessionId: string;
  session: ImageGridSession;
}) {
  const displayUrl = image.processed_url || image.url;
  const isProcessed = !!image.processed_url;
  const { dimensions: outputDimensions, handleImageLoad } = useOutputDimensions(
    isProcessed ? image.processed_url : null
  );

  const displayDimensions = isProcessed
    ? outputDimensions
    : image.width && image.height
    ? `${image.width}×${image.height}`
    : null;

  return (
    <div
      className="group relative border border-slate-100 rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onImageClick?.(image, session)}
    >
      <div className="aspect-square bg-slate-100 rounded-md overflow-hidden relative mb-2">
        <img
          src={displayUrl}
          alt={image.name || "Image"}
          className="w-full h-full object-contain"
          onLoad={isProcessed ? handleImageLoad : undefined}
        />
        {isProcessed && (
          <div
            className="absolute top-2 left-2 bg-green-500/90 text-white p-1 rounded-full shadow-sm"
            title="AI Processed"
          >
            <Wand2 className="w-3 h-3" />
          </div>
        )}

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
              onDownload(displayUrl, image.name || "image");
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
                onDeleteImage(image.id, sessionId);
              }}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-700 transition-colors"
              title="Delete Image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span
          className={`text-xs font-mono truncate max-w-[80px] ${
            isProcessed ? "text-green-600 font-bold" : "text-slate-500"
          }`}
        >
          {isProcessed ? "Processed" : "Original"}
        </span>
        {displayDimensions && (
          <span className="text-[10px] text-slate-400">
            {displayDimensions}
          </span>
        )}
      </div>
    </div>
  );
}