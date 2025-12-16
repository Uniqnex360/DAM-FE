import { X, Save, Download, Images } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";
import { MeasurementList } from "./MeasurementList";
import { MeasurementCanvas } from "./MeasurementCanvas";

interface Measurement {
  id: string;
  tool_type: string;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  pixel_length: number;
  actual_value: string | null;
  unit: string;
  label: string | null;
  color: string;
  point_style: "round" | "arrow" | "square" | "diamond";
  text_position: "top" | "bottom" | "left" | "right";
  line_width: number;
  font_size: number;
  pointer_width: number;
}

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
  // Create a new canvas at ORIGINAL image dimensions
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = imageSize.width;   // Original width
  exportCanvas.height = imageSize.height; // Original height
  const ctx = exportCanvas.getContext('2d');
  
  if (ctx) {
    // Load and draw the original image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw image at full size
      ctx.drawImage(img, 0, 0, imageSize.width, imageSize.height);
      
      // Draw all measurements at original coordinates (no scaling needed)
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
        
        // Start point
        ctx.beginPath();
        ctx.arc(m.start_x, m.start_y, pointerSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // End point
        ctx.beginPath();
        ctx.arc(m.end_x, m.end_y, pointerSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw label
        const midX = (m.start_x + m.end_x) / 2;
        const midY = (m.start_y + m.end_y) / 2;
        
        const text = m.actual_value
          ? `${m.actual_value}${m.label ? ` - ${m.label}` : ''}`
          : `${m.pixel_length.toFixed(1)}px${m.label ? ` - ${m.label}` : ''}`;
        
        const offsetDistance = 20;
        let textX = midX;
        let textY = midY;
        
        switch (m.text_position) {
          case 'top': textY = midY - offsetDistance; break;
          case 'bottom': textY = midY + offsetDistance; break;
          case 'left': textX = midX - offsetDistance; break;
          case 'right': textX = midX + offsetDistance; break;
        }
        
        const fontSize = m.font_size || 14;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeText(text, textX, textY);
        ctx.fillStyle = '#000';
        ctx.fillText(text, textX, textY);
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
    const exportData = {
      imageName,
      imageUrl,
      measurements: measurements.map((m) => ({
        label: m.label,
        value: m.actual_value,
        pixel_length: m.pixel_length,
        start: { x: m.start_x, y: m.start_y },
        end: { x: m.end_x, y: m.end_y },
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${imageName.replace(/\.[^/.]+$/, "")}_measurements.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
