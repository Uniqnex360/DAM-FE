import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Download,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronRight,
  ImageIcon,
  Move,
  Check,
} from "lucide-react";
import { Room, visualizerService } from "../services/roomVisualizerApi";

interface PlacementState {
  scale: number;
  xPercent: number;
  yPercent: number;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
const BACKEND_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8002';
const API = `${BACKEND_URL}/api/v1/room-visualizer`;
export function RoomVisualizer() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string>("");
  const [wallColor, setWallColor] = useState("#FFFFFF");
  const [roomDisplayUrl, setRoomDisplayUrl] = useState("");
  const [productPreviewUrl, setProductPreviewUrl] = useState<string>("");
  const [bgLoading, setBgLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [placement, setPlacement] = useState<PlacementState>({
    scale: 0.38,
    xPercent: 50,
    yPercent: 78,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomImgRef = useRef<HTMLImageElement | null>(null);
  const cutoutImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    x: number;
    y: number;
  } | null>(null);
  const placementRef = useRef(placement);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    placementRef.current = placement;
  }, [placement]);

  useEffect(() => {
    visualizerService
      .getRooms()
      .then((data) => {
        setRooms(data);
        if (data.length > 0) setSelectedRoom(data[0]);
      })
      .catch(() => setError("Failed to load rooms."))
      .finally(() => setRoomsLoading(false));
  }, []);
  const handleColorChange = async (color: string) => {
    if (!selectedRoom) return;
    setWallColor(color);
    setBgLoading(true); // Show the spinner while backend processes the image

    try {
      const formData = new FormData();
      formData.append("room_id", selectedRoom.id);
      formData.append("hex_color", color);

      const res = await visualizerService.recolorRoom(formData);
      setRoomDisplayUrl(res.image); // This updates the state, which triggers the useEffect above
    } catch (err) {
      setError("Failed to change wall color.");
    } finally {
      setBgLoading(false);
    }
  };
  // Compute the final rendered size of the cutout given current scale and canvas
  const getCurrentFinalSize = useCallback(() => {
    const cutout = cutoutImgRef.current;
    const canvas = canvasRef.current;
    if (!cutout || !canvas) return null;
    const cw = canvas.width;
    const ch = canvas.height;
    if (cw === 0 || ch === 0) return null;
    const pw = cw * placementRef.current.scale;
    const ph = pw * (cutout.naturalHeight / cutout.naturalWidth);
    const maxPh = ch * 0.85;
    const fitScale = ph > maxPh ? maxPh / ph : 1;
    return {
      finalPw: pw * fitScale,
      finalPh: ph * fitScale,
      cw,
      ch,
    };
  }, []);

  // Clamp placement so the cutout's bounding box stays within the canvas.
  // xPercent = horizontal center of cutout (as % of canvas width)
  // yPercent = vertical bottom of cutout (as % of canvas height)
  const clampPlacement = useCallback(
    (p: PlacementState): PlacementState => {
      const size = getCurrentFinalSize();
      if (!size) return p;
      const { finalPw, finalPh, cw, ch } = size;

      const halfPwPercent = (finalPw / 2 / cw) * 100;
      const minX = Math.max(0, halfPwPercent);
      const maxX = Math.min(100, 100 - halfPwPercent);

      // yPercent is the bottom of the cutout; the top must stay >= 0
      // and the bottom must stay <= ch
      const minY = (finalPh / ch) * 100;
      const maxY = 100;

      return {
        ...p,
        xPercent: clamp(p.xPercent, minX, maxX),
        yPercent: clamp(p.yPercent, minY, maxY),
      };
    },
    [getCurrentFinalSize],
  );

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const room = roomImgRef.current;
    if (!canvas || !room) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: cw, height: ch } = canvas;
    const p = placementRef.current;

    ctx.clearRect(0, 0, cw, ch);

    const roomAspect = room.naturalWidth / room.naturalHeight;
    const canvasAspect = cw / ch;
    let sx = 0,
      sy = 0,
      sw = room.naturalWidth,
      sh = room.naturalHeight;
    if (roomAspect > canvasAspect) {
      sw = room.naturalHeight * canvasAspect;
      sx = (room.naturalWidth - sw) / 2;
    } else {
      sh = room.naturalWidth / canvasAspect;
      sy = (room.naturalHeight - sh) / 2;
    }
    ctx.drawImage(room, sx, sy, sw, sh, 0, 0, cw, ch);

    const cutout = cutoutImgRef.current;
    if (!cutout) return;

    const pw = cw * p.scale;
    const ph = pw * (cutout.naturalHeight / cutout.naturalWidth);
    const maxPh = ch * 0.85;
    const fitScale = ph > maxPh ? maxPh / ph : 1;
    const finalPw = pw * fitScale;
    const finalPh = ph * fitScale;

    // cx = horizontal center of cutout, cy = bottom of cutout
    const cx = cw * (p.xPercent / 100);
    const cy = ch * (p.yPercent / 100);
    const px = cx - finalPw / 2;
    const py = cy - finalPh;

    ctx.save();
    const shadowW = finalPw * 0.82;
    const shadowH = finalPw * 0.1;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, shadowW / 2);
    grad.addColorStop(0, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.scale(1, shadowH / (shadowW / 2));
    ctx.beginPath();
    ctx.arc(cx, cy / (shadowH / (shadowW / 2)), shadowW / 2, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    ctx.drawImage(cutout, px, py, finalPw, finalPh);
  }, []);
