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
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { authApi } from '@/lib/api';

const AuthPage: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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
    setError('');
    setIsProcessing(true);

    try {
      if (authMode === 'signup') {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message.replace('ApiError:', '').trim());
      setIsProcessing(false);
    }
  };

  const handleGoogleAuth = () => {
    // Navigate to Google OAuth endpoint (server-side flow)
    window.location.href = authApi.googleAuthUrl;
  };

  return (
    <div className="min-h-screen bg-frames-bg flex flex-col md:flex-row relative overflow-hidden font-sans selection:bg-white/20">
      {/* Left: Branding */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 relative z-10 border-b md:border-b-0 md:border-r border-zinc-900/50">
        {/* Logo */}
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <span className="font-display font-black text-black text-lg">F</span>
        </div>

        {/* Hero */}
        <div className="py-12 md:py-0">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight mb-6 leading-[0.9]"
          >
            Your Portfolio.
            <br />
            <span className="text-zinc-600">Reimagined.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-lg max-w-md font-light leading-relaxed"
          >
            Frames is the premium portfolio builder designed specifically for
            video editors and motion designers.
          </motion.p>
        </div>

        {/* Footer */}
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          <span>© FRAMES STUDIO</span>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-sm"
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
              placeholder="editor@example.com"
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
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-red-500/5 border border-red-500/10"
              >
                <p className="text-red-400 text-xs">{error}</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                className="w-full py-6 text-sm font-medium"
                loading={isProcessing}
              >
                {authMode === 'login' ? 'Enter Studio' : 'Get Started'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full py-6 text-sm font-medium border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700"
                onClick={handleGoogleAuth}
                disabled={isProcessing}
                icon={<Sparkles size={14} />}
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
