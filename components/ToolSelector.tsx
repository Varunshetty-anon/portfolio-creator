import React from 'react';
import { Check, Star } from 'lucide-react';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '../utils';

interface ToolOption {
  name: string;
  slug: string;
  color: string;
}

interface ToolSelectorProps {
  type: 'editing' | 'ai';
  selectedTools: string[];
  primaryTool?: string;
  onSelect: (tools: string[]) => void;
  onSetPrimary?: (tool: string) => void;
  className?: string;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({ 
  type, 
  selectedTools, 
  primaryTool, 
  onSelect, 
  onSetPrimary, 
  className = '' 
}) => {
  const options = type === 'editing' ? EDITING_TOOLS_LIST : AI_TOOLS_LIST;

  const toggleTool = (toolName: string) => {
    if (selectedTools.includes(toolName)) {
      const newSelection = selectedTools.filter(t => t !== toolName);
      onSelect(newSelection);
      // If we removed the primary tool, clear it
      if (primaryTool === toolName && onSetPrimary) {
        onSetPrimary('');
      }
    } else {
      onSelect([...selectedTools, toolName]);
    }
  };

  const setPrimary = (e: React.MouseEvent, toolName: string) => {
    e.stopPropagation();
    if (onSetPrimary) {
        onSetPrimary(toolName);
    }
  };

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 gap-3 ${className}`}>
      {options.map((tool) => {
        const isSelected = selectedTools.includes(tool.name);
        const isPrimary = primaryTool === tool.name;

        return (
          <div 
            key={tool.slug}
            onClick={() => toggleTool(tool.name)}
            className={`
                group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none
                ${isSelected 
                    ? 'bg-zinc-800/80 border-indigo-500/50 shadow-[0_0_15px_-5px_rgba(99,102,241,0.2)]' 
                    : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }
            `}
          >
            {/* Logo */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-black border border-zinc-800 flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
               <img 
                 src={`https://cdn.simpleicons.org/${tool.slug}/white`} 
                 alt={tool.name}
                 className="w-5 h-5 object-contain"
                 onError={(e) => {
                     // Fallback if image fails
                     (e.target as HTMLImageElement).style.display = 'none';
                     (e.target as HTMLImageElement).parentElement!.innerText = tool.name.charAt(0);
                 }}
               />
            </div>

            {/* Name & Checkbox */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                        {tool.name}
                    </span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700 bg-zinc-950'}`}>
                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                </div>
                {/* Primary Tool Selection (Only for editing tools and if selected) */}
                {type === 'editing' && onSetPrimary && isSelected && (
                    <button 
                        onClick={(e) => setPrimary(e, tool.name)}
                        className={`text-[10px] flex items-center gap-1 font-medium transition-colors ${isPrimary ? 'text-yellow-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Star size={10} fill={isPrimary ? "currentColor" : "none"} />
                        {isPrimary ? 'Primary Workflow' : 'Set as Primary'}
                    </button>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
};