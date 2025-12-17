import React, { useState, useEffect, useRef } from 'react';
// Added motion import
import { motion } from 'framer-motion';
import { PortfolioView } from './components/PortfolioView';
import { EditorPanel } from './components/EditorPanel';
import { OnboardingFlow } from './components/OnboardingFlow';
import { PortfolioData, INITIAL_DATA, DEMO_DATA } from './types';
import { loadFromDB, saveToDB, isConfigured, auth, loginWithEmail, signupWithEmail, loginWithGoogle, checkUsernameAvailable, checkPortfolioReadiness, deletePortfolioFromDB, deleteUserAuth } from './utils';
import { Loader2, ShieldAlert, X, PenTool, Eye, EyeOff } from 'lucide-react';
import { Button } from './components/ui/Button';
import { onAuthStateChanged } from 'firebase/auth';

const getHash = () => {
  try { return window.location.hash; } catch (e) { return ''; }
};

const App: React.FC = () => {
  const [route, setRoute] = useState<'home' | 'editor' | 'public'>('home');
  const [editorViewMode, setEditorViewMode] = useState<'edit' | 'preview'>('edit');
  
  const [data, setData] = useState<PortfolioData | null>(null);
  const dataRef = useRef<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  
  // Editor State
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // --- Initialization Logic ---
  useEffect(() => {
    const initApp = async () => {
        setIsLoading(true);
        
        const path = window.location.pathname;
        const hash = getHash();
        let slug = '';

        if (hash && hash !== '#editor' && hash !== '#' && !hash.startsWith('#access_token')) {
            slug = hash.replace('#', '').split('/')[0].split('?')[0];
        } 
        else if (path.includes('/v/')) {
            slug = path.split('/v/')[1].split('/')[0].split('?')[0];
        }

        if (slug && slug !== 'editor') {
            try {
                // Force a fresh load from the DB for public views
                const publicData = await loadFromDB(slug);
                if (publicData) {
                    setData(publicData);
                    setRoute('public');
                    document.title = `${publicData.name} - Portfolio`;
                    setIsLoading(false);
                    return;
                }
            } catch (error: any) {
                console.error("Failed to load public portfolio:", error);
                if (error.code === 'permission-denied' || error.message.includes('permission')) {
                    setData(DEMO_DATA);
                    setRoute('public');
                    setPermissionError(true);
                    setIsDemoMode(true);
                    setIsLoading(false);
                    return;
                }
            }
        }

        if (isConfigured && auth) {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        const userPortfolio = await loadFromDB(user.uid);
                        if (userPortfolio) {
                            setData(userPortfolio);
                            if (!userPortfolio.name) setShowOnboarding(true);
                        } else {
                            // If user exists in Auth but not in DB yet (e.g., interrupted signup)
                            const cleanUsername = (user.displayName || user.email?.split('@')[0] || 'user').toLowerCase().replace(/\s/g, '');
                            const newProfile = { ...INITIAL_DATA, uid: user.uid, contactEmail: user.email || '', username: cleanUsername };
                            setData(newProfile);
                            setShowOnboarding(true);
                        }
                        setRoute('editor');
                    } catch (e: any) {
                         if (e.code === 'permission-denied' || e.message.includes('permission')) {
                             setPermissionError(true);
                             const localProfile = { ...INITIAL_DATA, uid: user.uid, contactEmail: user.email || '' };
                             setData(localProfile);
                             setRoute('editor');
                             if (!localProfile.name) setShowOnboarding(true);
                         }
                    }
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
            if (!available) throw new Error("Username already taken.");

            const cred = await signupWithEmail(email, password);
            const newProfile: PortfolioData = {
                ...INITIAL_DATA,
                uid: cred.user.uid,
                username: username.toLowerCase().replace(/\s/g, ''),
                contactEmail: email,
                name: "" 
            };
            // Important: Set data locally first, then let the observer handle state
            setData(newProfile);
            await saveToDB(newProfile);
            setShowOnboarding(true);
            setRoute('editor');
        } else {
            await loginWithEmail(email, password);
        }
    } catch (err: any) {
        setAuthError(err.message.replace('Firebase:', '').trim());
        setIsAuthProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
      setAuthError('');
      try {
          const result = await loginWithGoogle();
          // Initial save for Google users to set basic fields if they are new
          const user = result.user;
          const existing = await loadFromDB(user.uid);
          if (!existing) {
              const cleanUsername = (user.displayName || user.email?.split('@')[0] || 'user').toLowerCase().replace(/\s/g, '');
              const newProfile = { ...INITIAL_DATA, uid: user.uid, contactEmail: user.email || '', username: cleanUsername, name: user.displayName || '' };
              setData(newProfile);
              await saveToDB(newProfile);
          }
      } catch (e: any) {
          if (e.code === 'auth/unauthorized-domain') {
              setAuthError(`Domain not authorized. Check Firebase settings.`);
          } else {
              setAuthError(e.message || "Google Sign-in failed.");
          }
      }
  }

  const handleLogout = async () => {
      if (auth) await auth.signOut();
      setRoute('home');
      setData(null);
      setShowOnboarding(false);
      window.location.hash = '';
      window.location.pathname = '/';
  };

  const handleDeleteAccount = async () => {
      if (!data?.uid || !auth?.currentUser) return;
      if (!window.confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete your portfolio and all project links.")) return;
      
      try {
          setIsLoading(true);
          // Delete from Firestore
          await deletePortfolioFromDB(data.uid);
          // Delete from Auth
          await deleteUserAuth();
          
          setRoute('home');
          setData(null);
          setIsLoading(false);
          window.location.hash = '';
          window.location.pathname = '/';
          alert("Account and all data successfully erased.");
      } catch (e: any) {
          setIsLoading(false);
          if (e.code === 'auth/requires-recent-login') {
              alert("Security sensitive action: Please log out and log back in to verify identity before deleting account.");
          } else {
              console.error(e);
              alert("Account deletion failed. Error: " + e.message);
          }
      }
  };

  const handleSaveAndPublish = async (newData?: PortfolioData) => {
    if (route === 'public') return;
    const dataToSave = newData || dataRef.current;
    if (!dataToSave) return;
    
    setIsSaving(true);
    try {
      // Use standard firestore call
      await saveToDB(dataToSave);
      
      setHasUnsavedChanges(false);
      if (newData) setData(newData);
      
      // Keep URL hash in sync with username for direct sharing
      if (dataToSave.username && window.location.hash !== `#${dataToSave.username}`) {
         window.location.hash = dataToSave.username;
      }
      
      // Artificial delay for UI polish
      setTimeout(() => setIsSaving(false), 800);
    } catch (e: any) {
      setIsSaving(false);
      console.error("Save failed:", e);
      if (e.code === 'permission-denied') setPermissionError(true);
      alert("Error saving: " + e.message);
    }
  };

  const handleOnboardingComplete = async (completedData: PortfolioData) => {
      setData(completedData);
      setShowOnboarding(false);
      await handleSaveAndPublish(completedData);
  };

  const handlePreviewToggle = () => {
      if (!data) return;
      const { isReady } = checkPortfolioReadiness(data);
      if (isReady) {
          setEditorViewMode('preview');
      } else {
          alert("Please complete your portfolio first (Bio, Showreel, 1 Project, Profile Image).");
      }
  }

  if (isLoading) {
      return (
          <div className="h-screen bg-black text-white flex flex-col gap-8 items-center justify-center font-display">
              <div className="relative w-24 h-24">
                  <motion.div
                    className="absolute inset-0 border-8 border-indigo-500/10 rounded-full"
                  />
                  <motion.div
                    className="absolute inset-0 border-8 border-t-indigo-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2"
              >
                  <p className="text-xl font-black text-white tracking-widest uppercase">FRAMES</p>
                  <p className="text-zinc-600 font-bold text-[10px] tracking-[0.4em] uppercase">Initializing Studio</p>
              </motion.div>
          </div>
      );
  }

  if (route === 'public' && data) {
    return (
        <div className="relative min-h-screen bg-black">
             {permissionError && isDemoMode && (
               <div className="fixed top-0 left-0 right-0 bg-indigo-600 text-white text-xs py-2 px-4 text-center z-[100] font-medium shadow-lg">
                   Preview Mode: Showing demo portfolio.
               </div>
            )}
            <div className={permissionError && isDemoMode ? "pt-8" : ""}>
                <PortfolioView data={data} isPreview={false} />
            </div>
        </div>
    );
  }

  if (route === 'editor' && data) {
    if (showOnboarding) {
        return <OnboardingFlow data={data} onComplete={handleOnboardingComplete} />;
    }
    if (editorViewMode === 'preview') {
        return (
            <div className="relative min-h-screen w-full bg-black">
                <div className="fixed bottom-6 right-6 z-[200]">
                    <Button onClick={() => setEditorViewMode('edit')} className="shadow-2xl border border-zinc-700 bg-zinc-900/90 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all rounded-full px-6 py-4 flex items-center gap-2 group">
                        <PenTool size={18} className="group-hover:rotate-12 transition-transform"/> 
                        <span className="font-bold tracking-wide">Back to Editor</span>
                    </Button>
                </div>
                <PortfolioView data={data} isPreview={true} />
            </div>
        )
    }
    return (
      <div className="h-[100dvh] w-screen bg-black overflow-hidden flex flex-col relative">
         {permissionError && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-900/90 border border-red-500 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs backdrop-blur-md">
                 <ShieldAlert size={14}/><span>Database Locked</span><button onClick={() => setPermissionError(false)}><X size={14}/></button>
             </div>
         )}
         <div className="flex-1 w-full h-full overflow-hidden">
             <EditorPanel 
                data={data} 
                onChange={(d) => { setData(d); setHasUnsavedChanges(true); }} 
                onPublish={() => handleSaveAndPublish()}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
                onPreview={handlePreviewToggle}
             />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute inset-0 bg-black">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
       </div>
       <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="mb-12 flex flex-col items-center select-none">
              <h1 className="text-7xl md:text-9xl font-display font-black text-white tracking-tighter leading-[0.8]">FRAMES</h1>
              <div className="relative"><div className="transform -rotate-3 bg-white text-black px-4 py-1 font-display font-bold text-sm tracking-[0.2em] uppercase shadow-2xl">by VARUN</div></div>
           </div>
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full">
             <div className="flex gap-4 mb-8 bg-black/40 p-1 rounded-lg">
                 <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'login' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Log In</button>
                 <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'signup' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Sign Up</button>
             </div>
             <form onSubmit={handleAuth} className="space-y-5">
                {authMode === 'signup' && (
                    <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" placeholder="username" required />
                    </div>
                )}
                <div className="space-y-2">
                   <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Email</label>
                   <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none transition-all" placeholder="hello@example.com" required />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Password</label>
                   <div className="relative">
                       <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none pr-10 transition-all" placeholder="••••••••" required />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                           {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                   </div>
                </div>
                {authError && <div className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded border border-red-500/20">{authError}</div>}
                <Button className="w-full py-4 text-sm tracking-wide" size="lg" disabled={isAuthProcessing}>
                   {isAuthProcessing ? <Loader2 className="animate-spin"/> : (authMode === 'login' ? 'Enter Studio' : 'Create Account')}
                </Button>
                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider"><span className="bg-[#0c0c0e] px-2 text-zinc-600">Or continue with</span></div>
                </div>
                <Button type="button" variant="secondary" className="w-full py-3" onClick={handleGoogleAuth}>Sign in with Google</Button>
             </form>
          </div>
       </div>
    </div>
  );
};

export default App;
