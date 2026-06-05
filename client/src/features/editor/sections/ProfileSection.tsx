import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PortfolioData } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { MediaManager } from '@/components/shared/MediaManager';
import { Panel, PanelSection, ControlRow } from '@/components/ui/EditorPanels';

interface ProfileSectionProps {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
}

export default function ProfileSection({ data, onChange }: ProfileSectionProps) {
  const [showSocials, setShowSocials] = useState(false);

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

  return (
    <Panel>
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
          label="Showreel Video URL"
          placeholder="https://youtube.com/... or Vimeo link"
          value={data.showreelUrl || ''}
          onChange={(e) => handleInputChange('showreelUrl', e.target.value)}
        />
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
