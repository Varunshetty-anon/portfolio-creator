import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PortfolioData } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { MediaManager } from '@/components/shared/MediaManager';
import { Panel, PanelSection, ControlRow } from '@/components/ui/EditorPanels';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, ExternalLink, Download, Twitter, Linkedin } from 'lucide-react';

interface ProfileSectionProps {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
}

export default function ProfileSection({ data, onChange }: ProfileSectionProps) {
  const [showSocials, setShowSocials] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = data.username ? `${window.location.origin}/${data.username}` : '';

  const handleInputChange = (field: keyof PortfolioData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleSocialChange = (network: string, value: string) => {
    onChange({
      ...data,
      socials: {
        ...(data.socials || {}),
        [network]: value,
      },
    });
  };

  const handleUploadComplete = (url: string) => {
    handleInputChange('profileImageUrl', url);
  };

  const handleRemovePhoto = () => {
    handleInputChange('profileImageUrl', '');
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('portfolio-qr-code') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${data.username}-portfolio-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Panel>
      {data.isPublished && data.username && (
        <PanelSection title="Share" description="Direct link & QR">
          <div className="flex gap-5 items-center bg-[#0a0a0c] p-4 border border-white/10 rounded-lg">
            <div className="p-2 bg-white/5 border border-white/10 shrink-0">
              <QRCodeCanvas 
                id="portfolio-qr-code"
                value={shareUrl}
                size={70}
                bgColor={"transparent"}
                fgColor={"#F2F0EC"}
                level={"H"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] text-white/50 truncate mb-3 select-all">{shareUrl}</div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }} 
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors font-mono text-[9px] uppercase tracking-widest text-white flex items-center gap-2"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button 
                  onClick={handleDownloadQR}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors font-mono text-[9px] uppercase tracking-widest text-white flex items-center gap-2"
                >
                  <Download size={12} /> QR
                </button>
                <a 
                  href={`/${data.username}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-3 py-1.5 border border-white/20 hover:border-white/40 transition-colors font-mono text-[9px] uppercase tracking-widest text-white flex items-center gap-2"
                >
                  <ExternalLink size={12} /> View
                </a>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 w-full">
            <a 
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check out my creative portfolio!`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 px-3 py-2 border border-white/10 hover:border-white/30 transition-colors font-mono text-[10px] uppercase tracking-widest text-white flex justify-center items-center gap-2"
            >
              <Twitter size={14} /> X / Twitter
            </a>
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 px-3 py-2 border border-white/10 hover:border-white/30 transition-colors font-mono text-[10px] uppercase tracking-widest text-white flex justify-center items-center gap-2"
            >
              <Linkedin size={14} /> LinkedIn
            </a>
          </div>
        </PanelSection>
      )}

      <PanelSection title="Identity" description="Your core details">
        <MediaManager
          type="profile"
          currentUrl={data.profileImageUrl}
          onUploadComplete={handleUploadComplete}
          onRemove={data.profileImageUrl ? handleRemovePhoto : undefined}
        />
        <Input
          label="Name / Studio Name"
          placeholder="e.g. Jane Doe"
          value={data.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
        <Input
          label="Role / Title"
          placeholder="e.g. Lead Video Editor"
          value={data.role || ''}
          onChange={(e) => handleInputChange('role', e.target.value)}
        />
        <Textarea
          label="Bio"
          placeholder="A brief introduction..."
          value={data.bio || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
          rows={3}
          maxLength={300}
        />
      </PanelSection>

      <PanelSection title="Showreel" description="Your main hero video">
        <Input
          label="SHOWREEL VIDEO URL"
          placeholder="https://youtube.com/... or Vimeo link"
          value={data.showreelUrl || ''}
          onChange={(e) => handleInputChange('showreelUrl', e.target.value)}
        />
        <p className="font-mono text-[10px] text-white/25 mt-1 leading-snug">
          Paste a YouTube, Vimeo, or Cloudinary URL.
          This appears as the first section of your portfolio.
        </p>
        <div className="mt-4">
          <label className="block text-xs font-medium text-text-primary mb-2 uppercase tracking-wider">
            Custom Thumbnail
          </label>
          <MediaManager
            type="thumbnail"
            currentUrl={data.showreelThumbnailUrl}
            onUploadComplete={(url) => handleInputChange('showreelThumbnailUrl', url)}
            onRemove={data.showreelThumbnailUrl ? () => handleInputChange('showreelThumbnailUrl', '') : undefined}
          />
        </div>
      </PanelSection>

      <PanelSection title="Details" description="Contact and location">
        <Input
          label="Location"
          placeholder="e.g. London, UK"
          value={data.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value)}
        />
        <Input
          label="Languages"
          placeholder="e.g. English, French"
          value={data.languages || ''}
          onChange={(e) => handleInputChange('languages', e.target.value)}
        />
        <Input
          label="Contact Email"
          placeholder="hello@example.com"
          type="email"
          value={data.contactEmail || ''}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
        />
      </PanelSection>

      <PanelSection title="Availability">
        <ControlRow
          label="Open to Work"
          description="Show you're available for projects"
          control={
            <button
              type="button"
              onClick={() => handleInputChange('availability', { ...data.availability, status: !data.availability?.status })}
              className={`
                relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none
                ${data.availability?.status ? 'bg-success' : 'bg-bg-overlay border-border-strong'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${data.availability?.status ? 'translate-x-4' : 'translate-x-0'}
                `}
              />
            </button>
          }
        />
        <AnimatePresence>
          {data.availability?.status && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2"
            >
              <Input
                placeholder="Link to book (e.g. Calendly or Email)"
                value={data.availability?.link || ''}
                onChange={(e) => handleInputChange('availability', { ...data.availability, link: e.target.value })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </PanelSection>

      <PanelSection title="Social Links">
        <button
          onClick={() => setShowSocials(!showSocials)}
          className="w-full flex items-center justify-between p-3 bg-bg-raised hover:bg-bg-floating border border-border-strong rounded-lg transition-colors group"
        >
          <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Manage Links</span>
          {showSocials ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {showSocials && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex flex-col gap-3 mt-3"
            >
              <Input
                label="Instagram"
                placeholder="https://instagram.com/..."
                value={data.socials?.instagram || ''}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
              />
              <Input
                label="Twitter / X"
                placeholder="https://twitter.com/..."
                value={data.socials?.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
              />
              <Input
                label="YouTube"
                placeholder="https://youtube.com/..."
                value={data.socials?.youtube || ''}
                onChange={(e) => handleSocialChange('youtube', e.target.value)}
              />
              <Input
                label="LinkedIn"
                placeholder="https://linkedin.com/in/..."
                value={data.socials?.linkedin || ''}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </PanelSection>
    </Panel>
  );
}
