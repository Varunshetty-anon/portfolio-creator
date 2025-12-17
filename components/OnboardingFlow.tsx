import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioData } from '../types';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { ToolSelector } from './ToolSelector';
import { ArrowRight, CheckCircle2, User, Briefcase, Layers, Sparkles, Wand2 } from 'lucide-react';

interface OnboardingFlowProps {
  data: PortfolioData;
  onComplete: (data: PortfolioData) => void;
}

const steps = [
  { id: 'identity', title: 'Welcome to Frames', subtitle: 'Let\'s start with your identity.', icon: User },
  { id: 'role', title: 'Your Profession', subtitle: 'What do you do?', icon: Briefcase },
  { id: 'tools', title: 'Your Arsenal', subtitle: 'Select the tools you master.', icon: Layers },
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

  return (
    <div className="fixed inset-0 bg-[#000000] z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black animate-pulse-slow"></div>
      
      <div className="w-full max-w-4xl relative z-10 flex flex-col h-full md:h-auto justify-center">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12 justify-center">
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
                className="space-y-8 flex flex-col items-center"
            >
                <div className="text-center space-y-4">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center border border-zinc-800 mb-6 text-white shadow-2xl"
                    >
                        {React.createElement(steps[currentStep].icon, { size: 28, strokeWidth: 1.5 })}
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter">{steps[currentStep].title}</h2>
                    <p className="text-zinc-400 text-lg font-light">{steps[currentStep].subtitle}</p>
                </div>

                <div className="w-full max-w-3xl bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                    
                    {currentStep === 0 && (
                        <div className="space-y-6 max-w-md mx-auto">
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
                        <div className="space-y-6 max-w-md mx-auto">
                             <Input 
                                label="Job Title" 
                                placeholder="e.g. Video Editor" 
                                value={formData.role || ''} 
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                autoFocus
                                className="text-2xl py-6 bg-black/50 border-zinc-700 focus:border-white transition-all text-center placeholder:text-zinc-700"
                            />
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-8 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
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

                <div className="flex justify-center pt-2">
                    <Button 
                        size="lg" 
                        className="px-12 py-4 text-base tracking-widest uppercase font-bold rounded-full hover:scale-105 transition-transform" 
                        disabled={!isValid()}
                        onClick={handleNext}
                    >
                        {currentStep === steps.length - 1 ? 'Enter Studio' : 'Continue'}
                        <ArrowRight className="ml-3" size={18}/>
                    </Button>
                </div>

            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};