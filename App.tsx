import React, { useState, useEffect } from 'react';
import { PortfolioView } from './components/PortfolioView';
import { EditorPanel } from './components/EditorPanel';
import { PortfolioData, INITIAL_DATA } from './types';
import { loadFromDB, saveToDB } from './utils';
import { Code, Database, Lock, ArrowRight, CheckCircle, LayoutTemplate } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';

const App: React.FC = () => {
  // Routes: 'home' (login), 'editor', 'public'
  const [route, setRoute] = useState<'home' | 'editor' | 'public'>('home');
  const [data, setData] = useState<PortfolioData | null>(null);
  
  // Auth State
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Editor State
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // --- Initialization & Routing ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#u/')) {
        setRoute('public');
      } else if (hash === '#editor') {
        if (isAuthenticated) {
          setRoute('editor');
        } else {
          window.location.hash = ''; // Redirect to login if not auth
          setRoute('home');
        }
      } else {
        setRoute('home');
      }
    };

    // Initial Load
    loadFromDB().then((dbData) => {
      if (dbData) {
        setData(dbData);
      } else {
        setData(INITIAL_DATA);
      }
      handleHashChange();
    });

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication
    if (username.toLowerCase() === 'admin' && password === 'cinefolio') {
      setIsAuthenticated(true);
      window.location.hash = '#editor';
    } else {
      setAuthError('Invalid credentials. Try "admin" / "cinefolio"');
    }
  };

  const handleSaveAndPublish = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      await saveToDB(data);
      setHasUnsavedChanges(false);
      // Simulate network delay for effect
      setTimeout(() => setIsSaving(false), 800);
    } catch (e) {
      console.error("Save failed", e);
      setIsSaving(false);
      alert("Failed to save to local database.");
    }
  };

  const handleEditorChange = (newData: PortfolioData) => {
    setData(newData);
    setHasUnsavedChanges(true);
  };

  // --- Views ---

  if (!data) return <div className="h-screen bg-black text-white flex items-center justify-center font-mono">Initializing CineFolio Engine...</div>;

  // 1. Public Portfolio View
  if (route === 'public') {
    return <PortfolioView data={data} />;
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
            onPublish={handleSaveAndPublish}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
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
                  <Database size={12} />
                  {isSaving ? 'Syncing...' : 'Local Storage Active'}
               </div>
               <Button 
                 variant={hasUnsavedChanges ? "primary" : "secondary"}
                 size="sm"
                 onClick={handleSaveAndPublish}
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
       
       <div className="relative z-10 w-full max-w-md">
          <div className="mb-10 text-center space-y-2">
             <h1 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tighter">CineFolio.</h1>
             <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs font-mono">Professional Portfolio Engine</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl">
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
                   <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                      placeholder="••••••••"
                   />
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