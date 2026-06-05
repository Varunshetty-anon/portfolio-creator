import React from 'react';
import { Mail, MapPin, Globe } from 'lucide-react';
import type { PortfolioData } from '@/types';
import { BrandLogo } from '@/components/shared/BrandLogo';

// Social icon mapping
import { 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  MessageCircle 
} from 'lucide-react';

const socialIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram size={18} />,
  linkedin: <Linkedin size={18} />,
  twitter: <Twitter size={18} />,
  youtube: <Youtube size={18} />,
  discord: <MessageCircle size={18} />,
};

interface ProfileSidebarProps {
  data: PortfolioData;
  isPreviewMode?: boolean;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ data, isPreviewMode }) => {
  const {
    name,
    role,
    bio,
    location,
    languages,
    contactEmail,
    profileImageUrl,
    availability,
    socials,
  } = data;

  const validSocials = Object.entries(socials || {}).filter(
    ([key, value]) => key !== 'email' && value
  ) as [string, string][];

  return (
    <aside className={`
      w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 bg-bg-base lg:bg-transparent
      ${!isPreviewMode ? 'lg:fixed lg:h-screen lg:overflow-y-auto custom-scrollbar' : 'lg:h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar'}
      border-b lg:border-b-0 lg:border-r border-border z-10
    `}>
      <div className="p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col min-h-full">
        
        {/* Profile Image & Status */}
        <div className="mb-8">
          <div className="relative inline-block">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={name} 
                className="w-28 h-28 sm:w-36 sm:h-36 object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 bg-bg-raised border border-border flex items-center justify-center">
                <span className="text-4xl text-text-muted font-display uppercase">{name?.charAt(0) || '?'}</span>
              </div>
            )}
            
            {/* Availability Badge */}
            {availability?.status && (
              <div className="absolute -bottom-3 -right-3 flex items-center gap-2 bg-bg-base border border-border px-3 py-1.5 shadow-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="text-[10px] font-display font-bold tracking-widest uppercase text-text-primary">Available</span>
              </div>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-text-primary leading-[1.1] mb-3">
            {name || 'Your Name'}
          </h1>
          <h2 className="text-xs font-display font-bold tracking-[0.2em] uppercase text-text-muted">
            {role || 'Your Role'}
          </h2>
        </div>

        {/* Bio */}
        {bio && (
          <div className="mb-8">
            <p className="text-sm leading-relaxed text-text-muted whitespace-pre-wrap">
              {bio}
            </p>
          </div>
        )}

        <hr className="border-t border-border w-12 mb-8" />

        {/* Meta Details */}
        <div className="space-y-4 mb-10 flex-grow">
          {location && (
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <MapPin size={16} className="text-text-subtle" />
              <span>{location}</span>
            </div>
          )}
          {languages && (
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <Globe size={16} className="text-text-subtle" />
              <span>{languages}</span>
            </div>
          )}
        </div>

        {/* Footer / CTA Actions */}
        <div className="mt-auto pt-8 flex flex-col gap-6">
          {contactEmail && (
            <a 
              href={`mailto:${contactEmail}`}
              className="group relative w-full flex items-center justify-between border border-border-strong px-5 py-4 hover:border-accent transition-colors duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative text-sm font-medium text-text-primary group-hover:text-bg-base transition-colors duration-300 z-10">Get in Touch</span>
              <Mail size={16} className="relative text-text-muted group-hover:text-bg-base transition-colors duration-300 z-10" />
            </a>
          )}

          {validSocials.length > 0 && (
            <div className="flex gap-4">
              {validSocials.map(([platform, url]) => (
                <a 
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-subtle hover:text-text-primary transition-colors p-2 -ml-2"
                  aria-label={platform}
                >
                  {socialIcons[platform] || <Globe size={18} />}
                </a>
              ))}
            </div>
          )}

          {/* Subdued Brand Mark */}
          <div className="mt-8 pt-8 border-t border-border flex justify-start opacity-30 pointer-events-none">
            <BrandLogo size={16} showWordmark={true} />
          </div>
        </div>

      </div>
    </aside>
  );
};
