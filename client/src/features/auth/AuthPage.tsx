// ========================
// FRAMES Auth Page
// ========================
// Landing page with login/signup forms.

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { toast } from '@/components/ui/ToastProvider';

const AuthPage: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { login, signup } = useAuth();

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (user.onboarded) {
        navigate(from || '/editor', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  if (isLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (authMode === 'signup') {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      toast.error(message.replace('ApiError:', '').trim());
      setIsProcessing(false);
    }
  };

  const handleGoogleAuth = () => {
    // Navigate to Google OAuth endpoint (server-side flow)
    window.location.href = authApi.googleAuthUrl;
  };

  return (
    <div className="min-h-screen bg-frames-base flex flex-col-reverse md:flex-row relative overflow-hidden font-sans selection:bg-white/20">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-white/5 blur-[100px] pointer-events-none" />

      {/* Left: Cinematic Branding */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-24 relative z-10">
        <BrandLogo />

        {/* Hero */}
        <div className="py-12 md:py-0 max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[80px] font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter mb-8 leading-[1.0]"
          >
            Craft a portfolio <br />
            that looks as premium <br />
            as your edits.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-frames-text-muted text-xl font-light leading-relaxed max-w-md"
          >
            Built for all creatives—from photographers to motion designers—to showcase their work without compromise.
          </motion.p>
        </div>

        {/* Footer */}
        <div className="flex gap-6 text-[10px] font-display font-bold uppercase tracking-[0.2em] text-frames-text-subtle">
          <span>© FRAMES STUDIO</span>
          <span>CRAFTED FOR CREATIVES</span>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md glass p-10 md:p-14 rounded-3xl shadow-cinematic-lg"
        >
          {/* Tab Switcher */}
          <div className="mb-8 flex gap-4 border-b border-zinc-800 pb-1">
            <button
              onClick={() => setAuthMode('login')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-1.5 ${
                authMode === 'login'
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-1.5 ${
                authMode === 'signup'
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {authMode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    label="Display Name"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Email"
              type="email"
              placeholder="creative@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-zinc-500 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>



            {/* Actions */}
            <div className="pt-8 space-y-4">
              <Button
                type="submit"
                className="w-full py-6 text-sm font-display tracking-widest uppercase shadow-cinematic-hover hover:scale-[1.02] transition-transform duration-500 ease-out"
                loading={isProcessing}
              >
                {authMode === 'login' ? 'Enter Studio' : 'Create Account'}
              </Button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-frames-border" />
                <span className="flex-shrink-0 mx-4 text-xs font-display tracking-widest text-frames-text-subtle uppercase">Or</span>
                <div className="flex-grow border-t border-frames-border" />
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full py-6 text-sm font-medium border-frames-border text-frames-text-muted hover:bg-white hover:text-black hover:border-white transition-all duration-500 ease-out"
                onClick={handleGoogleAuth}
                disabled={isProcessing}
              >
                Continue with Google
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
