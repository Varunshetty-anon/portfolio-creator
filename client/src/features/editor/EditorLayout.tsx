import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Film, Palette, LogOut, Check, Save, Loader2, Share2, PanelRightClose, PanelRightOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { portfolioApi } from '@/lib/api';
import type { PortfolioData } from '@/types';
import { INITIAL_PORTFOLIO } from '@/types';

import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ShareModal } from '@/components/shared/ShareModal';

import ProfileSection from './sections/ProfileSection';
import ProjectsSection from './sections/ProjectsSection';
import DesignSection from './sections/DesignSection';
import PortfolioLayout from '@/features/portfolio/PortfolioLayout';
import type { Project } from '@/types';
import { Logo } from '@/components/shared/Logo';

type TabType = 'profile' | 'projects' | 'design';

export default function EditorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  
  const [portfolio, setPortfolio] = useState<PortfolioData>(INITIAL_PORTFOLIO);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success'>('idle');
  const [showShareModal, setShowShareModal] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef<{ portfolio: PortfolioData; projects: Project[] }>({ portfolio: INITIAL_PORTFOLIO, projects: [] });

  useEffect(() => {
    latestDataRef.current = { portfolio, projects };
  }, [portfolio, projects]);

  // Initial Fetch
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await portfolioApi.get() as any;
        if (isMounted && res.portfolio) {
          setPortfolio({ ...INITIAL_PORTFOLIO, ...res.portfolio });
        }
        if (isMounted && res.projects) {
          setProjects(res.projects);
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

  // Auto-Save Logic (Debounced 2.5s to reduce API calls during rapid editing)
  const triggerAutoSave = useCallback(() => {
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        const { portfolio: currentPortfolio, projects: currentProjects } = latestDataRef.current;
        const res = await portfolioApi.update({ ...currentPortfolio, projects: currentProjects }) as any;
        
        // Update IDs of newly created projects
        if (res.projects) {
          setProjects(res.projects);
        }
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Auto-save failed:", err);
        // Retry once after 3 seconds on failure
        setTimeout(async () => {
          try {
            const { portfolio: retryPortfolio, projects: retryProjects } = latestDataRef.current;
            const res = await portfolioApi.update({ ...retryPortfolio, projects: retryProjects }) as any;
            if (res.projects) setProjects(res.projects);
            setHasUnsavedChanges(false);
          } catch (retryErr) {
            console.error("Auto-save retry failed:", retryErr);
          }
        }, 3000);
      } finally {
        setIsSaving(false);
      }
    }, 2500);
  }, []);

  const handleChange = (newData: PortfolioData) => {
    setPortfolio(newData);
    triggerAutoSave();
  };

  const handleProjectsChange = (newProjects: Project[]) => {
    setProjects(newProjects);
    triggerAutoSave();
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      if (hasUnsavedChanges) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        const { portfolio: currentPortfolio, projects: currentProjects } = latestDataRef.current;
        await portfolioApi.update({ ...currentPortfolio, projects: currentProjects });
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
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading Studio..." />;
  }

  const tabs = [
    { id: 'profile', label: 'Identity', icon: User },
    { id: 'projects', label: 'Projects', icon: Film },
    { id: 'design', label: 'Design', icon: Palette },
  ] as const;

  return (
    <div className="flex h-screen bg-bg-base text-text-primary font-body overflow-hidden">
      
      {/* ── Slim Left Sidebar (Navigation) ── */}
      <aside className="w-16 md:w-[72px] border-r border-border bg-bg-floating flex flex-col items-center py-4 z-20 shrink-0">
        <div className="mb-8">
          <Logo />
        </div>

        <nav className="flex-1 w-full flex flex-col gap-3 px-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setIsRightSidebarOpen(true);
                }}
                className={`
                  relative flex items-center justify-center w-full aspect-square rounded-xl transition-all group
                  ${isActive ? 'bg-bg-raised text-text-primary' : 'text-text-muted hover:bg-bg-raised/50 hover:text-text-primary'}
                `}
                title={tab.label}
              >
                <Icon size={20} className={isActive ? 'text-accent' : ''} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-accent rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto px-3 w-full">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center aspect-square text-text-muted hover:text-danger hover:bg-danger/10 transition-colors rounded-xl"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* ── Main Canvas (Live Preview) ── */}
      <main className="flex-1 relative bg-bg-raised flex flex-col min-w-0">
        {/* Floating Top Header */}
        <header className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
          
          {/* Status Indicator */}
          <div className="bg-bg-floating/80 backdrop-blur-md border border-border px-4 py-2 rounded-full shadow-sm pointer-events-auto flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin text-text-muted" />
                <span className="text-text-muted">Saving...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                <span className="text-warning">Unsaved</span>
              </>
            ) : (
              <>
                <Check size={12} className="text-success" />
                <span className="text-text-muted">Saved</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 bg-bg-floating/80 backdrop-blur-md border border-border p-1.5 rounded-full shadow-sm pointer-events-auto">
            {portfolio.isPublished && portfolio.username && (
              <>
                <button
                  onClick={() => window.open(`/portfolio/${portfolio.username}`, '_blank')}
                  className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-bg-raised"
                  title="Open Live Site"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2 text-text-muted hover:text-accent transition-colors rounded-full hover:bg-bg-raised"
                  title="Share Portfolio"
                >
                  <Share2 size={16} />
                </button>
                <div className="w-px h-4 bg-border mx-1" />
              </>
            )}
            
            <Button 
              size="sm" 
              onClick={handlePublish}
              loading={isPublishing}
              className={`rounded-full px-5 ${publishStatus === 'success' ? 'bg-success text-white' : 'bg-text-primary text-bg-base hover:bg-text-primary/90'}`}
            >
              {publishStatus === 'success' ? 'Published' : 'Publish'}
            </Button>
            
            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="p-2 ml-1 text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-bg-raised md:hidden"
            >
              {isRightSidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          </div>
        </header>

        {/* The Live Portfolio Canvas */}
        <div className="w-full h-full overflow-hidden border-x border-border/50">
          <div className="w-full h-full overflow-y-auto scrollbar-hide">
            <PortfolioLayout 
              isPreviewMode 
              draftData={{ ...portfolio, projects }} 
            />
          </div>
        </div>
      </main>

      {/* ── Right Property Sidebar ── */}
      <AnimatePresence>
        {isRightSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-full max-w-[380px] shrink-0 border-l border-border bg-bg-floating flex flex-col z-20"
          >
            <div className="h-14 border-b border-border flex items-center justify-between px-5 shrink-0">
              <h2 className="text-sm font-medium capitalize text-text-primary">
                {activeTab} Properties
              </h2>
              <button 
                onClick={() => setIsRightSidebarOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <PanelRightClose size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === 'profile' && (
                    <ProfileSection data={portfolio} onChange={handleChange} />
                  )}
                  {activeTab === 'projects' && (
                    <ProjectsSection 
                      data={portfolio} 
                      onChange={handleChange} 
                      onAutoSave={() => triggerAutoSave()} 
                      projects={projects}
                      onChangeProjects={setProjects}
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {portfolio.username && (
        <ShareModal 
          isOpen={showShareModal} 
          onClose={() => setShowShareModal(false)} 
          username={portfolio.username} 
        />
      )}
    </div>
  );
}
