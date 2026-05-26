// ========================
// FRAMES ProfileSection
// ========================
// Editor section for managing personal identity and contact info.

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { PortfolioData } from '@/types';
import { Input, TextArea } from '@/components/ui/Input';
import { ImageCropper } from '@/components/shared/ImageCropper';
import { uploadApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface ProfileSectionProps {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
}

export default function ProfileSection({ data, onChange }: ProfileSectionProps) {
  const { toast } = useToast();
  const [showSocials, setShowSocials] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropImageSrc(reader.result as string));
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropImageSrc(null);
    setIsUploading(true);
    
    try {
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const result = await uploadApi.profileImage(file);
      handleInputChange('profileImageUrl', result.url);
      toast("Profile photo updated successfully.", "success");
    } catch (err) {
      console.error("Upload failed", err);
      toast("Failed to upload profile image. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* ── Profile Image ── */}
      <section className="flex flex-col items-center sm:items-start sm:flex-row gap-8">
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 relative">
            {data.profileImageUrl ? (
              <img 
                src={data.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700 font-display text-4xl">
                {data.name?.charAt(0) || '?'}
              </div>
            )}
            
            {/* Upload Overlay */}
            <div 
              className={`absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition-opacity ${
                isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 size={24} className="text-white animate-spin" />
              ) : (
                <Camera size={24} className="text-white" />
              )}
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <div className="flex flex-col justify-center text-center sm:text-left">
          <h2 className="text-lg font-medium text-white mb-1">Profile Photo</h2>
          <p className="text-sm text-zinc-500 max-w-md">
            Upload a high-quality headshot or logo. We recommend an image at least 800x800px.
          </p>
        </div>
      </section>

      {/* ── Basic Info ── */}
      <section className="space-y-6 pt-8 border-t border-frames-border">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Identity</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Name / Studio Name"
            placeholder="e.g. Jane Doe"
            value={data.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="font-display text-lg"
          />
          <Input
            label="Role / Title"
            placeholder="e.g. Lead Video Editor"
            value={data.role || ''}
            onChange={(e) => handleInputChange('role', e.target.value)}
          />
        </div>

        <TextArea
          label="Bio"
          placeholder="A brief introduction about who you are and what you do..."
          value={data.bio || ''}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          rows={3}
          maxLength={300}
        />
        <div className="flex justify-end -mt-4">
          <span className="text-[10px] text-zinc-600">{(data.bio || '').length} / 300</span>
        </div>
      </section>

      {/* ── Contact & Location ── */}
      <section className="space-y-6 pt-8 border-t border-frames-border">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-white">Availability</h4>
              <p className="text-xs text-zinc-500 mt-0.5">Show that you are open to new projects</p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              type="button"
              onClick={() => handleInputChange('availability', { ...data.availability, status: !data.availability?.status })}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none
                ${data.availability?.status ? 'bg-green-500' : 'bg-zinc-700'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${data.availability?.status ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
          
          <AnimatePresence>
            {data.availability?.status && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <Input
                    placeholder="Link to book (e.g. Calendly or Email)"
                    value={data.availability?.link || ''}
                    onChange={(e) => handleInputChange('availability', { ...data.availability, link: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Social Links ── */}
      <section className="pt-8 border-t border-frames-border">
        <button
          onClick={() => setShowSocials(!showSocials)}
          className="w-full flex items-center justify-between p-4 bg-frames-surface hover:bg-zinc-900 border border-frames-border rounded-xl transition-colors group"
        >
          <div className="text-left">
            <h3 className="text-sm font-medium text-white group-hover:text-accent-gold transition-colors">Social Links</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Connect your external profiles</p>
          </div>
          {showSocials ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
        </button>

        <AnimatePresence>
          {showSocials && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-zinc-900/30 border border-t-0 border-frames-border rounded-b-xl space-y-4">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
