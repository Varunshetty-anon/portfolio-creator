import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from './ui/ToastProvider';
import { Button } from './ui/Button';
import { uploadApi } from '@/lib/api';
import { getCroppedImg } from '@/lib/media-utils';
import { UploadCloud, CheckCircle2, X } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string;
  onUploadComplete: (cloudinaryUrl: string) => void;
  onRemove?: () => void;
}

type Status = 'idle' | 'drag-hover' | 'cropping' | 'uploading' | 'success' | 'error';

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentPhotoUrl,
  onUploadComplete,
  onRemove,
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const [imgSrc, setImgSrc] = useState('');
  
  // Cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, or WEBP are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB');
      return;
    }
    
    // Reset crop state
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
      setStatus('cropping');
    });
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('drag-hover');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('idle');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('idle');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirmCrop = async () => {
    try {
      setStatus('uploading');
      
      if (!croppedAreaPixels) throw new Error("No crop area defined");
      
      const blob = await getCroppedImg(imgSrc, croppedAreaPixels);
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      
      const res = await uploadApi.profileImage(file);
      setStatus('success');
      toast.success('Upload complete');
      onUploadComplete(res.url);
      
      setTimeout(() => {
        setStatus('idle');
        setImgSrc('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus('idle');
      toast.error('Upload failed. Please try again.');
    }
  };

  const handleClick = () => {
    if (status === 'idle' && !currentPhotoUrl) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        onChange={onSelectFile}
      />

      {status === 'idle' || status === 'drag-hover' ? (
        <motion.div
          whileHover={{ scale: currentPhotoUrl ? 1 : 1.02 }}
          whileTap={{ scale: currentPhotoUrl ? 1 : 0.98 }}
          className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
            status === 'drag-hover'
              ? 'border-accent bg-accent/5'
              : 'border-border border-dashed bg-bg-raised/50 hover:border-border-strong hover:bg-bg-raised'
          } p-8 flex flex-col items-center justify-center min-h-[220px] cursor-pointer group`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {currentPhotoUrl ? (
            <div className="flex flex-col items-center gap-5 w-full relative z-10">
              <div className="relative group/avatar">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-bg-base shadow-xl relative z-10 bg-bg-raised">
                  <img src={currentPhotoUrl} alt="Current profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent group-hover/avatar:border-accent transition-colors duration-300 z-20 pointer-events-none" />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-xs font-medium tracking-wide">Replace</span>
                </div>
                {/* Invisible clickable overlay for the avatar itself */}
                <div 
                  className="absolute inset-0 z-30 cursor-pointer rounded-full"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" className="bg-bg-floating hover:bg-bg-base" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Upload New
                </Button>
                {onRemove && (
                  <Button variant="ghost" size="sm" className="text-text-muted hover:text-danger hover:bg-danger/10" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className={`flex flex-col items-center gap-4 transition-transform duration-300 ${status === 'drag-hover' ? 'scale-110' : ''}`}>
              <div className="w-16 h-16 rounded-full bg-bg-floating flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <UploadCloud size={28} className="text-accent" />
              </div>
              <div className="text-center">
                <p className="text-sm text-text-primary font-medium mb-1">
                  Click or drag photo here
                </p>
                <p className="text-xs text-text-muted">
                  JPEG, PNG, WEBP up to 5MB
                </p>
              </div>
            </div>
          )}
        </motion.div>
      ) : status === 'cropping' ? (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-bg-raised border border-border-strong rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-text-primary">Position & Size</h3>
                <button 
                  onClick={() => { setStatus('idle'); setImgSrc(''); }}
                  className="text-text-muted hover:text-text-primary transition-colors p-1"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative w-full h-[350px] bg-black">
                <Cropper
                  image={imgSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="p-6 bg-bg-base space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-text-muted shrink-0 w-8">Zoom</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-accent bg-border h-1 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => { setStatus('idle'); setImgSrc(''); }}>
                    Cancel
                  </Button>
                  <Button variant="accent" onClick={handleConfirmCrop}>
                    Save Photo
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      ) : status === 'uploading' || status === 'success' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative rounded-2xl border-2 border-border border-solid bg-bg-raised/50 p-8 flex flex-col items-center justify-center min-h-[220px]"
        >
          <div className="relative w-32 h-32 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: status === 'success' ? 1 : 0.9, opacity: status === 'success' ? 1 : 0.5 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 overflow-hidden rounded-full border-4 border-bg-base shadow-xl"
            >
              {imgSrc && <img src={imgSrc} alt="Preview" className="w-full h-full object-cover filter blur-[2px]" />}
            </motion.div>

            {status === 'uploading' && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-border)" strokeWidth="4" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeDasharray="301.59" strokeDashoffset="226.19" className="transition-all duration-300" />
              </svg>
            )}

            <AnimatePresence>
              {status === 'success' && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-success/20 rounded-full backdrop-blur-sm border-2 border-success"
                >
                  <CheckCircle2 size={40} className="text-success" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: status === 'uploading' ? Infinity : 0, duration: 1.5 }}
            className={`mt-6 text-sm font-medium ${status === 'success' ? 'text-success' : 'text-text-primary'}`}
          >
            {status === 'uploading' ? 'Optimizing & Uploading...' : 'Upload Successful!'}
          </motion.p>
        </motion.div>
      ) : null}
    </div>
  );
};
