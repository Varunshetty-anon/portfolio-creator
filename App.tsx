import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioView } from './features/portfolio/PortfolioView';
import { EditorPanel } from './features/editor/EditorPanel';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { PortfolioData, INITIAL_DATA } from './types';
import { 
    loadEditorState, 
    saveDraft, 
    publishPortfolio, 
    completeOnboarding, 
    ensureUserProfile, 
    isConfigured, 
    auth, 
    loginWithEmail, 
    signupWithEmail, 
    loginWithGoogle, 
    loginWithGoogleRedirect,
    checkUsernameAvailable, 
    deletePortfolioFromDB, 
    deleteUserAuth,
    subscribeToPublicPortfolio 
} from './lib/utils';
import { Loader2, Eye, EyeOff, PenTool, AlertCircle, RefreshCw, LogOut, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';

const App: React.FC = () => {
  const [route, setRoute] = useState<'home' | 'editor' | 'onboarding' | 'public' | 'error'>('home');
  const [editorViewMode, setEditorViewMode] = useState<'edit' | 'preview'>('edit');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Studio...');
  
  // Editor States
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const dataRef = useRef<PortfolioData | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    // 1. PUBLIC ROUTING CHECK (CRITICAL)
    // We check this FIRST. If it matches, we subscribe and RETURN immediately.
    // This ensures no Auth logic runs for public viewers.
    const path = window.location.pathname;
    const match = path.match(/^\/v\/([^/]+)/);
    
    if (match) {
        const slug = match[1];
        setLoadingMessage('Loading Portfolio...');
        // We set loading true here to prevent any flash of Home/Login
        setIsLoading(true);

        // Subscribe to real-time updates for the public portfolio
        const unsubscribe = subscribeToPublicPortfolio(slug, (publicData) => {
             if (publicData) {
                 setData(publicData);
                 setRoute('public');
             } else {
                 setFatalError("Portfolio not found or is not published yet.");
                 setRoute('error');
             }
             setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }

    // 2. AUTH & EDITOR ROUTING
    // Only runs if NOT on a public route.
    let unsubscribeAuth: () => void;

    if (isConfigured && auth) {
        // Handle Redirect Results (for Google Login)
        getRedirectResult(auth).catch(e => console.warn("Redirect check:", e));

        unsubscribeAuth = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                setLoadingMessage('Syncing Profile...');
                try {
                    const userProfile = await ensureUserProfile(user);
                    
                    if (!userProfile.onboarded) {
                            const cleanUsername = (user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'user').toLowerCase() + Math.floor(Math.random()*1000);
                            const initialData: PortfolioData = { 
                            ...INITIAL_DATA, 
                            uid: user.uid, 
                            contactEmail: user.email || '', 
                            username: cleanUsername,
                            name: user.displayName || ''
                        };
                        setData(initialData);
                        setRoute('onboarding');
                    } else {
                        const draftData = await loadEditorState(user.uid);
                        setData(draftData || INITIAL_DATA);
                        setRoute('editor');
                    }
                    setFatalError(null);
                } catch (e: any) {
                    console.error("Auth load error", e);
                    setFatalError("Failed to load your profile. Please check your connection.");
                    setRoute('error');
                } finally {
                    setIsAuthProcessing(false); 
                    setIsLoading(false);
                }
            } else {
                setRoute('home');
                setData(null);
                setIsAuthProcessing(false);
                setIsLoading(false);
            }
        });
    } else {
        setIsLoading(false);
    }

    return () => { if (unsubscribeAuth) unsubscribeAuth(); };
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthProcessing(true);
    try {
        if (authMode === 'signup') {
            const available = await checkUsernameAvailable(username);
            if (!available) throw new Error("Username taken.");
            await signupWithEmail(email, password);
        } else {
            await loginWithEmail(email, password);
        }
    } catch (err: any) {
        setAuthError(err.message.replace('Firebase:', '').trim());
        setIsAuthProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
      if (isAuthProcessing) return;
      setAuthError('');
      setIsAuthProcessing(true);
      try {
          await loginWithGoogle();
          // Auth state change listener will handle the rest
      } catch (e: any) { 
          let msg = e.message;
          console.error("Google Auth Error:", e);
          if (msg.includes('popup-closed-by-user') || msg.includes('popup-blocked') || msg.includes('cancelled')) {
             setAuthError("Sign-in cancelled or popups blocked.");
          } else {
             setAuthError("Google Sign-in failed. Please try again or use email."); 
          }
          setIsAuthProcessing(false);
      }
  };

  const handleGoogleRedirect = async () => {
      if (isAuthProcessing) return;
      setAuthError('');
      setIsAuthProcessing(true);
      try {
          await loginWithGoogleRedirect();
      } catch (e: any) {
          setAuthError(e.message);
          setIsAuthProcessing(false);
      }
  }

  const handleSaveDraft = async () => {
    if (!dataRef.current || !dataRef.current.uid) return;
    setIsSaving(true);
    try {
      await saveDraft(dataRef.current.uid, dataRef.current);
      setHasUnsavedChanges(false);
      setIsSaving(false);
    } catch (e: any) {
      console.error("Save failed: ", e);
      setIsSaving(false);
      throw e;
    }
  };

  const handlePublish = async () => {
    if (!dataRef.current || !dataRef.current.uid) return;
    setIsSaving(true);
    try {
        await publishPortfolio(dataRef.current.uid, dataRef.current);
        const updated = await loadEditorState(dataRef.current.uid);
        if (updated) setData(updated);
        setHasUnsavedChanges(false);
        setIsSaving(false);
    } catch (e: any) {
        console.error("Publish failed: ", e);
        setIsSaving(false);
        throw e;
    }
  };

  const handleOnboardingComplete = async (completedData: PortfolioData) => {
      if (!auth?.currentUser) return;
      await completeOnboarding(auth.currentUser.uid, completedData);
      const draftData = await loadEditorState(auth.currentUser.uid);
      setData(draftData);
      setRoute('editor');
  };

  const handleLogout = async () => {
      await auth?.signOut();
      setRoute('home');
      setData(null);
  };

  // --- RENDER STATES ---

  if (isLoading) {
      return (
          <div className="h-screen bg-[#050505] flex flex-col items-center justify-center font-sans text-white">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full mb-6" 
              />
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 animate-pulse">{loadingMessage}</p>
          </div>
      );
  }

  if (route === 'error' && fatalError) {
      return (
          <div className="h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20">
                  <AlertCircle size={24} />
              </div>
              <h2 className="text-xl font-display font-medium text-white mb-2">Portfolio Unavailable</h2>
              <p className="text-zinc-500 text-sm max-w-sm mb-8 leading-relaxed">{fatalError}</p>
              <div className="flex gap-4">
                  <Button variant="outline" onClick={() => window.location.href = '/'} icon={<ArrowRight size={14}/>}>Go Home</Button>
              </div>
          </div>
      );
  }

  if (route === 'public' && data) {
      return <PortfolioView key={data.meta?.publish?.liveVersion || 'latest'} data={data} isPreview={false} />;
  }

  if (route === 'onboarding' && data) {
      return <OnboardingFlow data={data} onComplete={handleOnboardingComplete} />;
  }

  if (route === 'editor' && data) {
    if (editorViewMode === 'preview') {
        return (
            <div className="relative min-h-screen w-full bg-[#050505]">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed bottom-6 right-6 z-[200]">
                    <Button onClick={() => setEditorViewMode('edit')} className="rounded-full shadow-2xl px-6 py-3 bg-white text-black hover:scale-105 transition-transform font-bold tracking-tight">
                        <PenTool size={16} className="mr-2" /> Back to Editor
                    </Button>
                </motion.div>
                <PortfolioView data={data} isPreview={true} />
            </div>
        );
    }

    return (
      <EditorPanel 
        data={data} 
        onChange={(d) => { setData(d); setHasUnsavedChanges(true); }} 
        onSave={handleSaveDraft}
        onPublish={handlePublish}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onLogout={handleLogout}
        onDeleteAccount={async () => {
            try {
                await deletePortfolioFromDB(data.uid!);
                await deleteUserAuth();
                window.location.reload();
            } catch(e) {
                console.error("Delete failed", e);
            }
        }}
        onPreview={() => setEditorViewMode('preview')}
      />
    );
  }

  // DEFAULT: HOME / LOGIN
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row relative overflow-hidden font-sans selection:bg-white/20">
       
       {/* Left Side - Brand */}
       <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 relative z-10 border-b md:border-b-0 md:border-r border-zinc-900/50">
           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
               <span className="font-display font-black text-black text-lg">F</span>
           </div>
           
           <div className="py-12 md:py-0">
               <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight mb-6 leading-[0.9]">
                   Your Portfolio.<br/>
                   <span className="text-zinc-600">Reimagined.</span>
               </h1>
               <p className="text-zinc-400 text-lg max-w-md font-light leading-relaxed">
                   Frames is the premium portfolio builder designed specifically for video editors and motion designers. 
               </p>
           </div>

           <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
               <span>© FRAMES STUDIO</span>
               <span>VARUN</span>
           </div>
       </div>

       {/* Right Side - Auth */}
       <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950/30">
           <div className="w-full max-w-sm">
                <div className="mb-8 flex gap-4 border-b border-zinc-800 pb-1">
                    <button onClick={() => setAuthMode('login')} className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-1.5 ${authMode === 'login' ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>Sign In</button>
                    <button onClick={() => setAuthMode('signup')} className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-1.5 ${authMode === 'signup' ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>Create Account</button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-5">
                    <AnimatePresence mode="popLayout">
                        {authMode === 'signup' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <Input label="Username" placeholder="yourname" value={username} onChange={e => setUsername(e.target.value)} required className="bg-transparent" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <Input label="Email" type="email" placeholder="editor@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-transparent" />
                    
                    <div className="relative">
                        <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="bg-transparent" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-zinc-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                    </div>
                    
                    {authError && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                            <p className="text-red-400 text-xs">{authError}</p>
                            {/* Fallback to redirect if popup fails explicitly */}
                            <button type="button" onClick={handleGoogleRedirect} className="mt-2 text-xs underline text-red-300 hover:text-white">Try Redirect Method</button>
                        </motion.div>
                    )}
                    
                    <div className="pt-4 space-y-3">
                        <Button className="w-full py-6 text-sm font-medium bg-white text-black hover:bg-zinc-200" disabled={isAuthProcessing}>
                            {isAuthProcessing ? <Loader2 className="animate-spin" size={18}/> : (authMode === 'login' ? 'Enter Studio' : 'Get Started')}
                        </Button>
                        <Button type="button" variant="outline" className="w-full py-6 text-sm font-medium border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700" onClick={handleGoogleAuth} disabled={isAuthProcessing}>
                            <span className="flex items-center gap-2"><Sparkles size={14}/> Continue with Google</span>
                        </Button>
                    </div>
                </form>
           </div>
       </div>
    </div>
  );
};

export default App;