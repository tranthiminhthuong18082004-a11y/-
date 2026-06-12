import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, RefreshCw, AlertCircle, Image as ImageIcon, CameraOff, Sparkles, X, Keyboard } from "lucide-react";

interface CameraSelectorProps {
  onImageSelected: (base64Image: string, mimeType: string) => void;
  onTextQuerySelected?: (foodQuery: string, weight: number | null, generatedImageBase64: string) => void;
  isAnalyzing: boolean;
}

export default function CameraSelector({ onImageSelected, onTextQuerySelected, isAnalyzing }: CameraSelectorProps) {
  const [mode, setMode] = useState<"camera" | "upload" | "text">("upload");
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [isDragOver, setIsDragOver] = useState(false);

  // States for typed food and portion weight
  const [foodQuery, setFoodQuery] = useState("");
  const [weight, setWeight] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Dry render canvas image for database visual snapshot
  const generatePlateWatermark = (queryText: string, weightText: string): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, "#10b981"); // emerald-500
    gradient.addColorStop(1, "#047857"); // emerald-700
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Decorative circular plate rings
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(300, 200, 120, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(300, 200, 100, 0, Math.PI * 2);
    ctx.stroke();

    // inner filled target
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.arc(300, 200, 80, 0, Math.PI * 2);
    ctx.fill();

    // Text details
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Header label
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#a7f3d0"; // emerald-200
    ctx.fillText("NUTRISCAN AI QUERY", 300, 145);

    // Food query
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#ffffff";
    const displayQuery = queryText.length > 28 ? queryText.substring(0, 25) + "..." : queryText;
    ctx.fillText(`"${displayQuery}"`, 300, 190);

    // Weight and stamp
    ctx.font = "medium 15px sans-serif";
    ctx.fillText(weightText ? `${weightText}g serving size` : "Estimated Standard Portion", 300, 230);

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  // Load available camera devices for quick hot-switching (front/rear, external)
  useEffect(() => {
    if (mode === "camera" && !streamActive) {
      enumerateCameras();
    }
    return () => {
      stopCameraStream();
    };
  }, [mode]);

  const enumerateCameras = async () => {
    try {
      // Prompt permissions first to see all labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(cameras);
      
      if (cameras.length > 0) {
        // Find default or environment rear camera for better food snaps, or use the first
        const rearCamera = cameras.find(
          (c) => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("environment")
        );
        setSelectedDeviceId(rearCamera ? rearCamera.deviceId : cameras[0].deviceId);
        startCameraStream(rearCamera ? rearCamera.deviceId : cameras[0].deviceId);
      } else {
        setCameraError("No video cameras detected on your system.");
        setMode("upload");
      }
    } catch (err: any) {
      console.warn("Camera enumeration error:", err);
      // Give the user a standard guidance on iframe constraints
      setCameraError(
        "Could not access your camera. Make sure you enable camera permissions in your browser or switch to the Upload tab."
      );
      setMode("upload");
    }
  };

  const startCameraStream = async (deviceId: string) => {
    stopCameraStream();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (err: any) {
      console.error("Camera streaming activation error:", err);
      setCameraError("Failed to open camera stream. Try another camera device or upload a food photo instead.");
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    startCameraStream(devId);
  };

  // Capture Base64 image from standard <video> canvas projection
  const captureFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Set resolution based on actual video size to preserve aspect ratios
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas image to Base64
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const base64Data = dataUrl.split(",")[1];
        
        setImagePreview(dataUrl);
        setImageMime("image/jpeg");
        onImageSelected(base64Data, "image/jpeg");
        stopCameraStream();
      }
    }
  };

  // Convert File object to Base64 for upload tab
  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPEG, WEBP)");
      return;
    }

    const mime = file.type;
    setImageMime(mime);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(",")[1];
      setImagePreview(dataUrl);
      onImageSelected(base64Data, mime);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const clearSelection = () => {
    setImagePreview(null);
    if (mode === "camera") {
      enumerateCameras();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50">
      {/* Tab Switcher */}
      <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6">
        <button
          onClick={() => {
            setMode("camera");
            setImagePreview(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
            mode === "camera"
              ? "bg-white text-slate-800 shadow-md shadow-slate-100 rounded-xl"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="camera-tab-btn"
        >
          <Camera className="w-3.5 h-3.5" />
          Camera
        </button>
        <button
          onClick={() => {
            setMode("upload");
            stopCameraStream();
            setImagePreview(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
            mode === "upload"
              ? "bg-white text-slate-800 shadow-md shadow-slate-100 rounded-xl"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="upload-tab-btn"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
        <button
          onClick={() => {
            setMode("text");
            stopCameraStream();
            setImagePreview(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all ${
            mode === "text"
              ? "bg-white text-slate-800 shadow-md shadow-slate-100 rounded-xl"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="text-tab-btn"
        >
          <Keyboard className="w-3.5 h-3.5" />
          Type Info
        </button>
      </div>

      {imagePreview ? (
        /* Image Preview Box with Reset options */
        <div className="relative group rounded-2xl overflow-hidden aspect-video max-h-[350px] bg-slate-900 border border-slate-100 flex items-center justify-center animate-fade-in">
          <img
            src={imagePreview}
            referrerPolicy="no-referrer"
            alt="Scanned item preview"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={clearSelection}
              disabled={isAnalyzing}
              className="px-4 py-2 text-sm font-medium text-slate-800 bg-white rounded-full flex items-center gap-2 shadow hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              id="clear-photo-btn"
            >
              <X className="w-4 h-4 text-slate-500" />
              {mode === "text" ? "Type/Edit Another" : "Scan Another Photo"}
            </button>
          </div>
        </div>
      ) : mode === "camera" ? (
        /* Live Camera Feed Panel */
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-900 flex flex-col justify-between">
          {streamActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover transform scale-x-1"
              />
              
              {/* Overlay with Camera selection and capture trigger */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  {videoDevices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={handleDeviceChange}
                      className="bg-slate-900/85 backdrop-blur-sm border border-slate-800 text-white rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-500"
                      id="camera-device-select"
                    >
                      {videoDevices.map((device, idx) => (
                        <option key={device.deviceId} value={device.deviceId} className="text-slate-800 bg-white">
                          {device.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex-1" />
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={captureFrame}
                    disabled={isAnalyzing}
                    className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 transition flex items-center justify-center shadow-lg shadow-black/40 hover:scale-105 active:scale-95 duration-150"
                    title="Take Photo"
                    id="capture-shutter-btn"
                  >
                    <span className="w-10 h-10 rounded-full bg-white opacity-40 animate-pulse hidden" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-medium">Connecting to your camera feed...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-center p-6 text-slate-300">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h4 className="font-semibold text-white mb-1.5">Camera Activation Failed</h4>
              <p className="text-xs max-w-sm leading-relaxed mb-4">{cameraError}</p>
              <button
                onClick={() => setMode("upload")}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-xl text-xs transition"
                id="camera-error-fallback-btn"
              >
                Switch to File Upload
              </button>
            </div>
          )}
        </div>
      ) : mode === "upload" ? (
        /* Drag & Drop File Upload Box */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl transition-all aspect-video max-h-[300px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 cursor-pointer ${
            isDragOver ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            type="file"
            id="file-input"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-200">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-medium text-slate-800 text-sm mb-1.5">
            Click to upload, or drag & drop food image here
          </h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Supports HEIC, PNG, JPEG, and WEBP formats. Snap a photo clearly showing the entire portion.
          </p>
        </div>
      ) : (
        /* Type Food & Portion Weight Form */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!foodQuery.trim()) return;
            const generatedBase64 = generatePlateWatermark(foodQuery.trim(), weight.trim());
            setImagePreview(generatedBase64);
            onTextQuerySelected?.(foodQuery.trim(), weight ? Number(weight) : null, generatedBase64);
          }}
          className="space-y-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/35"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Food Item or meal description
            </label>
            <input
              type="text"
              required
              value={foodQuery}
              onChange={(e) => setFoodQuery(e.target.value)}
              placeholder="e.g., Avocado Toast with Poached Egg, Grilled Salmon"
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
              id="text-food-input"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between">
              <span>Portion Weight (Grams)</span>
              <span className="text-slate-400 font-normal">Optional</span>
            </label>
            <input
              type="number"
              min="1"
              max="5000"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 250 (leave blank for standard serving)"
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
              id="text-weight-input"
            />
          </div>

          <button
            type="submit"
            disabled={isAnalyzing || !foodQuery.trim()}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
            id="text-estimate-submit-btn"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sensing Nutrients...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Caloric Density
              </>
            )}
          </button>
        </form>
      )}

      {/* Guide tips */}
      <div className="mt-4 flex items-start gap-2.5 bg-slate-50 p-4 rounded-2xl">
        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-800 block mb-0.5">Scanner tips:</span>
          For accurate calorie estimation, keep the food item centered in the frame with good overhead lighting. If it's a multi-dish meal, capture the entire layout in one shot.
        </div>
      </div>
    </div>
  );
}
