import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export function ModelViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div className="w-full h-[400px] bg-slate-900 rounded-xl relative overflow-hidden">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading 3D Scene...</span>
        </div>
      }>
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          
          <Stage environment="city" intensity={0.6} contactShadow={true}>
            <Model url={modelUrl} />
          </Stage>

          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}