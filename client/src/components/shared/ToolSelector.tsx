// ========================
// FRAMES ToolSelector Component
// ========================
// Grid-based selection for tools with primary designation capability.

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { ToolIcon } from './ToolIcon';

interface ToolItem {
  id: string;
  name: string;
  domain?: string;
}

interface ToolSelectorProps {
  availableTools: ToolItem[];
  selectedTools: string[];
  primaryTool?: string;
  onChange: (tools: string[], primary?: string) => void;
  allowPrimary?: boolean;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  availableTools,
  selectedTools,
  primaryTool,
  onChange,
  allowPrimary = false,
}) => {
  const toggleTool = (toolName: string) => {
    if (selectedTools.includes(toolName)) {
      const newTools = selectedTools.filter(t => t !== toolName);
      const newPrimary = primaryTool === toolName ? (newTools.length > 0 ? newTools[0] : undefined) : primaryTool;
      onChange(newTools, newPrimary);
    } else {
      onChange([...selectedTools, toolName], !primaryTool && allowPrimary ? toolName : primaryTool);
    }
  };

  const setPrimary = (e: React.MouseEvent, toolName: string) => {
    e.stopPropagation();
    if (!selectedTools.includes(toolName)) {
      onChange([...selectedTools, toolName], toolName);
    } else {
      onChange(selectedTools, toolName);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {availableTools.map(tool => {
        const isSelected = selectedTools.includes(tool.name);
        const isPrimary = primaryTool === tool.name;

        return (
          <motion.div
            key={tool.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleTool(tool.name)}
            className={`
              relative p-3 rounded-lg border cursor-pointer flex flex-col items-center justify-center gap-2 transition-all
              ${isSelected 
                ? 'bg-zinc-900 border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                : 'bg-frames-surface border-frames-border opacity-60 hover:opacity-100 hover:border-zinc-700'}
            `}
          >
            {/* Primary Indicator / Button */}
            {allowPrimary && isSelected && (
              <button
                onClick={(e) => setPrimary(e, tool.name)}
                className={`absolute top-1.5 right-1.5 p-1 rounded-full transition-colors ${
                  isPrimary ? 'text-accent-gold bg-accent-gold/10' : 'text-zinc-600 hover:text-zinc-400'
                }`}
                title={isPrimary ? 'Primary Tool' : 'Set as Primary'}
              >
                <Star size={12} className={isPrimary ? 'fill-accent-gold' : ''} />
              </button>
            )}

            <ToolIcon 
              name={tool.name} 
              domain={tool.domain} 
              size={24}
              className={!isSelected ? 'grayscale opacity-70' : ''} 
            />
            
            <span className={`text-[10px] font-medium text-center ${isSelected ? 'text-zinc-200' : 'text-zinc-500'}`}>
              {tool.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
