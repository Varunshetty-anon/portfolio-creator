// ========================
// FRAMES ImageCropper Component
// ========================
// A simple modal for cropping an uploaded image before saving.

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedImg } from '@/lib/media-utils';
import { Button } from '@/components/ui/Button';

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1, // Default to square (1:1)
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Implementation note: In a real robust app you'd use react-easy-crop here.
  // For this scaffold we'll build a simplified custom cropper or rely on Cloudinary's face gravity crop.
  // We'll simulate the crop step for now, but return the original image as a blob
  // to let Cloudinary handle the precise cropping on the backend via `gravity: 'face', crop: 'fill'`.
  
  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      // Fetch the blob from the object URL
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      // In a full implementation, we'd use getCroppedImg with croppedAreaPixels
      // But Cloudinary's auto-crop is often better for profiles anyway.
      onCropComplete(blob);
    } catch (e) {
      console.error("Failed to process crop", e);
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-frames-surface border border-frames-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-frames-border">
            <h3 className="text-sm font-medium text-white">Crop Profile Photo</h3>
            <button 
              onClick={onCancel}
              className="p-1 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Cropper Area (Simplified Placeholder) */}
          <div className="relative w-full h-80 bg-black flex items-center justify-center overflow-hidden group">
            <img 
              src={imageSrc} 
              alt="Crop preview" 
              className="max-w-full max-h-full object-contain opacity-50"
              style={{ transform: `scale(${zoom})` }}
            />
            {/* Overlay to indicate crop area */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="border-2 border-white/50 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                style={{ width: '200px', height: '200px' }}
              />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
               <p className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                 Cloudinary will auto-crop to face
               </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="p-4 flex flex-col gap-4 bg-frames-surface-raised">
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-zinc-500" />
              <input 
                type="range" 
                min={1} 
                max={3} 
                step={0.1} 
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-zinc-500"
              />
              <ZoomIn size={16} className="text-zinc-500" />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onCancel} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleComplete} loading={isProcessing}>
                Save Photo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
