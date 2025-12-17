import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioData } from '../types';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { ArrowRight, CheckCircle2, User, Briefcase, Layers, Sparkles } from 'lucide-react';

interface OnboardingFlowProps {
  data: PortfolioData;
  onComplete: (data: PortfolioData) => void;
}

const steps = [
  { id: 'identity', title: 'Welcome to Frames', subtitle: 'Let\'s start with your identity.', icon: User },
  { id: 'role', title: 'Your Profession', subtitle: 'What do you do?', icon: Briefcase },
  { id: 'workflow', title: 'Primary Workflow', subtitle: 'Which software defines your work?', icon: Layers },
  { id: 'tools', title: 'Stack & AI', subtitle: 'What else is in your arsenal?', icon: Sparkles }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ data, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<PortfolioData>>({
    name: data.name,
    role: data.role,
    primaryTool: data.primaryTool,
    tools: data.tools,
    aiTools: data.aiTools
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
          case 2: return !!formData.primaryTool;
          default: return true;
      }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black"></div>
      
      <div className="w-full max-w-lg relative z-10">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12 justify-center">
            {steps.map((_, idx) => (
                <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'w-8 bg-indigo-500' : 'w-2 bg-zinc-800'}`} />
            ))}
        </div>

        <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
            >
                <div className="text-center space-y-2">
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-16 h-16 mx-auto bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 mb-6 text-indigo-400"
                    >
                        {React.createElement(steps[currentStep].icon, { size: 32 })}
                    </motion.div>
                    <h2 className="text-4xl font-display font-bold text-white tracking-tight">{steps[currentStep].title}</h2>
                    <p className="text-zinc-500 text-lg">{steps[currentStep].subtitle}</p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-2xl backdrop-blur-sm shadow-2xl">
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <Input 
                                label="Full Name" 
                                placeholder="e.g. Varun Shetty" 
                                value={formData.name || ''} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                autoFocus
                                className="text-lg py-4"
                            />
                        </div>
                    )}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                             <Input 
                                label="Job Title" 
                                placeholder="e.g. Video Editor, Colorist" 
                                value={formData.role || ''} 
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                autoFocus
                                className="text-lg py-4"
                            />
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                             <Input 
                                label="Primary Software" 
                                placeholder="e.g. DaVinci Resolve" 
                                value={formData.primaryTool || ''} 
                                onChange={e => setFormData({...formData, primaryTool: e.target.value})}
                                autoFocus
                                className="text-lg py-4"
                            />
                        </div>
                    )}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                             <TextArea 
                                label="Other Tools (Comma separated)" 
                                placeholder="Premiere Pro, After Effects..." 
                                value={formData.tools?.join(', ') || ''} 
                                onChange={e => setFormData({...formData, tools: e.target.value.split(',').filter(Boolean)})}
                                rows={2}
                            />
                            <TextArea 
                                label="AI Tools (Comma separated)" 
                                placeholder="Midjourney, RunwayML..." 
                                value={formData.aiTools?.join(', ') || ''} 
                                onChange={e => setFormData({...formData, aiTools: e.target.value.split(',').filter(Boolean)})}
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                <Button 
                    size="lg" 
                    className="w-full py-4 text-base tracking-widest uppercase font-bold" 
                    disabled={!isValid()}
                    onClick={handleNext}
                >
                    {currentStep === steps.length - 1 ? 'Launch Studio' : 'Next Step'}
                    <ArrowRight className="ml-2" size={18}/>
                </Button>

            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
