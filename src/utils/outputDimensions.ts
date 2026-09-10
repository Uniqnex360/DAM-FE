import { useEffect, useState } from "react";

export function useOutputDimensions(processedUrl: string | null | undefined) {
  const [dimensions, setDimensions] = useState<string | null>(null);
  useEffect(() => {
    setDimensions(null);
  }, [processedUrl]);
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalHeight && img.naturalWidth) {
      setDimensions(`${img.naturalWidth}×${img.naturalHeight}`);
    }
  };
  return { dimensions, handleImageLoad };
}
