import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import type { PortfolioData } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ToolSelector } from '@/components/shared/ToolSelector';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/ToastProvider';
import { Panel, PanelSection } from '@/components/ui/EditorPanels';

interface DesignSectionProps {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
}

export default function DesignSection({ data, onChange }: DesignSectionProps) {
  const { deleteAccount } = useAuth();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToolChange = (tools: string[], primary?: string) => {
    onChange({ ...data, tools, primaryTool: primary || '' });
  };

  const handleAIToolChange = (aiTools: string[]) => {
    onChange({ ...data, aiTools });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== (data.username || '')) return;
    
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error("Delete account failed:", err);
      setIsDeleting(false);
      toast.error("Failed to delete account. Please try again.");
    }
  };

  const isPublished = data.isPublished && data.username;

  return (
    <Panel>
      <PanelSection title="Your Live Portfolio" description="Manage your public URL">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full relative">
            <Input
              value={data.username || ''}
              readOnly
              className="bg-bg-raised pr-24 font-mono text-text-primary"
            />
            <div className="absolute right-3 top-[10px] text-xs font-medium text-text-muted">
              frames.studio/
            </div>
          </div>
          <Button 
            onClick={() => isPublished && window.open(`/portfolio/${data.username}`, '_blank')}
            disabled={!isPublished}
            className="w-full sm:w-auto shrink-0"
            variant="secondary"
          >
            <ExternalLink size={14} className="mr-2" />
            Open
          </Button>
        </div>
        {!isPublished && (
          <p className="text-xs text-text-muted mt-2">
            Your portfolio is currently a draft. Click "Publish" to make it public.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Aesthetic Theme" description="Choose the visual atmosphere for your portfolio.">
        <div className="grid grid-cols-1 gap-3">
          {[
            { id: 'minimalism', label: 'Minimalism', desc: 'Apple-inspired, whitespace-driven.' },
            { id: 'magazine', label: 'Magazine', desc: 'Editorial, storytelling, large typography.' },
            { id: 'futuristic', label: 'Futuristic', desc: 'Modern, motion-oriented, creative-tech.' },
            { id: 'glassmorphic', label: 'Glassmorphic', desc: 'Layered depth, premium glass treatment.' }
          ].map(theme => (
            <button
              key={theme.id}
              onClick={() => onChange({ ...data, theme: theme.id as any })}
              className={`flex flex-col text-left p-3 rounded-lg border transition-all ${data.theme === theme.id ? 'bg-bg-floating border-accent' : 'bg-bg-raised border-border-strong hover:border-border'}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-sm font-medium ${data.theme === theme.id ? 'text-text-primary' : 'text-text-primary'}`}>{theme.label}</span>
                {data.theme === theme.id && <div className="w-2 h-2 rounded-full bg-accent" />}
              </div>
              <span className="text-xs text-text-muted">{theme.desc}</span>
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Software Stack" description="Select the software you use. Star your primary tool.">
        <ToolSelector
          availableTools={EDITING_TOOLS_LIST}
          selectedTools={data.tools || []}
          primaryTool={data.primaryTool}
          onChange={handleToolChange}
          allowPrimary={true}
        />
      </PanelSection>

      <PanelSection title="AI Capabilities" description="Showcase the AI tools integrated into your workflow.">
        <ToolSelector
          availableTools={AI_TOOLS_LIST}
          selectedTools={data.aiTools || []}
          onChange={handleAIToolChange}
        />
      </PanelSection>

      <PanelSection title="Danger Zone">
        <Button 
          variant="danger" 
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full"
        >
          <Trash2 size={16} className="mr-2" />
          Delete Account
        </Button>

        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-bg-base border border-danger/50 rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6"
              >
                <div className="flex items-center gap-3 text-danger mb-4">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold">Absolute Warning</h3>
                </div>
                
                <p className="text-text-primary text-sm mb-6 leading-relaxed">
                  You are about to permanently delete your entire FRAMES account. This will instantly destroy your portfolio, unpublish your live site, and erase all project data.
                </p>
                
                <div className="mb-6">
                  <label className="block text-xs font-medium text-text-muted mb-2">
                    Please type <strong className="text-text-primary font-mono bg-bg-raised px-1 rounded">{data.username}</strong> to confirm.
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={data.username}
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== (data.username || '') || isDeleting}
                    loading={isDeleting}
                  >
                    Permanently Delete
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PanelSection>
    </Panel>
  );
}
