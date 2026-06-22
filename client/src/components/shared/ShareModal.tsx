// ========================
// FRAMES ShareModal Component
// ========================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode, Link as LinkIcon, Twitter, Linkedin } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, username }) => {
  const [copied, setCopied] = useState(false);
  const qrRef = React.useRef<HTMLCanvasElement>(null);

  const url = `${window.location.origin}/portfolio/${username}`;

  const downloadQRCode = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `frames-qr-${username}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("QR Code Downloaded");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Check out my creative portfolio built on FRAMES!')}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-bg-raised border border-border-strong shadow-2xl w-full max-w-md overflow-hidden relative rounded-none"
          >
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-display font-bold text-text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <QrCode size={16} className="text-accent" />
                  Share Portfolio
                </h3>
                <button 
                  onClick={onClose}
                  className="p-2 -mr-2 bg-transparent hover:bg-bg-floating transition-colors text-text-muted hover:text-text-primary"
                  aria-label="Close modal"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-8">
                <div className="p-6 bg-bg-base border border-border shadow-inner mb-4 flex items-center justify-center">
                  <QRCodeCanvas 
                    value={url}
                    size={192}
                    bgColor={"#050505"}
                    fgColor={"#F2F0EC"}
                    level={"H"}
                    marginSize={2}
                  />
                  <div className="hidden">
                    <QRCodeCanvas 
                      ref={qrRef}
                      value={url}
                      size={1024}
                      bgColor={"#050505"}
                      fgColor={"#F2F0EC"}
                      level={"H"}
                      marginSize={2}
                    />
                  </div>
                </div>
                <button onClick={downloadQRCode} className="flex items-center text-[10px] font-mono text-text-muted hover:text-white transition-colors tracking-widest uppercase">
                  Download QR Code
                </button>
              </div>

              {/* Link Copy */}
              <div className="mb-8">
                <label className="block text-[10px] font-display font-bold text-text-subtle uppercase tracking-[0.2em] mb-3">Direct Link</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-bg-base border border-border px-4 py-3 flex items-center gap-3 overflow-hidden">
                    <LinkIcon size={14} className="text-text-muted shrink-0" />
                    <span className="text-sm text-text-primary font-mono truncate select-all">{url}</span>
                  </div>
                  <Button onClick={copyToClipboard} variant={copied ? "primary" : "secondary"} className="shrink-0 h-[46px] rounded-none px-6">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>

              {/* Social Share */}
              <div>
                <label className="block text-[10px] font-display font-bold text-text-subtle uppercase tracking-[0.2em] mb-3">Share On</label>
                <div className="flex gap-3">
                  <button onClick={shareOnTwitter} className="flex-1 flex items-center justify-center gap-2 py-3 bg-bg-base border border-border text-text-muted hover:text-text-primary hover:border-border-strong transition-colors text-sm">
                    <Twitter size={14} /> Twitter
                  </button>
                  <button onClick={shareOnLinkedIn} className="flex-1 flex items-center justify-center gap-2 py-3 bg-bg-base border border-border text-text-muted hover:text-text-primary hover:border-border-strong transition-colors text-sm">
                    <Linkedin size={14} /> LinkedIn
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
