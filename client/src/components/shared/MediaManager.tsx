import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, X, Image as ImageIcon, Video, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from '../ui/ToastProvider';
import { uploadApi } from '@/lib/api';

type MediaType = 'profile' | 'thumbnail' | 'project';

interface MediaManagerProps {
  type: MediaType;
  currentUrl?: string;
  onUploadComplete: (url: string, thumbnailUrl?: string) => void;
  onRemove?: () => void;
  // If true, allows switching to URL mode instead of direct upload
  allowUrlInput?: boolean;
  onUrlSave?: (url: string) => void;
}

const CONSTANTS = {
  profile: { maxMB: 10, label: 'Profile Photo', icon: ImageIcon, aspect: '1:1' },
  thumbnail: { maxMB: 15, label: 'Thumbnail', icon: ImageIcon, aspect: '16:9' },
  project: { maxMB: 500, label: 'Video Project', icon: Video, aspect: '16:9' }
};

export const MediaManager: React.FC<MediaManagerProps> = ({
  type,
  currentUrl,
  onUploadComplete,
  onRemove,
  allowUrlInput,
  onUrlSave
}) => {
  const [status, setStatus] = useState<'idle' | 'drag-hover' | 'uploading' | 'success' | 'url-mode'>('idle');
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const config = CONSTANTS[type];
  const maxBytes = config.maxMB * 1024 * 1024;

  const handleFile = async (file: File) => {
    if (file.size > maxBytes) {
      toast.error(`File too large. Maximum size for ${config.label} is ${config.maxMB}MB.`);
      return;
    }

    try {
      setStatus('uploading');
      let res;
      if (type === 'profile') {
        res = await uploadApi.profileImage(file);
      } else {
        res = await uploadApi.projectMedia(file);
      }
      
      setStatus('success');
      toast.success('Upload complete!');
      
      if (res.url) {
        onUploadComplete(res.url, (res as any).thumbnailUrl);
      }
      
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setStatus('idle');
      toast.error('Upload failed. Please try again.');
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
        {type === 'project' && (
          <p className="text-xs text-text-muted mt-3">
            Using external links (YouTube/Vimeo) is recommended for large videos to ensure the best playback performance.
          </p>
        )}
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
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
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
        {status === 'uploading' || status === 'success' ? (
          <div className="flex flex-col items-center gap-3">
            {status === 'uploading' ? (
              <Loader2 size={32} className="text-accent animate-spin" />
            ) : (
              <CheckCircle2 size={32} className="text-success" />
            )}
            <span className={`text-sm font-medium ${status === 'success' ? 'text-success' : 'text-text-primary'}`}>
              {status === 'uploading' ? 'Uploading...' : 'Success!'}
            </span>
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
              Drag & drop or click to browse. Max {config.maxMB}MB.
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
                Files over 500MB? We recommend pasting a YouTube or Vimeo link instead.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
