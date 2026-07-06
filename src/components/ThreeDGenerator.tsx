import { useState, Suspense } from "react";
import { Dialog } from "@headlessui/react";
import { X, Box, Download, Loader2, Rotate3d } from "lucide-react";
import { toast } from "sonner";
import { assetApi } from "../lib/api";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { ThreeDGeneratorProps, ThreeDResponse } from "../types/interface";



function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export function ThreeDGenerator({ 
  isOpen, 
  onClose, 
  imageId, 
  imageUrl, 
  imageName, 
  existingMetadata 
}: ThreeDGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(existingMetadata?.model_3d_url || null);

  const handleGenerate3D = async () => {
    setIsGenerating(true);
    try {
      const response: ThreeDResponse = await assetApi.generate3D(imageId);
      setModelUrl(response.model_url);
      toast.success("Full 3D model generated successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "3D generation failed";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!modelUrl) return;
    try {
      const response = await fetch(modelUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${imageName.split('.')[0]}_3d.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("3D Model downloaded successfully!");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <Rotate3d className="w-6 h-6" />
              <Dialog.Title className="text-xl font-bold">Interactive 3D Viewer</Dialog.Title>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border">
              <img src={imageUrl} alt={imageName} className="w-16 h-16 object-contain rounded-lg border bg-white" />
              <div>
                <p className="font-bold text-slate-800">{imageName}</p>
                <p className="text-xs text-slate-500">Full 360° AI Mesh Reconstruction</p>
              </div>
              {!modelUrl && !isGenerating && (
                <button
                  onClick={handleGenerate3D}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md"
                >
                  <Box className="w-5 h-5" />
                  Generate 3D Model
                </button>
              )}
            </div>

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border border-dashed">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-lg font-bold text-slate-700">Reconstructing 3D Geometry...</p>
                <p className="text-sm text-slate-500 mt-1">AI is building the back and sides of the object (takes ~15 sec)</p>
              </div>
            )}

            {modelUrl && !isGenerating && (
              <div className="grid md:grid-cols-3 gap-6 flex-1">
                <div className="md:col-span-2 bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-800 h-[450px] relative">
                  <Suspense fallback={
                    <div className="absolute inset-0 flex items-center justify-center text-white gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" /> Loading 3D Model...
                    </div>
                  }>
                    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 45 }}>
                      <Stage environment="city" intensity={0.6} adjustCamera={true}>
                        <GLBModel url={modelUrl} />
                      </Stage>
                      <OrbitControls makeDefault />
                    </Canvas>
                  </Suspense>
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-sm pointer-events-none">
                    Left Click: Rotate • Scroll: Zoom • Right Click: Pan
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <h4 className="font-bold text-blue-900 text-sm mb-1">True 3D Mesh (.GLB)</h4>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        This is a complete 3D model generated by AI. You can rotate it to inspect all sides and export it for AR, gaming, or web design.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download .GLB File
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}