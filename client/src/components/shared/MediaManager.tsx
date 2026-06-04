import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Image as ImageIcon, Video, Link as LinkIcon, Loader2, X, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from '../ui/ToastProvider';
import { uploadApi } from '@/lib/api';
import axios, { type AxiosProgressEvent } from 'axios';

type MediaType = 'profile' | 'thumbnail' | 'project';

interface MediaManagerProps {
  type: MediaType;
  currentUrl?: string;
  onUploadComplete: (url: string, thumbnailUrl?: string) => void;
  onRemove?: () => void;
  allowUrlInput?: boolean;
  onUrlSave?: (url: string) => void;
}

const CONSTANTS = {
  profile: { maxMB: 10, label: 'Profile Photo', icon: ImageIcon, aspect: '1:1' },
  thumbnail: { maxMB: 15, label: 'Thumbnail', icon: ImageIcon, aspect: '16:9' },
  project: { maxMB: 1000, label: 'Video Project', icon: Video, aspect: '16:9' } // Updated maxMB to 1GB for testing
};

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  type, currentUrl, onUploadComplete, onRemove, allowUrlInput, onUrlSave
}) => {
  const [status, setStatus] = useState<'idle' | 'drag-hover' | 'uploading' | 'processing' | 'success' | 'error' | 'url-mode'>('idle');
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Upload Telemetry
  const [progress, setProgress] = useState(0);
  const [speedMB, setSpeedMB] = useState(0);
  const [etaSecs, setEtaSecs] = useState(0);
  const [processStage, setProcessStage] = useState('');
  const lastTimeRef = useRef(Date.now());
  const lastLoadedRef = useRef(0);

  const config = CONSTANTS[type];
  const maxBytes = config.maxMB * 1024 * 1024;

  const handleFile = async (file: File) => {
    if (file.size > maxBytes) {
      toast.error(`File too large. Maximum size is ${config.maxMB}MB.`);
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setSpeedMB(0);
    setEtaSecs(0);
    lastTimeRef.current = Date.now();
    lastLoadedRef.current = 0;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const onProgress = (e: AxiosProgressEvent) => {
        if (!e.total) return;
        const loaded = e.loaded;
        const total = e.total;
        
        const pct = Math.round((loaded * 100) / total);
        setProgress(pct);

        const now = Date.now();
        const timeDiff = (now - lastTimeRef.current) / 1000; // seconds
        if (timeDiff > 0.5) { // update speed every 500ms
          const bytesDiff = loaded - lastLoadedRef.current;
          const mbPerSec = (bytesDiff / 1024 / 1024) / timeDiff;
          setSpeedMB(mbPerSec);
          
          const bytesRemaining = total - loaded;
          const eta = mbPerSec > 0 ? (bytesRemaining / 1024 / 1024) / mbPerSec : 0;
          setEtaSecs(eta);

          lastTimeRef.current = now;
          lastLoadedRef.current = loaded;
        }
      };

      let res;
      if (type === 'profile') {
        res = await uploadApi.profileImage(file, onProgress, controller.signal);
      } else {
        res = await uploadApi.projectMedia(file, onProgress, controller.signal);
      }
      
      // Artificial processing delay for UX (to mask cloudinary sync)
      setStatus('processing');
      setProcessStage('Processing Video...');
      await new Promise(r => setTimeout(r, 1500));
      setProcessStage('Generating Thumbnail...');
      await new Promise(r => setTimeout(r, 1500));
      setProcessStage('Optimizing Media...');
      await new Promise(r => setTimeout(r, 1500));

      setStatus('success');
      toast.success('Upload complete!');
      
      if (res.url) {
        onUploadComplete(res.url, (res as any).thumbnailUrl);
      }
      
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err: any) {
      if (axios.isCancel(err) || err.message === 'canceled') {
        toast.error('Upload cancelled.');
      } else {
        console.error(err);
        toast.error('Upload failed. Please try again.');
      }
      setStatus('error');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleUrlSubmit = () => {
    if (onUrlSave && urlInput) {
      onUrlSave(urlInput);
      setStatus('idle');
    }
  };

  const Icon = config.icon;

  if (status === 'url-mode') {
    return (
      <div className="w-full bg-bg-raised border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon size={16} className="text-accent" />
          <span className="text-sm font-medium text-text-primary">Add from URL</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="YouTube, Vimeo, or direct link..."
            className="flex-1 bg-bg-base border border-border-strong rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
          <Button size="sm" onClick={handleUrlSubmit} variant="primary">Save</Button>
          <Button size="sm" onClick={() => setStatus('idle')} variant="ghost">Cancel</Button>
        </div>
      </div>
    );
  }

  // Uploading / Processing / Error UI
  if (status === 'uploading' || status === 'processing' || status === 'error') {
    return (
      <div className="w-full bg-bg-raised border border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
        {status === 'error' ? (
          <>
            <X size={32} className="text-danger mb-3" />
            <span className="text-sm font-medium text-text-primary mb-4">Upload Failed</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <RefreshCw size={14} className="mr-2" /> Retry
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus('idle')}>Cancel</Button>
            </div>
          </>
        ) : status === 'processing' ? (
          <>
            <Loader2 size={32} className="text-accent animate-spin mb-3" />
            <span className="text-sm font-medium text-text-primary tracking-wide animate-pulse">{processStage}</span>
          </>
        ) : (
          <div className="w-full max-w-md">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-text-primary">Uploading...</span>
              <span className="text-xl font-bold tracking-tight">{progress}%</span>
            </div>
            
            <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden mb-4 border border-border-strong">
              <div 
                className="h-full bg-accent transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-xs text-text-muted mb-6 font-mono">
              <span>{speedMB.toFixed(1)} MB/s</span>
              <span>{formatTime(etaSecs)} remaining</span>
            </div>
            
            <div className="flex justify-center">
              <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger" onClick={cancelUpload}>
                Cancel Upload
              </Button>
            </div>
          </div>
        )}
        <input type="file" ref={fileInputRef} accept="video/*,image/*" className="hidden" onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        accept={type === 'profile' || type === 'thumbnail' ? "image/*" : "video/*,image/*"}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
        }}
      />

      <div 
        className={`
          relative w-full rounded-xl border-2 transition-all overflow-hidden flex flex-col items-center justify-center p-6
          ${status === 'drag-hover' ? 'border-accent bg-accent/5' : 'border-border border-dashed bg-bg-raised/50 hover:border-border-strong'}
          ${currentUrl ? 'min-h-[160px]' : 'min-h-[120px]'}
        `}
        onDragEnter={(e) => { e.preventDefault(); setStatus('drag-hover'); }}
        onDragOver={(e) => { e.preventDefault(); setStatus('drag-hover'); }}
        onDragLeave={(e) => { e.preventDefault(); setStatus('idle'); }}
        onDrop={(e) => {
          e.preventDefault();
          setStatus('idle');
          if (e.dataTransfer.files?.length > 0) handleFile(e.dataTransfer.files[0]);
        }}
      >
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 size={32} className="text-success" />
            <span className="text-sm font-medium text-success">Success!</span>
          </div>
        ) : currentUrl ? (
          <div className="w-full flex flex-col sm:flex-row items-center gap-4">
            <div className={`shrink-0 overflow-hidden bg-black border border-border-strong ${type === 'profile' ? 'w-20 h-20 rounded-full' : 'w-32 aspect-video rounded-lg'}`}>
               {type === 'project' && !currentUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                 <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <Video size={24} />
                 </div>
               ) : (
                 <img src={currentUrl} alt="" className="w-full h-full object-cover" />
               )}
            </div>
            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-sm font-medium text-text-primary mb-2">Current {config.label}</span>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Replace
                </Button>
                {allowUrlInput && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus('url-mode')}>
                    Link URL
                  </Button>
                )}
                {onRemove && (
                  <Button size="sm" variant="ghost" className="text-danger hover:text-danger hover:bg-danger/10" onClick={onRemove}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center mb-3 text-text-muted">
              <UploadCloud size={24} />
            </div>
            <p className="text-sm text-text-primary font-medium mb-1">
              Upload {config.label}
            </p>
            <p className="text-xs text-text-muted mb-4 max-w-[250px]">
              Drag & drop or click to browse. Max {config.maxMB >= 1000 ? `${(config.maxMB / 1024).toFixed(1)}GB` : `${config.maxMB}MB`}.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              {allowUrlInput && (
                <Button size="sm" variant="ghost" onClick={() => setStatus('url-mode')}>
                  Paste Link
                </Button>
              )}
            </div>
            {type === 'project' && (
              <p className="text-[10px] text-text-muted mt-4 max-w-[200px]">
                Files over 1GB? We recommend pasting a YouTube or Vimeo link instead.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
