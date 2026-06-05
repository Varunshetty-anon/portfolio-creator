import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/media-utils';
import { Button } from '@/components/ui/Button';

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
  aspectRatio = 1,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleComplete = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageBlob) {
        onCropComplete(croppedImageBlob);
      } else {
        throw new Error('Failed to crop image');
      }
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
          className="bg-bg-raised border border-border-strong rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-strong">
            <h3 className="text-sm font-medium text-text-primary">Crop Photo</h3>
            <button 
              onClick={onCancel}
              className="p-1 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-bg-floating"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Cropper Area */}
          <div className="relative w-full h-80 bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
            />
          </div>
          
          {/* Controls */}
          <div className="p-4 flex flex-col gap-4 bg-bg-base">
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-text-muted" />
              <input 
                type="range" 
                min={1} 
                max={3} 
                step={0.1} 
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-border-strong rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <ZoomIn size={16} className="text-text-muted" />
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
