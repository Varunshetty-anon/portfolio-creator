// ========================
// FRAMES Onboarding Flow (Placeholder)
// ========================
// Will be fully built in Phase 6.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { portfolioApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CREATIVE_ROLES } from '@/lib/constants';
import { User, Briefcase, Wrench } from 'lucide-react';

const OnboardingFlow: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    username: '',
    role: '',
  });

  const steps = [
    { title: "What's your name?", subtitle: 'This appears on your portfolio.', icon: User },
    { title: "Choose your username", subtitle: 'This will be your portfolio URL.', icon: Briefcase },
    { title: "What's your role?", subtitle: 'Select what best describes you.', icon: Wrench },
  ];

  const isValid = () => {
    switch (step) {
      case 0: return formData.name.length > 2;
      case 1: return formData.username.length > 2 && /^[a-z0-9-]+$/.test(formData.username);
      case 2: return formData.role.length > 2;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      setIsSubmitting(true);
      try {
        await portfolioApi.create({
          name: formData.name,
          username: formData.username.toLowerCase(),
          role: formData.role,
        });
        await refreshUser();
        navigate('/editor', { replace: true });
      } catch (e) {
        console.error('Onboarding failed:', e);
        setIsSubmitting(false);
      }
    }
  };

  const StepIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 z-50 bg-frames-bg flex items-center justify-center p-4">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse animate-delay-200" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-zinc-800/50 p-8 shadow-2xl"
      >
        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step ? 'w-12 bg-white shadow-[0_0_10px_white]' : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <motion.div
          key={step}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-14 h-14 bg-zinc-800/80 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-700/50"
        >
          <StepIcon size={24} className="text-white" />
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-display font-bold text-white text-center mb-2">
          {steps[step].title}
        </h2>
        <p className="text-zinc-500 text-sm text-center mb-8">
          {steps[step].subtitle}
        </p>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {step === 0 && (
            <Input
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          )}

          {step === 1 && (
            <>
              <Input
                placeholder="yourname"
                value={formData.username}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
                autoFocus
              />
              {formData.username && (
                <p className="text-xs text-zinc-500">
                  Your portfolio: <span className="text-zinc-300">frames.app/portfolio/{formData.username}</span>
                </p>
              )}
            </>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto scrollbar-hide">
              {CREATIVE_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setFormData({ ...formData, role })}
                  className={`p-3 rounded-xl text-sm text-left transition-all border ${
                    formData.role === role
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-zinc-800/50 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Action */}
        <div className="mt-8">
          <Button
            className="w-full py-4"
            onClick={handleNext}
            disabled={!isValid()}
            loading={isSubmitting}
          >
            {step < 2 ? 'Continue' : 'Create Portfolio'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingFlow;
