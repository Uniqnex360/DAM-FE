import { useState, useRef } from "react";
import { ThreeDGenerator } from "./ThreeDGenerator";
import { assetApi } from "../lib/api";
import { Box, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ImageAsset, ThreeDGeneratorPageProps, UploadRecord } from "../types/interface";


// ── Component ─────────────────────────────────────────────────────────────
export function ThreeDGeneratorPage({ userId, allUsers }: ThreeDGeneratorPageProps) {
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFor3D, setUploadedFor3D] = useState<ImageAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const gallery: UploadRecord[] = await assetApi.getGallery(userId, allUsers ?? false);
      const allImages: ImageAsset[] = gallery.flatMap((upload: UploadRecord) =>
        upload.images.map((img: ImageAsset) => ({
          ...img,
          uploadId: upload.id,
        }))
      );
      setImages(allImages);
      toast.success(`Loaded ${allImages.length} images`);
    } catch (error) {
      console.error("Failed to load images:", error);
      toast.error("Failed to load images");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      if (userId) {
        formData.append("user_id", userId);
      }

      // Upload image
      const uploadResponse = await assetApi.upload(formData, userId === null ? undefined : userId);
      
      if (uploadResponse.images && uploadResponse.images.length > 0) {
        const uploadedImage = uploadResponse.images[0];
        setUploadedFor3D(uploadedImage);
        toast.success("Image uploaded successfully!");
        
        // Auto-open 3D generator after short delay
        setTimeout(() => {
          setSelectedImage(uploadedImage);
          setShowModal(true);
        }, 500);
      }
    } catch (error:unknown) {
       const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate3D = (image: ImageAsset) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
    
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">3D Generator</h1>
            <p className="text-sm text-slate-500">
              Convert product images into depth maps and normal maps
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-4 flex-wrap">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          {isUploading ? "Uploading..." : "Upload & Generate 3D"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={loadImages}
          disabled={isLoading}
          className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
          {isLoading ? "Loading..." : "Load My Images"}
        </button>
      </div>

      {uploadedFor3D && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4">
          <img
            src={uploadedFor3D.url}
            alt={uploadedFor3D.name}
            className="w-20 h-20 object-contain rounded-lg border bg-white"
          />
          <div className="flex-1">
            <p className="font-bold text-green-800">{uploadedFor3D.name}</p>
            <p className="text-sm text-green-600">Ready for 3D generation</p>
          </div>
          <button
            onClick={() => {
              setSelectedImage(uploadedFor3D);
              setShowModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
          >
            Generate 3D
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-400 transition-all group"
            >
              <div className="aspect-square bg-slate-50 p-4">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {image.name}
                </p>
                <button
                  onClick={() => handleGenerate3D(image)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Box className="w-4 h-4" />
                  Generate 3D
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !isLoading && !uploadedFor3D && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Box className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            No Images Loaded
          </h3>
          <p className="text-slate-500 mb-4">
            Upload a new image or load existing images from your gallery
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </button>
            <button
              onClick={loadImages}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              <ImageIcon className="w-5 h-5" />
              Load Gallery
            </button>
          </div>
        </div>
      )}

      {showModal && selectedImage && (
        <ThreeDGenerator
          isOpen={showModal}
          onClose={handleCloseModal}
          imageId={selectedImage.id}
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
          existingMetadata={selectedImage.exif_data}
        />
      )}
    </div>
  );
}