// ========================
// FRAMES DesignSection
// ========================
// Editor section for managing design, tools, and account settings.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import type { PortfolioData } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ToolSelector } from '@/components/shared/ToolSelector';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface DesignSectionProps {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
}

export default function DesignSection({ data, onChange }: DesignSectionProps) {
  const { deleteAccount } = useAuth();
  const { toast } = useToast();
  
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
      // AuthContext handles redirect to login
    } catch (err) {
      console.error("Delete account failed:", err);
      setIsDeleting(false);
      toast("Failed to delete account. Please try again.", "error");
    }
  };

  const isPublished = data.isPublished && data.username;

  return (
    <div className="space-y-12">
      
      {/* ── Portfolio Link ── */}
      <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-gold/0 via-accent-gold/10 to-accent-gold/0 opacity-50 blur-xl pointer-events-none" />
        
        <div className="relative">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold mb-6">Your Live Portfolio</h3>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full relative">
              <Input
                label="Username / Slug"
                value={data.username || ''}
                readOnly
                className="bg-black/50 pr-24 font-mono text-zinc-300"
              />
              <div className="absolute right-3 top-[34px] text-xs font-medium text-zinc-500">
                frames.studio/
              </div>
            </div>
            
            <div className="sm:mt-7 w-full sm:w-auto">
              <Button 
                onClick={() => isPublished && window.open(`/portfolio/${data.username}`, '_blank')}
                disabled={!isPublished}
                className="w-full sm:w-auto"
              >
                <ExternalLink size={16} className="mr-2" />
                Open Live View
              </Button>
            </div>
          </div>
          
          {!isPublished && (
            <p className="text-xs text-zinc-500 mt-4">
              Your portfolio is currently a draft. Click "Publish" in the top bar to make it public.
            </p>
          )}
        </div>
      </section>

      {/* ── Tools & Skills ── */}
      <section className="space-y-6 pt-8 border-t border-frames-border">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Software Stack</h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-2xl">
            Select the software you use. Click the star icon on a selected tool to mark it as your primary editing environment.
          </p>
          
          <ToolSelector
            availableTools={EDITING_TOOLS_LIST}
            selectedTools={data.tools || []}
            primaryTool={data.primaryTool}
            onChange={handleToolChange}
            allowPrimary={true}
          />
        </div>
      </section>

      <section className="space-y-6 pt-8 border-t border-frames-border">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">AI Capabilities</h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-2xl">
            Showcase the AI tools integrated into your workflow. These appear in a dedicated section on your portfolio.
          </p>
          
          <ToolSelector
            availableTools={AI_TOOLS_LIST}
            selectedTools={data.aiTools || []}
            onChange={handleAIToolChange}
          />
        </div>
      </section>

      {/* ── Danger Zone ── */}
      <section className="pt-16 mt-8 border-t border-red-900/20">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-6">Danger Zone</h3>
        
        <div className="bg-red-950/20 border border-red-900/30 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h4 className="text-white font-medium mb-1">Delete Account</h4>
            <p className="text-sm text-zinc-400 max-w-md">
              Permanently delete your account, portfolio, all projects, and analytics data. This action cannot be undone.
            </p>
          </div>
          
          <Button 
            variant="danger" 
            onClick={() => setShowDeleteConfirm(true)}
            className="shrink-0"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-red-900/50 rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6"
              >
                <div className="flex items-center gap-3 text-red-500 mb-4">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold">Absolute Warning</h3>
                </div>
                
                <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
                  You are about to permanently delete your entire FRAMES account. This will instantly destroy your portfolio, unpublish your live site, and erase all project data.
                </p>
                
                <div className="mb-6">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Please type <strong className="text-white font-mono bg-zinc-800 px-1 rounded">{data.username}</strong> to confirm.
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={data.username}
                    className="border-red-900/50 focus:border-red-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="secondary" 
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
      </section>

    </div>
  );
}
