
import { ProcessedImage } from "./database.types";

export function mapToProcessedImage(image: any, session: any = {}): ProcessedImage {
  
  let processedUrl =
    image.processed_url ||
    image.processedUrl ||
    image.result_url ||
    image.resultUrl ||
    image.output_url ||
    image.outputUrl ||
    (Array.isArray(image.output_urls) && image.output_urls[0]) ||
    (Array.isArray(image.outputUrls) && image.outputUrls[0]) ||
    null;

  
  let originalUrl =
    image.original_url ||
    image.originalUrl ||
    image.input_url ||
    image.inputUrl ||
    image.raw_url ||
    image.url ||
    null;

  const rawStatus = image.processing_status || image.status || "";
  const isDone = rawStatus === "completed" || rawStatus === "done";

  
  if (!processedUrl && isDone) {
    processedUrl = image.thumbnailUrl || image.thumbnail_url || image.url || null;
  }

  
  if (!originalUrl) {
    originalUrl = image.thumbnailUrl || image.thumbnail_url || processedUrl || "";
  }

  return {
    id: image.id,
    filename: image.name || image.fileName || "Untitled Image",
    file_size: image.file_size ?? image.fileSize ?? image.size ?? 0,
    dimensions:
      image.width && image.height
        ? `${image.width}×${image.height}`
        : image.dimensions || "Unknown",
    status: isDone
      ? "done"
      : rawStatus === "processing"
      ? "processing"
      : rawStatus === "failed"
      ? "failed"
      : "queued",
    destinations:
      session?.metadata?.destinations || session?.destinations || image.destinations || [],
    outputs_count: processedUrl ? 2 : 1,
    outputs_ready: processedUrl ? 1 : 0,
    original_url: originalUrl,
    processed_url: processedUrl,
    operations:
      image.operations ||
      (image.operationType ? [image.operationType] : []) ||
      image.applied_steps ||
      image.processed_operations ||
      session?.metadata?.operations ||
      [],
    created_at:
      image.created_at ||
      image.createdAt ||
      session?.created_at ||
      new Date().toISOString(),
    thumbnail_url: image.thumbnail_url || image.thumbnailUrl || image.url || originalUrl,
    output_urls: processedUrl ? [processedUrl] : [],
    project_name:
      session?.metadata?.project_name ||
      image.projectName ||
      image.project_name ||
      "Untitled Project",
  };
}