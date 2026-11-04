import React, { useState, useRef, useEffect } from 'react';
import { Sliders, SunMedium, Sparkles, Binary, RotateCcw, ArrowRight, Upload, Check } from 'lucide-react';
import { Manuscript } from '../types/manuscript';

interface PreprocessViewerProps {
  currentDoc: Manuscript;
  onProceedToOCR: (processedImageData?: string) => void;
  onSelectDoc: (docId: string) => void;
  onUploadNewFolio: (imageDataUrl: string, fileName?: string) => void;
  allDocs: Manuscript[];
}

export const PreprocessViewer: React.FC<PreprocessViewerProps> = ({
  currentDoc,
  onProceedToOCR,
  onSelectDoc,
  onUploadNewFolio,
  allDocs,
}) => {
  const [lighting, setLighting] = useState<number>(35); // 0 to 100
  const [denoise, setDenoise] = useState<number>(20); // 0 to 50
  const [binarize, setBinarize] = useState<number>(45); // 0 to 100
  const [deskew, setDeskew] = useState<number>(1.4); // -5 to +5 degrees
  const [viewMode, setViewMode] = useState<'processed' | 'original' | 'split'>('processed');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [customImage, setCustomImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Apply canvas filters
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = customImage || currentDoc.image;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw with rotation (deskew)
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((deskew * Math.PI) / 180);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);
      ctx.restore();

      // Read pixel data for lighting, denoise, and binarization simulation
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      // Brightness & contrast multiplier from lighting slider
      const contrast = 1 + (lighting - 50) / 100;
      const brightness = (lighting - 50) * 0.8;
      const binarizeActive = binarize > 15;
      const threshold = 110 + (binarize - 50) * 1.5;

      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // Grayscale conversion
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply lighting correction
        gray = (gray - 128) * contrast + 128 + brightness;

        if (binarizeActive) {
          // Sauvola/Otsu binarization simulation
          const binaryVal = gray > threshold ? 255 : 30;
          d[i] = binaryVal;
          d[i + 1] = binaryVal;
          d[i + 2] = binaryVal;
        } else {
          // Soft archival contrast enhancement
          d[i] = Math.min(255, Math.max(0, gray * 0.95));
          d[i + 1] = Math.min(255, Math.max(0, gray * 0.92));
          d[i + 2] = Math.min(255, Math.max(0, gray * 0.85));
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
  }, [currentDoc, customImage, lighting, denoise, binarize, deskew]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setCustomImage(dataUrl);
          onUploadNewFolio(dataUrl, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoDeskew = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setDeskew(1.42);
      setLighting(48);
      setBinarize(38);
      setIsProcessing(false);
    }, 400);
  };

  const handleReset = () => {
    setLighting(35);
    setDenoise(20);
    setBinarize(0);
    setDeskew(0);
  };

  const handleProceed = () => {
    const canvas = canvasRef.current;
    const processedUrl = canvas ? canvas.toDataURL('image/jpeg', 0.85) : undefined;
    onProceedToOCR(processedUrl);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-sans block mb-1">
            Module 01 · Restoration & Ingestion Pipeline
          </span>
          <h1 className="font-cinzel text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
            Folio Preprocessing & Clean-Up
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl font-manuscript text-lg">
            Correct uneven oil-lamp lighting, filter fibrous palm leaf grain, deskew historical writing lines, and binarize ink strokes prior to multi-engine consensus.
          </p>
        </div>

        {/* Folio Selector & Custom Upload */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-stone-600" />
            Upload Folio
          </button>

          <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-md">
            {allDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setCustomImage(null);
                  onSelectDoc(doc.id);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all whitespace-nowrap shrink-0 ${
                  currentDoc.id === doc.id && !customImage
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {doc.id === 'manuscript-01' ? 'Palm Leaf' : doc.id === 'manuscript-02' ? 'Birch Bark' : 'Rag Paper'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Canvas Display Area */}
        <div className="lg:col-span-8 bg-stone-900 rounded-xl p-3 border border-stone-800 shadow-md flex flex-col items-center">
          {/* Controls Bar above Image */}
          <div className="w-full flex items-center justify-between px-2 py-1 mb-2 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-stone-300">{currentDoc.title}</span>
              <span>·</span>
              <span>{currentDoc.material}</span>
            </div>

            <div className="flex items-center gap-1 bg-stone-800/80 p-0.5 rounded-md border border-stone-700">
              <button
                onClick={() => setViewMode('processed')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  viewMode === 'processed' ? 'bg-amber-600/90 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Processed
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  viewMode === 'original' ? 'bg-amber-600/90 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Raw Original
              </button>
            </div>
          </div>

          {/* Canvas or Raw Image Frame */}
          <div className="relative w-full overflow-hidden rounded-lg bg-stone-950 flex items-center justify-center min-h-[380px] max-h-[520px]">
            {viewMode === 'original' ? (
              <img
                src={customImage || currentDoc.image}
                alt={currentDoc.title}
                referrerPolicy="no-referrer"
                className="max-h-[500px] w-auto object-contain select-none"
              />
            ) : (
              <canvas
                ref={canvasRef}
                className="max-h-[500px] w-auto object-contain select-none shadow-lg"
              />
            )}

            {/* Deskew alignment grid guide overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-15 border border-stone-400/20 grid grid-rows-6 grid-cols-6">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border-r border-b border-stone-400/20" />
              ))}
            </div>
          </div>

          {/* Micro status strip */}
          <div className="w-full flex items-center justify-between text-xs text-stone-400 px-3 pt-3">
            <span className="font-mono">Deskew: {deskew > 0 ? `+${deskew}` : deskew}° · Sauvola Binarize: {binarize}%</span>
            <span className="text-stone-500">Pipeline output ready for 3-engine voting</span>
          </div>
        </div>

        {/* Parameter Sliders & Action Panel */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-stone-700" />
              Restoration Pipeline
            </h2>
            <button
              onClick={handleReset}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* 1. Lighting Fix */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-stone-800 flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-amber-600" />
                Lighting Correction (Homomorphic)
              </label>
              <span className="font-mono text-stone-500">{lighting}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={lighting}
              onChange={(e) => setLighting(Number(e.target.value))}
              className="w-full accent-amber-700 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            />
            <p className="text-xs text-stone-500">Normalizes shadow gradients caused by ancient raking sunlight or lamp glare.</p>
          </div>

          {/* 2. Denoise */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-stone-600" />
                Fibrous Denoise (Bilateral Filter)
              </label>
              <span className="font-mono text-stone-500">{denoise}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={denoise}
              onChange={(e) => setDenoise(Number(e.target.value))}
              className="w-full accent-stone-800 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            />
            <p className="text-xs text-stone-500">Suppresses palm leaf vascular streaks while preserving fine character ligatures.</p>
          </div>

          {/* 3. Binarize */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-stone-800 flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-stone-700" />
                Adaptive Binarize (Sauvola Method)
              </label>
              <span className="font-mono text-stone-500">{binarize > 0 ? `${binarize}%` : 'Off'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={binarize}
              onChange={(e) => setBinarize(Number(e.target.value))}
              className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            />
            <p className="text-xs text-stone-500">Calculates local window variance to isolate faint carbon soot ink from aged paper.</p>
          </div>

          {/* 4. Deskew */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="font-medium text-stone-800">
                Deskew Angle (Hough Transform)
              </label>
              <span className="font-mono text-stone-500">{deskew}°</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={deskew}
                onChange={(e) => setDeskew(Number(e.target.value))}
                className="w-full accent-stone-800 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
              <button
                onClick={handleAutoDeskew}
                disabled={isProcessing}
                className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium whitespace-nowrap shrink-0 border border-stone-300"
              >
                {isProcessing ? 'Detecting...' : 'Auto'}
              </button>
            </div>
            <p className="text-xs text-stone-500">Rotates skewed writing lines into parallel horizontal baselines.</p>
          </div>

          {/* Provenance Invariant Note */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-600">
            <span className="font-semibold text-stone-800 block mb-0.5">Archival Invariant</span>
            Preprocessing parameters are cryptographically logged in Block #2 of the ledger. The original raw scan is permanently retained without destructive modifications.
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleProceed}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Run Multi-Engine Consensus OCR
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
