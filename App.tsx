import React, { useState, useEffect } from 'react';
import { PortfolioView } from './components/PortfolioView';
import { EditorPanel } from './components/EditorPanel';
import { OnboardingFlow } from './components/OnboardingFlow';
import { PortfolioData, INITIAL_DATA, DEMO_DATA } from './types';
import { loadFromDB, saveToDB, isConfigured, auth, loginWithEmail, signupWithEmail, loginWithGoogle, checkUsernameAvailable, checkPortfolioReadiness } from './utils';
import { Database, HardDrive, Loader2, Code, Eye, AlertCircle, X, ShieldAlert, ArrowLeft, PenTool } from 'lucide-react';
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
  // New view mode for editor: 'edit' or 'preview' (full screen)
  const [editorViewMode, setEditorViewMode] = useState<'edit' | 'preview'>('edit');
  
  const [data, setData] = useState<PortfolioData | null>(null);
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

  // --- Initialization Logic ---
  useEffect(() => {
    const initApp = async () => {
        setIsLoading(true);
        const hash = getHash();
        const isPublicRoute = hash && hash !== '#editor' && hash !== '#' && !hash.startsWith('#access_token');

        // 1. PUBLIC ROUTE (Priority: High) - No Auth Required
        if (isPublicRoute) {
            const slug = hash.replace('#', '');
            try {
                const publicData = await loadFromDB(slug);
                if (publicData) {
                    setData(publicData);
                    setRoute('public');
                    document.title = `${publicData.name} - Portfolio`;
                } else {
                    setRoute('home'); 
                }
            } catch (error: any) {
                console.error("Failed to load public portfolio:", error);
                if (error.code === 'permission-denied' || error.message.includes('permission')) {
                    console.warn("Falling back to Demo Mode due to permission error");
                    setData(DEMO_DATA);
                    setRoute('public');
                    setPermissionError(true);
                    setIsDemoMode(true);
                } else {
                    setRoute('home');
                }
            }
            setIsLoading(false);
            return;
        }

        // 2. EDITOR/HOME ROUTE - Auth Required
        if (isConfigured && auth) {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        const userPortfolio = await loadFromDB(user.uid);
                        if (userPortfolio) {
                            setData(userPortfolio);
                            if (!userPortfolio.name) setShowOnboarding(true);
                        } else {
                            // New User Setup
                            const newProfile = { ...INITIAL_DATA, uid: user.uid, contactEmail: user.email || '' };
                            setData(newProfile);
                            setShowOnboarding(true);
                        }
                        setRoute('editor');
                    } catch (e: any) {
                         console.error("Error loading user data:", e);
                         if (e.code === 'permission-denied' || e.message.includes('permission')) {
                             setPermissionError(true);
                             const localProfile = { ...INITIAL_DATA, uid: user.uid, contactEmail: user.email || '' };
                             setData(localProfile);
                             setRoute('editor');
                             if (!localProfile.name) setShowOnboarding(true);
                         }
                    }
                } else {
                    // Not logged in, and not on public route -> Home
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

  // --- Auth Handlers ---

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
                name: "" // Explicitly empty to trigger onboarding
            };
            setData(newProfile);
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
          await loginWithGoogle();
          // State change handled by onAuthStateChanged
      } catch (e: any) {
          console.error("Google Auth Error:", e);
          if (e.code === 'auth/unauthorized-domain') {
              const currentDomain = window.location.hostname;
              setAuthError(`Domain "${currentDomain}" is not authorized. Add it to Firebase Console > Authentication > Settings > Authorized Domains.`);
          } else if (e.code === 'auth/popup-closed-by-user') {
              setAuthError("Sign-in cancelled.");
          } else {
              setAuthError(e.message || "Google Sign-in failed. Please try again.");
          }
      }
  }

  const handleLogout = async () => {
      if (auth) await auth.signOut();
      setRoute('home');
      setData(null);
      setShowOnboarding(false);
      safeSetHash('');
  };

  const handleSaveAndPublish = async (newData?: PortfolioData) => {
    if (route === 'public') return;

    const dataToSave = newData || data;
    if (!dataToSave) return;
    
    setIsSaving(true);
    try {
      await saveToDB(dataToSave);
      setHasUnsavedChanges(false);
      if (newData) setData(newData);
      setTimeout(() => setIsSaving(false), 800);
    } catch (e: any) {
      console.error("Save failed", e);
      setIsSaving(false);
      if (e.code === 'permission-denied') {
          setPermissionError(true);
      } else {
          alert("Failed to save. Check your connection.");
      }
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
          alert("Please complete your portfolio first (Bio, Primary Tool, Socials, 1 Project)");
      }
  }

  if (isLoading) {
      return (
          <div className="h-screen bg-black text-white flex flex-col gap-4 items-center justify-center font-display">
              <Loader2 size={40} className="text-indigo-500 animate-spin" />
              <p className="text-zinc-500 animate-pulse">Loading Frames...</p>
          </div>
      );
  }

  // --- VIEW: PUBLIC (Read-Only) ---
  if (route === 'public' && data) {
    return (
        <div className="relative min-h-screen bg-black">
             {permissionError && isDemoMode && (
               <div className="fixed top-0 left-0 right-0 bg-indigo-600 text-white text-xs py-2 px-4 text-center z-[100] font-medium shadow-lg">
                   Preview Mode: Database permissions are currently restricted. Showing demo portfolio.
               </div>
            )}
            <div className={permissionError && isDemoMode ? "pt-8" : ""}>
                <PortfolioView data={data} isPreview={false} />
            </div>
        </div>
    );
  }

  // --- VIEW: EDITOR (Full Screen or Preview Mode) ---
  if (route === 'editor' && data) {
    if (showOnboarding) {
        return <OnboardingFlow data={data} onComplete={handleOnboardingComplete} />;
    }

    if (editorViewMode === 'preview') {
        return (
            <div className="relative min-h-screen w-full bg-black">
                {/* Fixed: Moved button to Bottom-Right to avoid blocking profile info on Top-Left */}
                <div className="fixed bottom-6 right-6 z-[200]">
                    <Button 
                        onClick={() => setEditorViewMode('edit')} 
                        className="shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-zinc-700 bg-zinc-900/90 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all rounded-full px-6 py-4 flex items-center gap-2 group"
                    >
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
                 <ShieldAlert size={14}/>
                 <span>Database Locked: Changes cannot be saved to cloud.</span>
                 <button onClick={() => setPermissionError(false)} className="hover:text-red-200"><X size={14}/></button>
             </div>
         )}

         {/* Full Screen Editor Panel */}
         <div className="flex-1 w-full h-full overflow-hidden">
             <EditorPanel 
                data={data} 
                onChange={(d) => { setData(d); setHasUnsavedChanges(true); }} 
                onPublish={() => handleSaveAndPublish()}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                onLogout={handleLogout}
                onPreview={handlePreviewToggle}
             />
        </div>
      </div>
    );
  }

  // --- VIEW: LOGIN / HOME ---
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Animated Ambient BG */}
       <div className="absolute inset-0 bg-black">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
       </div>
       
       <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
       <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-20"></div>

       {permissionError && (
           <div className="absolute top-4 w-full max-w-md bg-red-900/20 border border-red-500 text-red-200 p-4 rounded-lg flex gap-3 z-50">
               <ShieldAlert className="flex-shrink-0" />
               <div className="text-xs">
                   <strong>Database Permission Error</strong>
                   <p className="mt-1">Public access is restricted by your Firebase rules. Check console for details.</p>
               </div>
               <button onClick={() => setPermissionError(false)}><X size={14}/></button>
           </div>
       )}

       <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="mb-12 flex flex-col items-center select-none">
              <h1 className="text-7xl md:text-9xl font-display font-black text-white tracking-tighter leading-[0.8]">FRAMES</h1>
              <div className="relative">
                 <div className="transform -rotate-3 bg-white text-black px-4 py-1 font-display font-bold text-sm tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                     by VARUN
                 </div>
              </div>
           </div>

          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full">
             <div className="flex gap-4 mb-8 bg-black/40 p-1 rounded-lg">
                 <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'login' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Log In</button>
                 <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'signup' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Sign Up</button>
             </div>
             
             <form onSubmit={handleAuth} className="space-y-5">
                {authMode === 'signup' && (
                    <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors" placeholder="username" required />
                    </div>
                )}
                <div className="space-y-2">
                   <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Email</label>
                   <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors" placeholder="hello@example.com" required />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Password</label>
                   <div className="relative">
                       <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none pr-10 transition-colors" placeholder="••••••••" required />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">{showPassword ? <Eye size={16} /> : <Eye size={16} />}</button>
                   </div>
                </div>

                {authError && (
                    <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-red-400 text-xs text-left">
                            <span className="font-bold block mb-1">Authentication Error</span>
                            {authError}
                        </div>
                        <button type="button" onClick={() => setAuthError('')} className="text-red-500 hover:text-red-400">
                            <X size={14}/>
                        </button>
                    </div>
                )}

                <Button className="w-full py-4 text-sm tracking-wide" size="lg" disabled={isAuthProcessing}>
                   {isAuthProcessing ? <Loader2 className="animate-spin"/> : (authMode === 'login' ? 'Enter Studio' : 'Create Account')}
                </Button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider"><span className="bg-[#0c0c0e] px-2 text-zinc-600">Or continue with</span></div>
                </div>

                <Button type="button" variant="secondary" className="w-full py-3" onClick={handleGoogleAuth}>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.082z"></path></svg>
                    Google
                </Button>
             </form>
          </div>
       </div>
    </div>
  );
};

export default App;