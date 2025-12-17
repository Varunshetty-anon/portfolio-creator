
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PortfolioView } from './components/PortfolioView';
import { EditorPanel } from './components/EditorPanel';
import { OnboardingFlow } from './components/OnboardingFlow';
import { PortfolioData, INITIAL_DATA, DEMO_DATA } from './types';
import { loadFromDB, saveToDB, isConfigured, auth, loginWithEmail, signupWithEmail, loginWithGoogle, checkUsernameAvailable, checkPortfolioReadiness, deletePortfolioFromDB, deleteUserAuth } from './utils';
import { Loader2, ShieldAlert, X, PenTool, Eye, EyeOff } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [route, setRoute] = useState<'home' | 'editor' | 'public'>('home');
  const [editorViewMode, setEditorViewMode] = useState<'edit' | 'preview'>('edit');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
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

  const dataRef = useRef<PortfolioData | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const initApp = async () => {
        setIsLoading(true);
        const hash = window.location.hash.replace('#', '');
        const path = window.location.pathname;
        let slug = hash || (path.includes('/v/') ? path.split('/v/')[1] : null);

        // If visiting a public link
        if (slug && slug !== 'editor') {
            const publicData = await loadFromDB(slug);
            if (publicData) {
                setData(publicData);
                setRoute('public');
                setIsLoading(false);
                return;
            }
        }

        // Check login state
        if (isConfigured && auth) {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userPortfolio = await loadFromDB(user.uid);
                    if (userPortfolio) {
                        setData(userPortfolio);
                        if (!userPortfolio.name) setShowOnboarding(true);
                    } else {
                        // User exists but no portfolio document yet
                        const cleanUsername = (user.email?.split('@')[0] || 'user' + Math.floor(Math.random()*1000)).toLowerCase();
                        const newProfile = { ...INITIAL_DATA, uid: user.uid, contactEmail: user.email || '', username: cleanUsername };
                        setData(newProfile);
                        setShowOnboarding(true);
                    }
                    setRoute('editor');
                } else {
                    setRoute('home');
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    };
    initApp();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthProcessing(true);
    try {
        if (authMode === 'signup') {
            const available = await checkUsernameAvailable(username);
            if (!available) throw new Error("Username taken.");
            const cred = await signupWithEmail(email, password);
            const newProfile: PortfolioData = { ...INITIAL_DATA, uid: cred.user.uid, username: username.toLowerCase(), contactEmail: email };
            setData(newProfile);
            await saveToDB(newProfile);
            setShowOnboarding(true);
        } else {
            await loginWithEmail(email, password);
        }
    } catch (err: any) {
        setAuthError(err.message.replace('Firebase:', '').trim());
    } finally {
        setIsAuthProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
      try {
          const res = await loginWithGoogle();
          const existing = await loadFromDB(res.user.uid);
          if (!existing) {
              const cleanUsername = (res.user.displayName?.split(' ')[0] || res.user.email?.split('@')[0] || 'user').toLowerCase() + Math.floor(Math.random()*100);
              const newProfile = { ...INITIAL_DATA, uid: res.user.uid, contactEmail: res.user.email || '', username: cleanUsername, name: res.user.displayName || '' };
              setData(newProfile);
              await saveToDB(newProfile);
          }
      } catch (e: any) { setAuthError(e.message); }
  };

  const handleSaveAndPublish = async () => {
    if (!dataRef.current) return;
    setIsSaving(true);
    try {
      await saveToDB(dataRef.current);
      setHasUnsavedChanges(false);
      // Ensure the URL hash matches the username for instant sharing update
      if (dataRef.current.username) window.location.hash = dataRef.current.username;
      setTimeout(() => setIsSaving(false), 500);
    } catch (e: any) {
      alert("Save failed: " + e.message);
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
      await auth?.signOut();
      window.location.hash = '';
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

  if (route === 'public' && data) return <PortfolioView data={data} />;

  if (route === 'editor' && data) {
    if (showOnboarding) return <OnboardingFlow data={data} onComplete={(d) => { setData(d); setShowOnboarding(false); saveToDB(d); }} />;
    
    if (editorViewMode === 'preview') {
        return (
            <div className="relative h-screen w-full bg-black overflow-hidden">
                <Button onClick={() => setEditorViewMode('edit')} className="fixed bottom-8 right-8 z-[200] rounded-full shadow-2xl px-6 py-3 bg-zinc-900 text-white border border-zinc-700 hover:bg-white hover:text-black transition-all">
                    <PenTool size={18} className="mr-2" /> Back to Editor
                </Button>
                <PortfolioView data={data} isPreview />
            </div>
        );
    }

    return (
      <EditorPanel 
        data={data} 
        onChange={(d) => { setData(d); setHasUnsavedChanges(true); }} 
        onPublish={handleSaveAndPublish}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onLogout={handleLogout}
        onDeleteAccount={async () => {
            if(window.confirm("Permanent Wipe. Are you sure?")) {
                await deletePortfolioFromDB(data.uid!);
                await deleteUserAuth();
                window.location.reload();
            }
        }}
        onPreview={() => setEditorViewMode('preview')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent)] animate-pulse" />
       <div className="w-full max-md bg-zinc-900/50 backdrop-blur-2xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="text-center mb-10">
              <h1 className="text-5xl font-display font-black text-white tracking-tighter">FRAMES</h1>
              <p className="text-zinc-500 text-xs mt-2 uppercase tracking-[0.3em]">by VARUN</p>
          </div>
          <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-8">
              <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>LOGIN</button>
              <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'signup' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>SIGNUP</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
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
