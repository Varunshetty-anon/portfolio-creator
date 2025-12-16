import React, { useState, useEffect } from 'react';
import { PortfolioView } from './components/PortfolioView';
import { EditorPanel } from './components/EditorPanel';
import { PortfolioData, INITIAL_DATA } from './types';
import { loadFromDB, saveToDB, isConfigured, auth, loginWithEmail, signupWithEmail, loginWithGoogle, checkUsernameAvailable } from './utils';
import { Database, HardDrive, Loader2, Code, Eye } from 'lucide-react';
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
  
  // Editor State
  const [isSaving, setIsSaving] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'editor' | 'preview'>('editor');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    // Listen for Firebase Auth State
    const unsubscribe = isConfigured && auth ? onAuthStateChanged(auth, async (user) => {
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
          console.error("Google Auth Error:", e);
          if (e.code === 'auth/unauthorized-domain') {
              setAuthError("Domain not authorized in Firebase Console. Please add this domain.");
          } else {
              setAuthError("Google Sign-in failed. Please try again.");
          }
      }
  }

  const handleLogout = async () => {
      if (auth) await auth.signOut();
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
              <p className="text-zinc-500 animate-pulse">Loading Frames...</p>
          </div>
      );
  }

  // --- VIEW: PUBLIC ---
  if (route === 'public' && data) {
    return (
        <>
            <PortfolioView data={data} />
            <div className="fixed bottom-6 right-6 z-50">
               <Button variant="secondary" size="sm" onClick={() => { safeSetHash(''); window.location.reload(); }} className="shadow-2xl opacity-50 hover:opacity-100 backdrop-blur-md bg-black/50 border border-zinc-800">
                 Create Your Portfolio
               </Button>
            </div>
        </>
    );
  }

  // --- VIEW: EDITOR ---
  if (route === 'editor' && data) {
    return (
      <div className="h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row">
        
        {/* Editor Side */}
        <div className={`
            flex-shrink-0 w-full md:w-[450px] bg-zinc-950 border-r border-zinc-800 flex flex-col h-full z-20
            ${mobileViewMode === 'editor' ? 'block' : 'hidden md:block'}
        `}>
             <EditorPanel 
                data={data} 
                onChange={(d) => { setData(d); setHasUnsavedChanges(true); }} 
                onPublish={() => handleSaveAndPublish()}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                onLogout={handleLogout}
             />
        </div>

        {/* Mobile Toggle Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-2 flex z-50">
            <button 
                onClick={() => setMobileViewMode('editor')} 
                className={`flex-1 py-3 rounded-lg text-sm font-bold ${mobileViewMode === 'editor' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            >
                Editor
            </button>
            <button 
                onClick={() => setMobileViewMode('preview')} 
                className={`flex-1 py-3 rounded-lg text-sm font-bold ${mobileViewMode === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            >
                Preview
            </button>
        </div>

        {/* Preview Side */}
        <div className={`
            flex-1 h-full bg-zinc-950 relative flex flex-col
            ${mobileViewMode === 'preview' ? 'block' : 'hidden md:block'}
        `}>
          <div className="h-12 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 z-30 flex-shrink-0">
             <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                {isConfigured ? <Database size={10} /> : <HardDrive size={10} />}
                {isSaving ? 'Syncing...' : 'Live Preview'}
            </div>
            <div className="flex items-center gap-2">
                <Button variant={hasUnsavedChanges ? "primary" : "secondary"} size="sm" onClick={() => handleSaveAndPublish()} className={`text-xs h-8 ${hasUnsavedChanges ? "animate-pulse" : ""}`}>
                    {isSaving ? 'Publishing...' : 'Save Changes'}
                </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-black custom-scrollbar relative">
             <div className="min-h-full w-full bg-black">
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
       {/* Ambient BG */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>
       <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
       <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-20"></div>

       <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="mb-12 text-center">
             <h1 className="text-7xl md:text-8xl font-display font-black text-white tracking-tighter mb-2 leading-none">FRAMES</h1>
             <p className="text-zinc-500 font-mono text-sm tracking-[0.3em] uppercase">Portfolio Creator</p>
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

                {authError && <div className="text-red-400 text-xs text-center py-2 bg-red-900/10 rounded border border-red-500/20">{authError}</div>}

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