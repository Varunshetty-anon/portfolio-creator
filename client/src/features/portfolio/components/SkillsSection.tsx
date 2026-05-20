// ========================
// FRAMES SkillsSection Component
// ========================
// Renders the primary editing tool, software stack, and AI tools in a premium layout.

import React from 'react';
import { motion } from 'framer-motion';
import { ToolIcon } from '@/components/shared/ToolIcon';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '@/lib/constants';

interface SkillsSectionProps {
  primaryTool?: string;
  tools?: string[];
  aiTools?: string[];
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ primaryTool, tools = [], aiTools = [] }) => {
  // Return early if no skills are defined
  if (!primaryTool && tools.length === 0 && aiTools.length === 0) {
    return null;
  }

  // Find tool objects for the domains
  const getToolItem = (name: string, list: typeof EDITING_TOOLS_LIST) => {
    const found = list.find(t => t.name === name);
    if (found) return found;
    return { id: name, name, slug: name, domain: undefined, color: '#ffffff' };
  };

  const primaryToolObj = primaryTool ? getToolItem(primaryTool, EDITING_TOOLS_LIST) : null;
  
  // Filter out primary tool from the general stack
  const stackTools = tools
    .filter(t => t !== primaryTool)
    .map(t => getToolItem(t, EDITING_TOOLS_LIST));
    
  const aiToolObjs = aiTools.map(t => getToolItem(t, AI_TOOLS_LIST));

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="py-16 md:py-24 border-t border-frames-border"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
        
        {/* Tier 1: Primary Tool */}
        {primaryToolObj && (
          <motion.div variants={item} className="flex flex-col">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">Primary Software</h4>
            <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl">
              <ToolIcon 
                name={primaryToolObj.name} 
                domain={primaryToolObj.domain} 
                size={32} 
              />
              <div>
                <p className="text-white font-medium text-lg">{primaryToolObj.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Primary editing environment</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tier 2: Stack */}
        {stackTools.length > 0 && (
          <motion.div variants={item} className={`flex flex-col ${!primaryToolObj ? 'md:col-span-2' : ''}`}>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">Software Stack</h4>
            <div className="flex flex-wrap gap-3">
              {stackTools.map(tool => (
                <div 
                  key={tool.name} 
                  className="flex items-center gap-2.5 bg-zinc-900/30 border border-zinc-800/80 px-4 py-2.5 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-default"
                >
                  <ToolIcon name={tool.name} domain={tool.domain} size={18} />
                  <span className="text-zinc-300 text-sm font-medium">{tool.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tier 3: AI Stack */}
        {aiToolObjs.length > 0 && (
          <motion.div variants={item} className="flex flex-col">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold/70 mb-6">AI Capabilities</h4>
            <div className="flex flex-wrap gap-3">
              {aiToolObjs.map(tool => (
                <div 
                  key={tool.name} 
                  className="flex items-center gap-2.5 bg-accent-gold/5 border border-accent-gold/10 px-4 py-2.5 rounded-lg hover:bg-accent-gold/10 hover:border-accent-gold/20 transition-colors cursor-default"
                >
                  <ToolIcon name={tool.name} domain={tool.domain} size={18} />
                  <span className="text-accent-gold/90 text-sm font-medium">{tool.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};
