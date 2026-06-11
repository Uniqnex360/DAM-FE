import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check, ZoomIn } from "lucide-react";
import { getCroppedImg } from "../utils/cropImage";

interface ImageCropModalProps {
  imageSrc: string;
  fileName: string;
  onClose: () => void;
  aspectRatio?: string; 
   cropMode?: "free" | "preset";  
    onSave: (file: File, mode: string, ratio?: string) => void;

}

export function ImageCropModal({
  imageSrc,
  fileName,
  onClose,
  aspectRatio,
  cropMode,
  onSave,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Parse aspect ratio string to number
  const getAspectValue = useCallback(() => {
    if (!aspectRatio) return undefined;
    const [w, h] = aspectRatio.split(":").map(Number);
    return w / h;
  }, [aspectRatio]);

  const onCropComplete = useCallback((_: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        fileName
      );
onSave(croppedFile, cropMode, aspectRatio);   
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  // Get display text for aspect ratio
  const getAspectDisplayText = () => {
    if (!aspectRatio) return "Free";
    return `${aspectRatio} (Locked)`;
  };
if (!croppedAreaPixels) {
  alert("Please adjust the crop area first.");
  return;
}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-lg">Crop Image</h3>
            {aspectRatio && (
              <p className="text-xs text-blue-600 mt-0.5">
                Aspect ratio: {aspectRatio} (locked)
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="relative h-[400px] bg-slate-900">
          <Cropper
  image={imageSrc}
  crop={crop}
  zoom={zoom}
  aspect={aspectRatio ? getAspectValue() : undefined}  
  onCropChange={setCrop}
  onZoomChange={setZoom}
  onCropComplete={onCropComplete}
/>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ZoomIn className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Zoom</span>
            </div>
            <span className="text-xs text-slate-400">
              Aspect: {getAspectDisplayText()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}