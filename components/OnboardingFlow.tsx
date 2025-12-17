import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioData } from '../types';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { ToolSelector } from './ToolSelector';
import { ArrowRight, CheckCircle2, User, Briefcase, Layers, Sparkles, Wand2, Check } from 'lucide-react';

interface OnboardingFlowProps {
  data: PortfolioData;
  onComplete: (data: PortfolioData) => void;
}

const steps = [
  { id: 'identity', title: 'Welcome to Frames', subtitle: 'Let\'s start with your identity.', icon: User },
  { id: 'role', title: 'Your Profession', subtitle: 'Select your creative field.', icon: Briefcase },
  { id: 'tools', title: 'Your Arsenal', subtitle: 'Select the tools you master.', icon: Layers },
];

const CREATIVE_ROLES = [
    "Video Editor",
    "Motion Designer",
    "Graphic Designer",
    "Filmmaker",
    "Content Creator",
    "3D Artist",
    "Colorist",
    "VFX Artist",
    "Photographer",
    "Creative Director"
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ data, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<PortfolioData>>({
    name: data.name,
    role: data.role,
    primaryTool: data.primaryTool,
    tools: data.tools || [],
    aiTools: data.aiTools || []
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      // Complete
      onComplete({ ...data, ...formData } as PortfolioData);
    }
  };

  const isValid = () => {
      switch(currentStep) {
          case 0: return !!formData.name && formData.name.length > 2;
          case 1: return !!formData.role && formData.role.length > 2;
          case 2: return (formData.tools?.length || 0) > 0;
          default: return true;
      }
  };

  // Global enter key listener
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' && isValid()) {
              handleNext();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, formData]);

  return (
    <div className="fixed inset-0 bg-[#050505] z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Cool Gradient Doodle Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
          <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>
      
      <div className="w-full max-w-4xl relative z-10 flex flex-col h-full justify-center py-6">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 justify-center shrink-0">
            {steps.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx <= currentStep ? 'w-12 bg-white shadow-[0_0_10px_white]' : 'w-2 bg-zinc-800'}`} />
            ))}
        </div>

        <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center flex-1 min-h-0"
            >
                <div className="text-center space-y-4 mb-8 shrink-0">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center border border-zinc-800 mb-6 text-white shadow-2xl backdrop-blur-md"
                    >
                        {React.createElement(steps[currentStep].icon, { size: 28, strokeWidth: 1.5 })}
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tighter">{steps[currentStep].title}</h2>
                    <p className="text-zinc-400 text-base md:text-lg font-light">{steps[currentStep].subtitle}</p>
                </div>

                <div className="w-full max-w-3xl bg-zinc-900/40 border border-zinc-800 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden group flex flex-col flex-1 min-h-0 max-h-[60vh]">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                    
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        {currentStep === 0 && (
                            <div className="space-y-6 max-w-md mx-auto py-12">
                                <Input 
                                    label="Full Name" 
                                    placeholder="e.g. Varun Shetty" 
                                    value={formData.name || ''} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    autoFocus
                                    className="text-2xl py-6 bg-black/50 border-zinc-700 focus:border-white transition-all text-center placeholder:text-zinc-700"
                                />
                            </div>
                        )}
                        {currentStep === 1 && (
                            <div className="py-6">
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
                                    {CREATIVE_ROLES.map(role => {
                                        const isSelected = formData.role === role;
                                        return (
                                            <button
                                                key={role}
                                                onClick={() => setFormData({...formData, role})}
                                                className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group ${isSelected ? 'bg-zinc-800 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-black/30 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50'}`}
                                            >
                                                <span className={`font-medium ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{role}</span>
                                                {isSelected && <div className="absolute top-2 right-2 text-indigo-500"><CheckCircle2 size={16} /></div>}
                                            </button>
                                        )
                                    })}
                                </div>
                                {/* Fallback custom input */}
                                <div className="max-w-md mx-auto mt-6 border-t border-zinc-800 pt-6">
                                     <Input 
                                        placeholder="Other (Type here...)" 
                                        value={CREATIVE_ROLES.includes(formData.role || '') ? '' : formData.role} 
                                        onChange={e => setFormData({...formData, role: e.target.value})}
                                        className="bg-black/20 text-center"
                                     />
                                </div>
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="space-y-8 pb-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">Software Stack (Select Primary Workflow with Star)</label>
                                    <ToolSelector 
                                        type="editing"
                                        selectedTools={formData.tools || []}
                                        primaryTool={formData.primaryTool}
                                        onSelect={(tools) => setFormData({...formData, tools})}
                                        onSetPrimary={(tool) => setFormData({...formData, primaryTool: tool})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">AI Tools</label>
                                    <ToolSelector 
                                        type="ai"
                                        selectedTools={formData.aiTools || []}
                                        onSelect={(tools) => setFormData({...formData, aiTools: tools})}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                     {/* Sticky Footer inside container to prevent cut-off */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex justify-center shrink-0 z-20">
                         <Button 
                            size="lg" 
                            className="px-12 py-4 text-base tracking-widest uppercase font-bold rounded-full hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20" 
                            disabled={!isValid()}
                            onClick={handleNext}
                        >
                            {currentStep === steps.length - 1 ? 'Enter Studio' : 'Continue'}
                            <ArrowRight className="ml-3" size={18}/>
                        </Button>
                    </div>
                </div>

                <div className="mt-4 text-zinc-500 text-xs text-center animate-pulse">
                    Press <span className="font-bold text-zinc-400">[Enter]</span> to continue
                </div>

            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};