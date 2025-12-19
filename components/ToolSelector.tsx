import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '../lib/utils';

interface ToolSelectorProps {
  type: 'editing' | 'ai';
  selectedTools: string[];
  primaryTool?: string;
  onSelect: (tools: string[]) => void;
  onSetPrimary?: (tool: string) => void;
  className?: string;
}

const ToolIcon = ({ tool }: { tool: any }) => {
    const [imgSrc, setImgSrc] = useState(`https://cdn.simpleicons.org/${tool.slug}/white`);
    const [hasError, setHasError] = useState(false);
    const [useClearbit, setUseClearbit] = useState(false);

    const handleError = () => {
        if (!useClearbit && tool.domain) {
            setUseClearbit(true);
            setImgSrc(`https://logo.clearbit.com/${tool.domain}`);
        } else {
            setHasError(true);
        }
    };

    if (hasError) {
        return <span className="text-xs font-bold text-zinc-500">{tool.name.charAt(0)}</span>;
    }

    return (
        <img 
            src={imgSrc} 
            alt={tool.name}
            className={`w-5 h-5 object-contain ${useClearbit ? 'rounded-sm' : ''}`}
            onError={handleError}
        />
    );
};

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
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {options.map((tool) => {
        const isSelected = selectedTools.includes(tool.name);
        const isPrimary = primaryTool === tool.name;

        return (
          <div 
            key={tool.name}
            onClick={() => toggleTool(tool.name)}
            className={`
                group relative flex flex-col items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none
                ${isSelected 
                    ? 'bg-zinc-800 border-indigo-500/50 shadow-[0_0_15px_-5px_rgba(99,102,241,0.2)]' 
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }
            `}
          >
            {/* Header: Logo and Checkbox */}
            <div className="flex items-center justify-between w-full">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-black border border-zinc-800 flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                   <ToolIcon tool={tool} />
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700 bg-zinc-950'}`}>
                    {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
            </div>

            {/* Name & Primary Selection */}
            <div className="w-full space-y-2">
                <span className={`text-[13px] font-semibold truncate block ${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {tool.name}
                </span>
                
                {/* Primary Tool Selection Tag - Clearly separated below logo/name */}
                {type === 'editing' && onSetPrimary && isSelected && (
                    <button 
                        onClick={(e) => setPrimary(e, tool.name)}
                        className={`text-[9px] w-full flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider py-1.5 px-2 rounded-md transition-all ${isPrimary ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-950 border border-zinc-800'}`}
                    >
                        <Star size={10} fill={isPrimary ? "currentColor" : "none"} />
                        {isPrimary ? 'Primary' : 'Set Primary'}
                    </button>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
};