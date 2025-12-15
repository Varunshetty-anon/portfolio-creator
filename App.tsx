import React, { useState, useEffect, useRef } from 'react';
import { PortfolioView } from './components/PortfolioView';
import { EditorPanel } from './components/EditorPanel';
import { PortfolioData, INITIAL_DATA } from './types';
import { loadFromDB, saveToDB, decodeState, isConfigured } from './utils';
import { Code, Database, Lock, ArrowRight, CheckCircle, LayoutTemplate, Eye, EyeOff, HardDrive } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';

// Helper to safely manipulate hash in restricted environments (e.g. Blob URLs)
const safeSetHash = (hash: string) => {
  try {
    window.location.hash = hash;
  } catch (e) {
    // Ignore error in restricted environments
  }
};

const getHash = () => {
  try {
    return window.location.hash;
  } catch (e) {
    return '';
  }
};

const App: React.FC = () => {
  // Routes: 'home' (login), 'editor', 'public'
  const [route, setRoute] = useState<'home' | 'editor' | 'public'>('home');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);
  
  // Auth State
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Session Persistence: Check sessionStorage on mount
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
       return sessionStorage.getItem('frames_auth') === 'true';
    }
    return false;
  });
  
  // Use ref to access current auth state in event listeners without re-binding
  const authRef = useRef(isAuthenticated);

  // Editor State
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync ref
  useEffect(() => {
    authRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // --- Initialization & Routing ---
  useEffect(() => {
    const handleRoute = async () => {
      const hash = getHash();
      
      // CHECK FOR SHARED DATA IN URL
      // Format: #varunshetty-portfolio?data=...
      if (hash.includes('?data=')) {
          const split = hash.split('?data=');
          const encoded = split[1];
          if (encoded) {
              const decoded = decodeState(encoded);
              if (decoded) {
                  setData(decoded);
                  setIsSharedView(true);
                  setRoute('public');
                  return;
              }
          }
      }

      // Normal Routes
      if (hash === '#varunshetty-portfolio' || hash.startsWith('#u/')) {
        setRoute('public');
      } else if (hash === '#editor') {
        if (authRef.current) {
          setRoute('editor');
        } else {
          safeSetHash('');
          setRoute('home');
        }
      } else {
        setRoute('home');
      }
    };

    // Load DB Data only if we aren't already viewing shared data
    if (!isSharedView) {
        loadFromDB().then((dbData) => {
          if (dbData) {
            // Ensure settings object exists if loading old data
            if (!dbData.settings) {
                dbData.settings = INITIAL_DATA.settings;
            }
            setData(dbData);
          } else {
            setData(INITIAL_DATA);
          }
          handleRoute();
        }).catch(err => {
            console.error("Initialization error:", err);
            setData(INITIAL_DATA);
            handleRoute();
        });
    }

    const onHashChange = () => {
        handleRoute();
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check against loaded data or fallbacks
    const validUser = data?.settings?.username || 'admin';
    const validPass = data?.settings?.password || 'cinefolio';

    if (username.toLowerCase() === validUser.toLowerCase() && password === validPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem('frames_auth', 'true');
      setAuthError('');
      setRoute('editor'); 
      safeSetHash('#editor'); 
    } else {
      setAuthError('Invalid credentials.');
    }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      sessionStorage.removeItem('frames_auth');
      setRoute('home');
      safeSetHash('');
      setUsername('');
      setPassword('');
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
      alert("Failed to save. Check console for details.");
    }
  };

  const handleEditorChange = (newData: PortfolioData) => {
    setData(newData);
    setHasUnsavedChanges(true);
  };
  
  const handleCreateOwn = () => {
      safeSetHash('');
      setRoute('home');
      setIsAuthenticated(false);
      sessionStorage.removeItem('frames_auth');
      window.location.reload(); 
  };

  // --- Views ---

  if (!data) return <div className="h-screen bg-black text-white flex items-center justify-center font-mono">Initializing Frames Engine...</div>;

  // 1. Public Portfolio View
  if (route === 'public') {
    return (
        <>
            <PortfolioView data={data} />
            <div className="fixed bottom-6 right-6 z-50">
               <Button 
                 variant="secondary" 
                 size="sm"
                 onClick={handleCreateOwn}
                 className="shadow-2xl opacity-50 hover:opacity-100 backdrop-blur-md bg-black/50"
               >
                 Create Your Own
               </Button>
            </div>
        </>
    );
  }

  // 2. Editor Dashboard
  if (route === 'editor') {
    return (
      <div className="h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row">
        {/* Mobile Sidebar Overlay */}
        <div className={`fixed inset-0 bg-black/80 z-40 md:hidden transition-opacity ${showMobileEditor ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowMobileEditor(false)} />

        {/* Editor Sidebar */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-50 bg-zinc-950 w-[85vw] md:w-[420px] border-r border-zinc-800 flex-shrink-0 transition-transform duration-300 transform shadow-2xl
          ${showMobileEditor ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <EditorPanel 
            data={data} 
            onChange={handleEditorChange} 
            onPublish={() => handleSaveAndPublish()}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            onLogout={handleLogout}
          />
          <button 
            onClick={() => setShowMobileEditor(false)}
            className="md:hidden absolute top-4 right-4 text-zinc-500"
          >
            ✕
          </button>
        </div>

        {/* Live Preview Area */}
        <div className="flex-1 h-full relative bg-zinc-950 overflow-hidden flex flex-col">
          {/* Top Bar */}
          <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 z-30">
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="md:hidden" 
                onClick={() => setShowMobileEditor(true)}
                icon={<Code size={14}/>}
              >
                Edit
              </Button>
              <div className="flex items-center gap-2 text-zinc-400">
                 <LayoutTemplate size={16} />
                 <span className="text-sm font-medium hidden sm:inline">Live Canvas</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-600">
                  {isConfigured ? <Database size={12} /> : <HardDrive size={12} />}
                  {isSaving ? 'Syncing...' : (isConfigured ? 'Firestore Active' : 'Local Storage')}
               </div>
               <Button 
                 variant={hasUnsavedChanges ? "primary" : "secondary"}
                 size="sm"
                 onClick={() => handleSaveAndPublish()}
                 className={hasUnsavedChanges ? "animate-pulse" : ""}
               >
                 {isSaving ? 'Publishing...' : (hasUnsavedChanges ? 'Save Changes' : 'Published')}
               </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-black">
             <div className="min-h-full origin-top transform scale-[0.85] md:scale-95 transition-transform duration-300 origin-top w-full h-full shadow-2xl border border-zinc-800/50">
               <PortfolioView data={data} isPreview={true} />
             </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Home / Login Screen
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Background Aesthetics */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
       
       <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="mb-12 text-center relative group cursor-default">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none"></div>
             <h1 className="text-7xl md:text-8xl font-display font-black text-white tracking-tighter select-none relative z-10 drop-shadow-2xl">
                FRAMES
             </h1>
             <div className="absolute -bottom-3 -right-4 md:-right-8 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 ease-out">
                 <span className="bg-white text-black text-[10px] font-bold font-mono px-2 py-0.5 border border-zinc-400 tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                    BY VARUN
                 </span>
             </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full">
             <div className="flex items-center gap-2 mb-6 text-white">
                <Lock size={18} className="text-indigo-500" />
                <h2 className="font-bold">Editor Access</h2>
             </div>
             
             <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs text-zinc-500 uppercase font-bold">Username</label>
                   <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                      placeholder="Enter username"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs text-zinc-500 uppercase font-bold">Password</label>
                   <div className="relative">
                       <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors pr-10"
                          placeholder="••••••••"
                       />
                       <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                       >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                   </div>
                </div>

                {authError && (
                   <div className="text-red-500 text-xs text-center py-2 bg-red-500/10 rounded border border-red-500/20">
                      {authError}
                   </div>
                )}

                <Button className="w-full mt-4" size="lg" icon={<ArrowRight size={16}/>}>
                   Enter Studio
                </Button>
             </form>
          </div>

          <div className="mt-8 text-center text-zinc-600 text-xs">
             <p>Default Access: <span className="font-mono text-zinc-400">admin</span> / <span className="font-mono text-zinc-400">cinefolio</span></p>
          </div>
       </div>
    </div>
  );
};

export default App;