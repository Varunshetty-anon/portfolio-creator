import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PortfolioView } from './features/portfolio/PortfolioView';
import { EditorPanel } from './features/editor/EditorPanel';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { PortfolioData, INITIAL_DATA } from './types';
import { 
    loadPublicPortfolio, 
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
    checkUsernameAvailable, 
    deletePortfolioFromDB, 
    deleteUserAuth 
} from './lib/utils';
import { Loader2, Eye, EyeOff, PenTool } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { onAuthStateChanged, User } from 'firebase/auth';

const App: React.FC = () => {
  const [route, setRoute] = useState<'home' | 'editor' | 'onboarding' | 'public'>('home');
  const [editorViewMode, setEditorViewMode] = useState<'edit' | 'preview'>('edit');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Ref to hold current data for sync operations
  const dataRef = useRef<PortfolioData | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const initApp = async () => {
        setIsLoading(true);
        const path = window.location.pathname;
        const hash = window.location.hash.replace('#', '');
        let slug = null;
        
        const pathMatch = path.match(/^\/v\/([^/]+)/);
        if (pathMatch) {
            slug = pathMatch[1];
        } else if (hash && !['editor', 'onboarding'].includes(hash)) {
            slug = hash;
        }

        if (slug) {
            console.log("Detected public slug:", slug);
            const publicData = await loadPublicPortfolio(slug);
            if (publicData) {
                setData(publicData);
                setRoute('public');
                setIsLoading(false);
                return;
            }
        }

        if (isConfigured && auth) {
            const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
                if (user) {
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
                    } catch (e: any) {
                        console.error("Auth load error", e);
                        setAuthError("Account initialization failed. " + e.message);
                        setIsAuthProcessing(false); 
                    }
                } else {
                    setRoute('home');
                    setIsAuthProcessing(false);
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setIsLoading(false);
        }
    };
    initApp();
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
      } catch (e: any) { 
          let msg = e.message;
          if (msg.includes('popup-closed-by-user')) msg = "Login cancelled.";
          if (msg.includes('network-request-failed')) msg = "Network error. Check your connection.";
          setAuthError(msg); 
          setIsAuthProcessing(false);
      }
  };

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
      window.location.hash = '';
      window.location.pathname = '/';
      window.location.reload();
  };

  if (isLoading) {
      return (
          <div className="h-screen bg-black flex flex-col items-center justify-center font-display text-white">
              <motion.div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs uppercase tracking-widest text-zinc-500">Loading Studio...</p>
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
            <div className="relative min-h-screen w-full bg-black">
                <Button onClick={() => setEditorViewMode('edit')} className="fixed bottom-8 right-8 z-[200] rounded-full shadow-2xl px-6 py-3 bg-zinc-900 text-white border border-zinc-700 hover:bg-white hover:text-black transition-all">
                    <PenTool size={18} className="mr-2" /> Back to Editor
                </Button>
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
            // Safety check handled by UI inside EditorPanel now
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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent)] animate-pulse" />
       <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-2xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="text-center mb-10">
              <h1 className="text-5xl font-display font-black text-white tracking-tighter">FRAMES</h1>
              <p className="text-zinc-500 text-xs mt-2 uppercase tracking-[0.3em]">by VARUN</p>
          </div>
          <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-8">
              <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>LOGIN</button>
              <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'signup' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>SIGNUP</button>
          </div>
          <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === 'signup' && <Input label="Username" placeholder="yourname" value={username} onChange={e => setUsername(e.target.value)} required />}
              <Input label="Email" type="email" placeholder="editor@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              <div className="relative">
                <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 bottom-2.5 text-zinc-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>
              {authError && <p className="text-red-500 text-[10px] uppercase font-bold text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">{authError}</p>}
              <Button className="w-full py-4 uppercase tracking-widest font-black" disabled={isAuthProcessing}>{isAuthProcessing ? <Loader2 className="animate-spin" /> : 'Enter Studio'}</Button>
              <div className="flex items-center gap-4 py-4"><div className="h-px flex-1 bg-zinc-800"/><span className="text-[10px] text-zinc-600 font-bold">OR</span><div className="h-px flex-1 bg-zinc-800"/></div>
              <Button type="button" variant="secondary" className="w-full py-3" onClick={handleGoogleAuth}>Google Account</Button>
          </form>
       </div>
    </div>
  );
};

export default App;