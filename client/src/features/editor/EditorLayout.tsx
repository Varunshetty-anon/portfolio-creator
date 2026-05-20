// ========================
// FRAMES EditorLayout
// ========================
// Main editor view for authenticated users to build their portfolio.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Film, Palette, Eye, LogOut, Check, Save, Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { portfolioApi } from '@/lib/api';
import type { PortfolioData } from '@/types';
import { INITIAL_PORTFOLIO } from '@/types';

import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

import ProfileSection from './sections/ProfileSection';
import ProjectsSection from './sections/ProjectsSection';
import DesignSection from './sections/DesignSection';

type TabType = 'profile' | 'projects' | 'design';

export default function EditorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [portfolio, setPortfolio] = useState<PortfolioData>(INITIAL_PORTFOLIO);
  const [isLoading, setIsLoading] = useState(true);
  
  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success'>('idle');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Fetch
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await portfolioApi.get() as any;
        if (isMounted && res.portfolio) {
          // Merge with initial to ensure all fields exist
          setPortfolio({ ...INITIAL_PORTFOLIO, ...res.portfolio });
        }
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  // Auto-Save Logic (Debounced 2.5s)
  const triggerAutoSave = useCallback((dataToSave: PortfolioData) => {
    setHasUnsavedChanges(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        // Clean up UI-only or protected fields before sending if needed
        // The backend handles merging. We just send the full draft.
        await portfolioApi.update(dataToSave);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Auto-save failed:", err);
        // Keep unsaved indicator on
      } finally {
        setIsSaving(false);
      }
    }, 2500);
  }, []);

  const handleChange = (newData: PortfolioData) => {
    setPortfolio(newData);
    triggerAutoSave(newData);
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      // Force a synchronous save first if there are unsaved changes
      if (hasUnsavedChanges) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        await portfolioApi.update(portfolio);
        setHasUnsavedChanges(false);
      }
      
      const res = await portfolioApi.publish() as any;
      setPortfolio({ ...INITIAL_PORTFOLIO, ...res.portfolio });
      
      setPublishStatus('success');
      setTimeout(() => setPublishStatus('idle'), 3000);
    } catch (err) {
      console.error("Publish failed:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading Studio..." />;
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'projects', label: 'Projects', icon: Film },
    { id: 'design', label: 'Design & Tools', icon: Palette },
  ] as const;

  return (
    <div className="flex h-screen bg-frames-bg text-frames-text font-sans overflow-hidden">
      
      {/* ── Left Sidebar ── */}
      <aside className="w-20 lg:w-64 border-r border-frames-border bg-frames-surface flex flex-col transition-all duration-300 z-20">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-frames-border">
          <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center font-display font-bold text-black shrink-0">
            F
          </div>
          <span className="hidden lg:block ml-3 font-display font-bold text-white tracking-widest text-sm uppercase">
            Studio
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center p-3 rounded-lg transition-all group relative
                  ${isActive 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'}
                `}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-accent-gold' : 'group-hover:text-white'}`} />
                <span className="hidden lg:block ml-3 font-medium text-sm">{tab.label}</span>
                
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-accent-gold rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Area (Logout / User) */}
        <div className="p-4 border-t border-frames-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-900"
            title="Log out"
          >
            <LogOut size={18} />
            <span className="hidden lg:block ml-3 text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-frames-bg">
        
        {/* Top Header */}
        <header className="h-16 border-b border-frames-border bg-frames-surface/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin text-zinc-400" />
                  <span className="text-zinc-400">Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
                  <span className="text-accent-gold">Unsaved Changes</span>
                </>
              ) : (
                <>
                  <Check size={12} className="text-zinc-600" />
                  <span className="text-zinc-600">Saved</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {portfolio.isPublished && portfolio.username && (
              <a 
                href={`/portfolio/${portfolio.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                <Eye size={14} className="mr-1.5" />
                View Live
              </a>
            )}
            
            <Button 
              size="sm" 
              onClick={handlePublish}
              loading={isPublishing}
              className={`
                transition-all duration-300 min-w-[100px]
                ${publishStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' : ''}
              `}
            >
              {publishStatus === 'success' ? (
                <><Check size={14} className="mr-2" /> Published</>
              ) : (
                <><Save size={14} className="mr-2" /> Publish</>
              )}
            </Button>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto pb-24">
            
            {/* Header Title */}
            <div className="mb-10">
              <h1 className="text-3xl font-display font-bold text-white mb-2 capitalize">
                {activeTab}
              </h1>
              <p className="text-zinc-500 text-sm">
                {activeTab === 'profile' && 'Manage your personal information and online presence.'}
                {activeTab === 'projects' && 'Add, edit, and reorder your portfolio pieces.'}
                {activeTab === 'design' && 'Configure your tools, skills, and account settings.'}
              </p>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'profile' && (
                  <ProfileSection data={portfolio} onChange={handleChange} />
                )}
                {activeTab === 'projects' && (
                  <ProjectsSection 
                    data={portfolio} 
                    onChange={handleChange} 
                    onAutoSave={() => triggerAutoSave(portfolio)} 
                  />
                )}
                {activeTab === 'design' && (
                  <DesignSection 
                    data={portfolio} 
                    onChange={handleChange} 
                  />
                )}
              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      </main>
    </div>
  );
}