useEffect(() => {
  if (!selectedRoom) return;

  // 1. Determine the URL (Recolored Base64 takes priority over raw image)
  const url = roomDisplayUrl || `${BACKEND_URL}/api/v1/room-visualizer/room-image/${selectedRoom.id}`;

  // 2. Only reset placement if it's a NEW room (not just a color change)
  // We check if roomDisplayUrl is empty to know it's a fresh room load
  if (!roomDisplayUrl) {
    const next = {
      ...placementRef.current,
      yPercent: selectedRoom.floor_y,
      scale: selectedRoom.scale_hint,
    };
    setPlacement(next);
    placementRef.current = next;
  }

  // 3. Load the image into the Canvas reference
  const img = new Image();
  img.crossOrigin = "anonymous"; // Important for canvas security
  img.onload = () => {
    roomImgRef.current = img;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Ensure canvas has dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = canvas.offsetWidth || 800;
      canvas.height = canvas.offsetHeight || 600;
    }
    
    drawCanvas(); // Force a redraw with the new background
  };
  
  img.onerror = (e) => {
    console.error("Room image failed:", url, e);
    setError(`Failed to load room image`);
  };
  
  img.src = url;

// ADD roomDisplayUrl to this array so it triggers on color change!
}, [selectedRoom?.id, roomDisplayUrl, drawCanvas]); 
  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawCanvas);
    return () => cancelAnimationFrame(rafRef.current);
  }, [placement, drawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width =
      canvas.offsetWidth || canvas.parentElement?.offsetWidth || 800;
    canvas.height =
      canvas.offsetHeight || canvas.parentElement?.offsetHeight || 600;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvas.width = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
      }
      drawCanvas();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [drawCanvas]);

  const loadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, WEBP).");
        return;
      }
      setProductFile(file);
      setProductPreviewUrl(URL.createObjectURL(file));
      setCutoutUrl("");
      cutoutImgRef.current = null;
      setError("");
      setBgLoading(true);
      setStep(2);

      try {
        const cutout = await visualizerService.getCutout(file);
        setCutoutUrl(cutout);
        const img = await loadImage(cutout);
        cutoutImgRef.current = img;
        drawCanvas();
        setStep(3);
      } catch (e: any) {
        setError("Background removal failed. Try a different image.");
      } finally {
        setBgLoading(false);
      }
    },
    [drawCanvas],
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleDownload = async () => {
    if (!productFile || !selectedRoom) return;
    setDownloading(true);
    try {
      const data = await visualizerService.generatePreview(
        productFile,
        selectedRoom.id,
        placement.scale,
        placement.xPercent,
        placement.yPercent,
      );
      const a = document.createElement("a");
      a.href = data.image;
      a.download = `room-preview-${selectedRoom.id}.jpg`;
      a.click();
    } catch (e: any) {
      setError("Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setProductFile(null);
    setProductPreviewUrl("");
    setCutoutUrl("");
    cutoutImgRef.current = null;
    setError("");
    setStep(1);
    drawCanvas();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cutoutImgRef.current) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: placementRef.current.xPercent,
      y: placementRef.current.yPercent,
    };
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current || !canvasRef.current)
      return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
    const dy = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;
    const tentative = {
      ...placementRef.current,
      xPercent: dragStartRef.current.x + dx,
      yPercent: dragStartRef.current.y + dy,
    };
    const clamped = clampPlacement(tentative);
    placementRef.current = clamped;
    rafRef.current = requestAnimationFrame(drawCanvas);
  };

  const onCanvasMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setPlacement({ ...placementRef.current });
  };

  const onCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0];
    if (!cutoutImgRef.current) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: t.clientX,
      mouseY: t.clientY,
      x: placementRef.current.xPercent,
      y: placementRef.current.yPercent,
    };
  };

  const onCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t = e.touches[0];
    if (!isDraggingRef.current || !dragStartRef.current || !canvasRef.current)
      return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((t.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
    const dy = ((t.clientY - dragStartRef.current.mouseY) / rect.height) * 100;
    const tentative = {
      ...placementRef.current,
      xPercent: dragStartRef.current.x + dx,
      yPercent: dragStartRef.current.y + dy,
    };
    const clamped = clampPlacement(tentative);
    placementRef.current = clamped;
    rafRef.current = requestAnimationFrame(drawCanvas);
  };

  const onCanvasTouchEnd = () => {
    isDraggingRef.current = false;
    setPlacement({ ...placementRef.current });
  };

  const canInteract = !!cutoutUrl && !bgLoading;

  // Helper to apply a placement change and clamp based on current size
  const applyPlacementChange = useCallback(
    (patch: Partial<PlacementState>) => {
      const next: PlacementState = { ...placementRef.current, ...patch };
      const clamped = clampPlacement(next);
      placementRef.current = clamped;
      setPlacement(clamped);
    },
    [clampPlacement],
  );

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Room Visualizer
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              See any product in a real room — before buying.
            </p>
          </div>
          {canInteract && (
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Start Over
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Rendering…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mt-4">
          {(["Upload product", "Processing", "Place & Preview"] as const).map(
            (label, i) => {
              const s = (i + 1) as 1 | 2 | 3;
              const active = step === s;
              const done = step > s;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      active
                        ? "bg-slate-900 text-white"
                        : done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <Check className="w-3 h-3" /> : <span>{s}</span>}
                    {label}
                  </div>
                  {i < 2 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-148px)]">
        {/* Sidebar */}
        <div className="w-full lg:w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Upload */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Product Photo
                </h2>
                {productFile && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Change
                  </button>
                )}
              </div>

              {productPreviewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={productPreviewUrl}
                    alt="Product"
                    className="w-full object-contain max-h-40"
                    style={{
                      background:
                        "repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%) 0 0 / 14px 14px",
                    }}
                  />
                  {bgLoading && (
                    <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                      <p className="text-xs text-slate-600">
                        Removing background…
                      </p>
                    </div>
                  )}
                  {cutoutUrl && !bgLoading && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> BG removed
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-7 flex flex-col items-center gap-2 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all text-center"
                >
                  <Upload className="w-7 h-7 text-slate-400" />
                  <p className="text-sm text-slate-500">
                    Drag & drop or{" "}
                    <span className="text-slate-900 font-medium underline underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">JPG · PNG · WEBP</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && loadFile(e.target.files[0])
                }
              />
            </section>
            <section>
              <h2 className="text-xs font-bold uppercase text-slate-400 mb-2">
                3. Wall Color
              </h2>
              <div className="flex gap-2 flex-wrap">
                {[
                  "#FFFFFF",
                  "#F1F5F9",
                  "#E2E8F0",
                  "#F87171",
                  "#60A5FA",
                  "#34D399",
                  "#FBBF24",
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: wallColor === color ? "#000" : "#e2e8f0",
                    }}
                  />
                ))}
              </div>
            </section>
            {/* Room picker */}
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Room Scene
              </h2>
              {roomsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading rooms…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {rooms.map((room) => {
                    const active = selectedRoom?.id === room.id;
                    return (
                      <button
                        key={room.id}
                        onClick={() => {
  setRoomDisplayUrl("");   // Clear the old room's paint
  setWallColor("#FFFFFF");  // Reset color picker UI
  setSelectedRoom(room);
}}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all text-sm font-medium
                          ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white shadow-md"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                          }`}
                      >
                        <span className="text-xl">{room.emoji}</span>
                        <span className="text-xs leading-tight">
                          {room.label}
                        </span>
                        {active && (
                          <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {canInteract && (
              <section>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Placement
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-xs text-slate-500 flex items-center gap-1">
                        <ZoomIn className="w-3 h-3" /> Size
                      </label>
                      <span className="text-xs font-mono text-slate-700">
                        {Math.round(placement.scale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={90}
                      step={1}
                      value={Math.round(placement.scale * 100)}
                      onChange={(e) =>
                        applyPlacementChange({
                          scale: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full h-1.5 rounded-full appearance-none bg-slate-200 accent-slate-900 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-xs text-slate-500 flex items-center gap-1">
                        <Move className="w-3 h-3" /> Left ↔ Right
                      </label>
                      <span className="text-xs font-mono text-slate-700">
                        {Math.round(placement.xPercent)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(placement.xPercent)}
                      onChange={(e) =>
                        applyPlacementChange({
                          xPercent: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 rounded-full appearance-none bg-slate-200 accent-slate-900 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-xs text-slate-500 flex items-center gap-1">
                        <ZoomOut className="w-3 h-3" /> Near ↕ Far
                      </label>
                      <span className="text-xs font-mono text-slate-700">
                        {Math.round(placement.yPercent)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(placement.yPercent)}
                      onChange={(e) =>
                        applyPlacementChange({
                          yPercent: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 rounded-full appearance-none bg-slate-200 accent-slate-900 cursor-pointer"
                    />
                  </div>
                </div>
              </section>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed pb-2">
              <strong className="text-slate-500">Tip:</strong> Plain white/light
              backgrounds give the most realistic placement. Drag product
              directly on canvas or use sliders.
            </p>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col bg-slate-200 relative">
          <canvas
            ref={canvasRef}
            className={`w-full h-full block ${canInteract ? "cursor-move" : "cursor-default"}`}
            onMouseDown={onCanvasMouseDown}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onMouseLeave={onCanvasMouseUp}
            onTouchStart={onCanvasTouchStart}
            onTouchMove={onCanvasTouchMove}
            onTouchEnd={onCanvasTouchEnd}
            style={{ touchAction: "none" }}
          />

          {/* Empty state overlay */}
          {!selectedRoom && !productFile && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 pointer-events-none">
              <ImageIcon className="w-14 h-14 text-slate-300" />
              <p className="text-sm">Upload a product to get started</p>
            </div>
          )}

          {/* BG removal in progress overlay */}
          {bgLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-none">
              <Loader2 className="w-10 h-10 animate-spin text-slate-800" />
              <p className="text-sm font-medium text-slate-700">
                Removing background…
              </p>
              <p className="text-xs text-slate-500">
                This takes a few seconds, then drag is live
              </p>
            </div>
          )}

          {/* Drag hint */}
          {canInteract && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
              <Move className="w-3 h-3" /> Drag to reposition · Use sliders for
              size
            </div>
          )}
        </div>

        {/* Bottom room strip */}
        {rooms.length > 0 && (
          <div
            className="absolute bottom-0 left-72 right-0 border-t border-slate-200 bg-white px-6 py-2 flex gap-2 overflow-x-auto"
            style={{ zIndex: 10 }}
          >
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => {
  setRoomDisplayUrl("");   // Clear the old room's paint
  setWallColor("#FFFFFF");  // Reset color picker UI
  setSelectedRoom(room);
}}
                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${
                    selectedRoom?.id === room.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                <span>{room.emoji}</span>
                {room.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
