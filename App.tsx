import React, { useState, useEffect, useRef } from 'react';
import { PortfolioView } from './components/PortfolioView';
import { EditorPanel } from './components/EditorPanel';
import { PortfolioData, INITIAL_DATA } from './types';
import { loadFromDB, saveToDB, decodeState, isConfigured, auth, loginWithEmail, signupWithEmail, loginWithGoogle, checkUsernameAvailable } from './utils';
import { Code, Database, Lock, ArrowRight, LayoutTemplate, Eye, EyeOff, HardDrive, Loader2, UserPlus, LogIn } from 'lucide-react';
import { Button } from './components/ui/Button';
import { onAuthStateChanged } from 'firebase/auth';

const safeSetHash = (hash: string) => {
  try { window.location.hash = hash; } catch (e) {}
};

const getHash = () => {
  try { return window.location.hash; } catch (e) { return ''; }
};

const App: React.FC = () => {
  const [route, setRoute] = useState<'home' | 'editor' | 'public'>('home');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  
  const [authUser, setAuthUser] = useState<any>(null);

  // Editor State
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    // Listen for Firebase Auth State
    const unsubscribe = isConfigured && auth ? onAuthStateChanged(auth, async (user) => {
        setAuthUser(user);
        if (user) {
             // If logged in, load THEIR data
             const userPortfolio = await loadFromDB(user.uid);
             if (userPortfolio) {
                 setData(userPortfolio);
                 setRoute('editor');
             } else {
                 // New user via Google Auth potentially, or data missing
                 const newProfile = { ...INITIAL_DATA, uid: user.uid, contactEmail: user.email || '' };
                 setData(newProfile);
                 setRoute('editor');
             }
        }
    }) : () => {};

    const initApp = async () => {
      setIsLoading(true);
      const hash = getHash();
      
      // Public Route Check (#username)
      if (hash && hash !== '#editor' && hash !== '#' && !hash.startsWith('#access_token')) {
          const slug = hash.replace('#', '');
          const publicData = await loadFromDB(slug);
          if (publicData) {
              setData(publicData);
              setRoute('public');
              document.title = `${publicData.name} - Portfolio`;
              setIsLoading(false);
              return;
          }
      }

      // If no public route, and not logged in via Firebase listener above
      setIsLoading(false);
    };

    initApp();
    return () => unsubscribe();
  }, []);

  // --- Auth Handlers ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthProcessing(true);

    try {
        if (authMode === 'signup') {
            // Check username availability first
            const available = await checkUsernameAvailable(username);
            if (!available) throw new Error("Username already taken.");

            const cred = await signupWithEmail(email, password);
            const newProfile: PortfolioData = {
                ...INITIAL_DATA,
                uid: cred.user.uid,
                username: username.toLowerCase().replace(/\s/g, ''),
                contactEmail: email,
                name: "Your Name"
            };
            await saveToDB(newProfile);
            setData(newProfile);
            setRoute('editor');
        } else {
            await loginWithEmail(email, password);
            // State change handled by onAuthStateChanged
        }
    } catch (err: any) {
        setAuthError(err.message.replace('Firebase:', '').trim());
        setIsAuthProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
      try {
          await loginWithGoogle();
          // State change handled by onAuthStateChanged
      } catch (e: any) {
          setAuthError("Google Sign-in failed");
      }
  }

  const handleLogout = async () => {
      if (auth) await auth.signOut();
      setAuthUser(null);
      setRoute('home');
      setData(null);
      safeSetHash('');
  };

  const handleSaveAndPublish = async (newData?: PortfolioData) => {
    const dataToSave = newData || data;
    if (!dataToSave) return;
    
    setIsSaving(true);
    try {
      await saveToDB(dataToSave);
      setHasUnsavedChanges(false);
      if (newData) setData(newData);
      setTimeout(() => setIsSaving(false), 800);
    } catch (e) {
      console.error("Save failed", e);
      setIsSaving(false);
      alert("Failed to save.");
    }
  };

  if (isLoading) {
      return (
          <div className="h-screen bg-black text-white flex flex-col gap-4 items-center justify-center font-display">
              <Loader2 size={40} className="text-indigo-500 animate-spin" />
          </div>
      );
  }

  // --- VIEW: PUBLIC ---
  if (route === 'public' && data) {
    return (
        <>
            <PortfolioView data={data} />
            <div className="fixed bottom-6 right-6 z-50">
               <Button variant="secondary" size="sm" onClick={() => { safeSetHash(''); window.location.reload(); }} className="shadow-2xl opacity-50 hover:opacity-100 backdrop-blur-md bg-black/50">
                 Create Your Own
               </Button>
            </div>
        </>
    );
  }

  // --- VIEW: EDITOR ---
  if (route === 'editor' && data) {
    return (
      <div className="h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row">
        {/* Mobile Overlay */}
        <div className={`fixed inset-0 bg-black/80 z-40 md:hidden transition-opacity ${showMobileEditor ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowMobileEditor(false)} />

        {/* Sidebar */}
        <div className={`fixed md:relative inset-y-0 left-0 z-50 bg-zinc-950 w-[85vw] md:w-[420px] border-r border-zinc-800 flex-shrink-0 transition-transform duration-300 transform shadow-2xl ${showMobileEditor ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <EditorPanel 
            data={data} 
            onChange={(d) => { setData(d); setHasUnsavedChanges(true); }} 
            onPublish={() => handleSaveAndPublish()}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            onLogout={handleLogout}
          />
          <button onClick={() => setShowMobileEditor(false)} className="md:hidden absolute top-4 right-4 text-zinc-500">✕</button>
        </div>

        {/* Preview */}
        <div className="flex-1 h-full relative bg-zinc-950 overflow-hidden flex flex-col">
          <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 z-30">
            <Button variant="secondary" size="sm" className="md:hidden" onClick={() => setShowMobileEditor(true)} icon={<Code size={14}/>}>Edit</Button>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-600">
                {isConfigured ? <Database size={12} /> : <HardDrive size={12} />}
                {isSaving ? 'Syncing...' : 'Live Preview'}
            </div>
            <Button variant={hasUnsavedChanges ? "primary" : "secondary"} size="sm" onClick={() => handleSaveAndPublish()} className={hasUnsavedChanges ? "animate-pulse" : ""}>
                 {isSaving ? 'Publishing...' : 'Save Changes'}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-black">
             <div className="min-h-full w-full h-full shadow-2xl">
               <PortfolioView data={data} isPreview={true} />
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: LOGIN / HOME ---
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
       
       <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="mb-10 text-center">
             <div className="relative inline-block">
                <h1 className="text-6xl md:text-8xl font-display font-black text-white tracking-tighter mb-2">FRAMES</h1>
                <span className="absolute -bottom-4 right-0 md:right-0 -rotate-3 hover:animate-wiggle cursor-default bg-white text-black text-[10px] md:text-xs font-bold tracking-widest px-3 py-1 font-mono shadow-[4px_4px_0px_0px_#52525b] transition-all">
                   BY VARUN
                </span>
             </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full">
             <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-2">
                 <button onClick={() => setAuthMode('login')} className={`flex-1 pb-2 text-sm font-bold transition-colors ${authMode === 'login' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-500'}`}>Log In</button>
                 <button onClick={() => setAuthMode('signup')} className={`flex-1 pb-2 text-sm font-bold transition-colors ${authMode === 'signup' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-500'}`}>Sign Up</button>
             </div>
             
             <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase font-bold">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none" placeholder="unique_handle" required />
                    </div>
                )}
                <div className="space-y-2">
                   <label className="text-xs text-zinc-500 uppercase font-bold">Email</label>
                   <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none" placeholder="hello@example.com" required />
                </div>
                <div className="space-y-2">
                   <label className="text-xs text-zinc-500 uppercase font-bold">Password</label>
                   <div className="relative">
                       <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none pr-10" placeholder="••••••••" required />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                   </div>
                </div>

                {authError && <div className="text-red-500 text-xs text-center py-2 bg-red-500/10 rounded border border-red-500/20">{authError}</div>}

                <Button className="w-full mt-4" size="lg" disabled={isAuthProcessing}>
                   {isAuthProcessing ? <Loader2 className="animate-spin"/> : (authMode === 'login' ? 'Enter Studio' : 'Create Account')}
                </Button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span></div>
                </div>

                <Button type="button" variant="secondary" className="w-full" onClick={handleGoogleAuth}>Google</Button>
             </form>
          </div>
       </div>
    </div>
  );
};

export default App;