// ========================
// FRAMES Editor Layout (Placeholder)
// ========================
// Will be fully built in Phase 6.
// For now: basic scaffold showing the editor works.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { portfolioApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { LogOut, Eye, Save } from 'lucide-react';
import type { PortfolioData } from '@/types';
import { INITIAL_PORTFOLIO } from '@/types';

const EditorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const data = await portfolioApi.get() as PortfolioData;
      setPortfolio(data);
    } catch {
      // No portfolio yet — use initial data
      setPortfolio({ ...INITIAL_PORTFOLIO });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!portfolio) return;
    setIsSaving(true);
    try {
      await portfolioApi.update(portfolio as unknown as Record<string, unknown>);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!portfolio) return;
    setIsSaving(true);
    try {
      await handleSave();
      await portfolioApi.publish();
      await loadPortfolio();
    } catch (e) {
      console.error('Publish failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return <LoadingScreen message="Loading editor..." />;
  }

  return (
    <div className="min-h-screen bg-frames-bg text-white">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-frames-surface/80 backdrop-blur-xl border-b border-frames-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="font-display font-black text-black text-sm">F</span>
          </div>
          <span className="text-sm font-medium text-zinc-400">
            Frames Studio
          </span>
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-400 ml-2">✓ Saved</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {portfolio?.isPublished && portfolio.username && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye size={14} />}
              onClick={() => window.open(`/portfolio/${portfolio.username}`, '_blank')}
            >
              View Live
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={<Save size={14} />}
            onClick={handleSave}
            loading={isSaving}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            loading={isSaving}
          >
            Publish
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut size={14} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Editor Content — Placeholder for Phase 6 */}
      <main className="pt-14 flex">
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <div className="text-center max-w-md p-8">
            <h2 className="text-2xl font-display font-bold mb-4">
              Welcome to Frames Studio
            </h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              {user?.displayName ? `Hey ${user.displayName}! ` : ''}
              The full editor experience is being built. This scaffold confirms
              routing, auth, and API connectivity are working.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left text-xs">
              <div className="p-4 rounded-xl bg-frames-surface border border-frames-border">
                <p className="text-zinc-500 mb-1">Username</p>
                <p className="text-white font-medium">{portfolio?.username || 'Not set'}</p>
              </div>
              <div className="p-4 rounded-xl bg-frames-surface border border-frames-border">
                <p className="text-zinc-500 mb-1">Status</p>
                <p className={portfolio?.isPublished ? 'text-green-400 font-medium' : 'text-zinc-400 font-medium'}>
                  {portfolio?.isPublished ? 'Published' : 'Draft'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-frames-surface border border-frames-border">
                <p className="text-zinc-500 mb-1">Projects</p>
                <p className="text-white font-medium">{portfolio?.projects?.length || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-frames-surface border border-frames-border">
                <p className="text-zinc-500 mb-1">Tools</p>
                <p className="text-white font-medium">{portfolio?.tools?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditorLayout;
