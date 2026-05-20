// ========================
// FRAMES ProfileSidebar Component
// ========================
// Fixed left panel with user profile, bio, and socials.

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Instagram, Twitter, Youtube, Linkedin, MessageSquare, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { PortfolioData } from '@/types';

interface ProfileSidebarProps {
  data: PortfolioData;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ data }) => {
  const { name, role, bio, location, languages, contactEmail, profileImageUrl, socials, availability } = data;

  const socialIcons = {
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
    discord: MessageSquare,
  };

  return (
    <motion.aside 
      className="w-full lg:w-80 lg:fixed lg:h-screen lg:overflow-y-auto lg:border-r border-frames-border bg-frames-surface-raised/50 lg:bg-transparent backdrop-blur-sm z-10 scrollbar-hide"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="p-6 lg:p-10 flex flex-col min-h-full">
        
        {/* Profile Image */}
        {profileImageUrl && (
          <div className="mb-8">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-2 border-zinc-800 shadow-2xl relative group">
              <img 
                src={profileImageUrl} 
                alt={name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border border-white/10 rounded-full z-10 mix-blend-overlay"></div>
            </div>
          </div>
        )}

        {/* Identity */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">{name}</h1>
          <p className="text-sm tracking-widest uppercase text-accent-gold font-medium">{role}</p>
        </div>

        {/* Bio */}
        {bio && (
          <div className="mb-8">
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{bio}</p>
          </div>
        )}

        {/* Meta Info */}
        {(location || languages) && (
          <div className="flex flex-col gap-3 mb-10 pb-8 border-b border-frames-border">
            {location && (
              <div className="flex items-center text-xs text-zinc-500 font-medium">
                <MapPin size={14} className="mr-2 opacity-70" />
                {location}
              </div>
            )}
            {languages && (
              <div className="flex items-center text-xs text-zinc-500 font-medium">
                <MessageSquare size={14} className="mr-2 opacity-70" />
                {languages}
              </div>
            )}
          </div>
        )}

        {/* Availability Badge */}
        {availability?.status && (
          <div className="mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">Available for Work</span>
            </div>
            {availability.link && (
              <a 
                href={availability.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
              >
                Hire Me
              </a>
            )}
          </div>
        )}

        {/* Spacer to push socials to bottom on desktop */}
        <div className="flex-1"></div>

        {/* Actions & Socials */}
        <div className="mt-8 flex flex-col gap-6">
          {contactEmail && (
            <Button 
              className="w-full group" 
              onClick={() => window.location.href = `mailto:${contactEmail}`}
            >
              <Mail size={16} className="mr-2 group-hover:scale-110 transition-transform" />
              Get in Touch
            </Button>
          )}

          {socials && Object.values(socials).some(Boolean) && (
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              {(Object.entries(socials) as [keyof typeof socials, string][]).map(([network, url]) => {
                if (!url || network === 'email') return null; // Email handled above
                const Icon = socialIcons[network as keyof typeof socialIcons];
                if (!Icon) return null;
                
                return (
                  <a
                    key={network}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full"
                    aria-label={network}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.aside>
  );
};
