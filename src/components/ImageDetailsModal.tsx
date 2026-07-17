import { ProcessedImage } from "../lib/database.types";

interface ImageDetailsModalProps {
  selectedImage: ProcessedImage | null;
  onClose: () => void;
}

export function ImageDetailsModal({
  selectedImage,
  onClose,
}: ImageDetailsModalProps) {
  if (!selectedImage) return null;

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const originalUrl = selectedImage.original_url;
  const processedUrl = selectedImage.processed_url;
  
  // Only consider it a valid processed output if processed_url exists and is different from original_url
  const hasProcessedOutput = Boolean(processedUrl && processedUrl !== originalUrl);

  const destinations = selectedImage.destinations ?? [];
  const operations = selectedImage.operations ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                <img
                  src={selectedImage.thumbnail_url || originalUrl}
                  alt={selectedImage.filename}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedImage.filename}
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedImage.dimensions} ·{" "}
                  {formatFileSize(selectedImage.file_size)} ·{" "}
                  {new Date(selectedImage.created_at).toLocaleString()}
                </p>

                {destinations.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {destinations.map((dest) => (
                      <span
                        key={dest}
                        className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                      >
                        {dest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {/* Stats Summary */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4 text-center border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">1</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Input Image</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 text-center border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">
                {hasProcessedOutput ? 1 : 0}
              </p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Output Images</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 text-center border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">
                {destinations.length}
              </p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Destinations</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 text-center border border-slate-100">
              <p className="text-2xl font-bold text-slate-900">
                {operations.length}
              </p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Operations</p>
            </div>
          </div>

          {/* INPUT & OUTPUT COMPARISON */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              INPUT & OUTPUT
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* ORIGINAL INPUT */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                    INPUT (ORIGINAL)
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedImage.dimensions}
                  </span>
                </div>

                <div className="aspect-square w-full overflow-hidden rounded-lg bg-white border border-slate-200">
                  <img
                    src={originalUrl}
                    alt="Original Input"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* PROCESSED OUTPUT */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded px-2.5 py-1 text-xs font-bold ${
                    hasProcessedOutput ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                  }`}>
                    OUTPUT (PROCESSED)
                  </span>
                  {hasProcessedOutput && (
                    <span className="text-xs text-green-600 font-medium">Ready</span>
                  )}
                </div>

                <div className="aspect-square w-full overflow-hidden rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  {hasProcessedOutput ? (
                    <img
                      src={processedUrl!}
                      alt="Processed Output"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm font-medium text-slate-500">No AI processing output yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Apply operations like Background Removal or Crop to generate an output.
                      </p>
                    </div>
                  )}
                </div>

                {hasProcessedOutput && operations.length > 0 && (
                  <p className="mt-3 text-xs text-slate-600 font-medium">
                    Applied: {operations.join(", ").replace(/_/g, " ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}