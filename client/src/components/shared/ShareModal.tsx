// ========================
// FRAMES ShareModal Component
// ========================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode, Link as LinkIcon, Twitter, Linkedin } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, username }) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const url = `${window.location.origin}/portfolio/${username}`;

  useEffect(() => {
    if (isOpen && username) {
      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#FFFFFF',
          light: '#00000000', // Transparent
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('QR code generation failed', err);
      });
    }
  }, [isOpen, username, url]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <QrCode size={20} className="text-accent-gold" />
                  Share Portfolio
                </h3>
                <button 
                  onClick={onClose}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Portfolio QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-zinc-900/50 rounded-xl">
                      <QrCode size={48} className="text-zinc-600 opacity-50" />
                    </div>
                  )}
                </div>
              </div>

              {/* Link Copy */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Direct Link</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/50 border border-zinc-800 rounded-lg px-3 py-2.5 flex items-center gap-2 overflow-hidden">
                    <LinkIcon size={14} className="text-zinc-500 shrink-0" />
                    <span className="text-sm text-zinc-300 font-mono truncate select-all">{url}</span>
                  </div>
                  <Button onClick={copyToClipboard} variant={copied ? "primary" : "secondary"} className="shrink-0">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>

              {/* Social Share */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Share On</label>
                <div className="flex gap-3">
                  <button onClick={shareOnTwitter} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors font-medium text-sm">
                    <Twitter size={16} /> Twitter
                  </button>
                  <button onClick={shareOnLinkedIn} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors font-medium text-sm">
                    <Linkedin size={16} /> LinkedIn
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
