import { X, Save, Download, Images } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { MeasurementList } from "./MeasurementList";
import { MeasurementCanvas } from "./MeasurementCanvas";
import { Measurement } from "../lib/supabase";


interface MeasurementModalProps {
  imageUrl: string;
  imageName: string;
  existingMeasurements?:Measurement[];
  onClose: () => void;
  onSave: (measurements: Measurement[], annotatedImageUrl: string) => void;
}

export function MeasurementModal({
  imageUrl,
  imageName,
  existingMeasurements=[],
  onClose,
  onSave,
}: MeasurementModalProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>(existingMeasurements);
  const [activeTool, setActiveTool] = useState<"select" | "line" | "ruler">(
    "line"
  );
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<
    string | null
  >(null);
  useEffect(()=>{
    if(existingMeasurements && existingMeasurements.length>0)
    {
        setMeasurements(existingMeasurements)
    }
  },[existingMeasurements])
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    actual_value: string;
    label: string;
    color: string;
    point_style: "round" | "arrow" | "square" | "diamond";
    text_position: "top" | "bottom" | "left" | "right";
    line_width: number;
    font_size: number;
    pointer_width: number;
  } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMeasurementAdd = (measurement: Omit<Measurement, "id">) => {
    const newMeasurement: Measurement = {
      ...measurement,
      id: `measurement-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };
    setMeasurements([...measurements, newMeasurement]);
  };
  console.log('measurement modal called')
  const handleMeasurementUpdate = (
    id: string,
    updates: Partial<Measurement>
  ) => {
    setMeasurements(
      measurements.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const handleMeasurementDelete = (id: string) => {
    setMeasurements(measurements.filter((m) => m.id !== id));
    if (selectedMeasurementId === id) {
      setSelectedMeasurementId(null);
    }
  };

const handleSave = () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = imageSize.width;
  exportCanvas.height = imageSize.height;
  const ctx = exportCanvas.getContext('2d');
  
  if (ctx) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, imageSize.width, imageSize.height);
      
      measurements.forEach((m) => {
        // Draw line
        ctx.strokeStyle = m.color || '#000000';
        ctx.lineWidth = m.line_width || 2;
        ctx.beginPath();
        ctx.moveTo(m.start_x, m.start_y);
        ctx.lineTo(m.end_x, m.end_y);
        ctx.stroke();
        
        // Draw endpoints
        const pointerSize = m.pointer_width || 5;
        ctx.fillStyle = m.color || '#000000';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(m.start_x, m.start_y, pointerSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(m.end_x, m.end_y, pointerSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw label at correct position
        const midX = (m.start_x + m.end_x) / 2;
        const midY = (m.start_y + m.end_y) / 2;
        
        const valueText = m.actual_value || `${m.pixel_length.toFixed(1)}px`;
        const labelSuffix = m.label ? ` - ${m.label}` : '';
        const fullText = `${valueText}${labelSuffix}`;
        const lines = fullText.split('\n');
        
        const fontSize = m.font_size || 14;
        const lineHeight = fontSize + 4;
        
        let baseX = midX;
        let baseY = midY;
        
        // USE CUSTOM OFFSET IF EXISTS
        if (m.text_offset_x !== undefined && m.text_offset_y !== undefined) {
          baseX = midX + m.text_offset_x;
          baseY = midY + m.text_offset_y;
        } else {
          const offsetDistance = 20;
          switch (m.text_position) {
            case 'top':
              baseY = midY - offsetDistance;
              break;
            case 'bottom':
              baseY = midY + offsetDistance;
              break;
            case 'left':
              baseX = midX - offsetDistance;
              break;
            case 'right':
              baseX = midX + offsetDistance;
              break;
          }
        }
        
        // Adjust for multi-line centering
        baseY = baseY - ((lines.length - 1) * lineHeight) / 2;
        
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        lines.forEach((line, index) => {
          const textY = baseY + (index * lineHeight);
          
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.strokeText(line, baseX, textY);
          
          ctx.fillStyle = '#000';
          ctx.fillText(line, baseX, textY);
        });
      });
      
      const annotatedImageURL = exportCanvas.toDataURL('image/png');
      onSave(measurements, annotatedImageURL);
    };
    img.src = imageUrl;
  } else {
    onSave(measurements, imageUrl);
  }
};

const handleExport = () => {
  // Create a canvas at original image dimensions
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = imageSize.width;
  exportCanvas.height = imageSize.height;
  const ctx = exportCanvas.getContext('2d');

  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    // Draw the original image
    ctx.drawImage(img, 0, 0, imageSize.width, imageSize.height);

    // Draw all measurements
    measurements.forEach((m) => {
      // Draw line
      ctx.strokeStyle = m.color || '#000000';
      ctx.lineWidth = m.line_width || 2;
      ctx.beginPath();
      ctx.moveTo(m.start_x, m.start_y);
      ctx.lineTo(m.end_x, m.end_y);
      ctx.stroke();

      // Draw endpoints
      const pointerSize = m.pointer_width || 5;
      drawExportPoint(ctx, m.start_x, m.start_y, m.point_style, m.color || '#000000', pointerSize);
      drawExportPoint(ctx, m.end_x, m.end_y, m.point_style, m.color || '#000000', pointerSize);

      // Draw label
      const midX = (m.start_x + m.end_x) / 2;
      const midY = (m.start_y + m.end_y) / 2;

      const valueText = m.actual_value || `${m.pixel_length.toFixed(1)}px`;
      const labelSuffix = m.label ? ` - ${m.label}` : '';
      const fullText = `${valueText}${labelSuffix}`;
      const lines = fullText.split('\n');

      const fontSize = m.font_size || 14;
      const lineHeight = fontSize + 4;

      let baseX = midX;
      let baseY = midY;

      // Use custom offset if exists
      if (m.text_offset_x !== undefined && m.text_offset_y !== undefined) {
        baseX = midX + m.text_offset_x;
        baseY = midY + m.text_offset_y;
      } else {
        const offsetDistance = 20;
        switch (m.text_position) {
          case 'top':
            baseY = midY - offsetDistance;
            break;
          case 'bottom':
            baseY = midY + offsetDistance;
            break;
          case 'left':
            baseX = midX - offsetDistance;
            break;
          case 'right':
            baseX = midX + offsetDistance;
            break;
        }
      }

      // Adjust for multi-line centering
      baseY = baseY - ((lines.length - 1) * lineHeight) / 2;

      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw each line
      lines.forEach((line, index) => {
        const textY = baseY + index * lineHeight;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeText(line, baseX, textY);

        ctx.fillStyle = '#000';
        ctx.fillText(line, baseX, textY);
      });
    });

    // Get the file extension from original image name
    const originalExtension = imageName.split('.').pop()?.toLowerCase() || 'png';
    
    // Determine MIME type and extension
    let mimeType = 'image/png';
    let extension = 'png';
    
    if (originalExtension === 'jpg' || originalExtension === 'jpeg') {
      mimeType = 'image/jpeg';
      extension = 'jpg';
    } else if (originalExtension === 'webp') {
      mimeType = 'image/webp';
      extension = 'webp';
    }

    // Convert canvas to blob and download
    exportCanvas.toBlob((blob) => {
      if (!blob) {
        console.error('Could not create blob');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${imageName.replace(/\.[^/.]+$/, '')}_annotated.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, mimeType, 0.95); // 0.95 quality for JPEG
  };

  img.onerror = () => {
    console.error('Failed to load image for export');
  };

  img.src = imageUrl;
};

// Helper function to draw points in export
const drawExportPoint = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: string,
  color: string,
  size: number = 5
) => {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;

  switch (style) {
    case 'round':
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'square':
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
      ctx.strokeRect(x - size, y - size, size * 2, size * 2);
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'arrow':
      const angle = 0; 
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, size);
      ctx.lineTo(-size, size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      break;
    default:
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  }
};

  if (imageSize.width === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Line Diagram Tool
            </h2>
            <p className="text-sm text-slate-600">{imageName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save & Close
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
            <div ref={canvasContainerRef} className="flex-1 p-4 bg-slate-100">
              <MeasurementCanvas
                imageUrl={imageUrl}
                imageWidth={imageSize.width}
                imageHeight={imageSize.height}
                measurements={measurements}
                activeTool={activeTool}
                onMeasurementAdd={handleMeasurementAdd}
                onMeasurementSelect={setSelectedMeasurementId}
                onMeasurementUpdate={handleMeasurementUpdate}
                selectedMeasurementId={selectedMeasurementId}
                editingId={editingId}
                editValues={editValues}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Measurements ({measurements.length})
              </h3>
            </div>
            <MeasurementList
              measurements={measurements}
              selectedId={selectedMeasurementId}
              onSelect={setSelectedMeasurementId}
              onDelete={handleMeasurementDelete}
              onUpdate={handleMeasurementUpdate}
              editingId={editingId}
              setEditingId={setEditingId}
              editValues={editValues}
              setEditValues={setEditValues}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
