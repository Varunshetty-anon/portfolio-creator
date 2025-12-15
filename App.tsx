import React, { useState, useEffect } from 'react';
import { PortfolioView } from './components/PortfolioView';
import { EditorPanel } from './components/EditorPanel';
import { PortfolioData } from './types';
import { getInitialState, encodeState } from './utils';
import { Eye, Code, Share2, Check } from 'lucide-react';
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);

  useEffect(() => {
    const { mode: initialMode, data: initialData } = getInitialState();
    setMode(initialMode);
    setData(initialData);
  }, []);

  const handleDataChange = (newData: PortfolioData) => {
    setData(newData);
    if (mode === 'edit') {
      localStorage.setItem('cinefolio_data', JSON.stringify(newData));
    }
  };

  const handleShare = () => {
    if (!data) return;
    const hash = encodeState(data);
    const url = `${window.location.origin}${window.location.pathname}#view=${hash}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!data) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  // View Mode (Public URL)
  if (mode === 'view') {
    return (
      <>
        <PortfolioView data={data} />
        {/* Floating Edit Button only if you are the owner (simulated by checking localStorage presence of original data, purely UX sugar) */}
        <div className="fixed bottom-6 right-6 z-50">
           <Button 
             variant="secondary" 
             size="sm"
             onClick={() => {
                window.location.hash = '';
                setMode('edit');
             }}
             className="shadow-2xl opacity-50 hover:opacity-100"
           >
             Create Your Own
           </Button>
        </div>
      </>
    );
  }

  // Edit Mode
  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row">
      
      {/* Editor Panel (Sidebar on desktop, Modal/Drawer on mobile) */}
      <div className={`
        fixed md:relative inset-0 z-40 bg-black md:w-[400px] flex-shrink-0 transition-transform duration-300 transform 
        ${showMobileEditor ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
           <EditorPanel data={data} onChange={handleDataChange} />
        </div>
        
        {/* Mobile close button */}
        <button 
          onClick={() => setShowMobileEditor(false)}
          className="md:hidden absolute top-4 right-4 text-white bg-zinc-800 p-2 rounded-full"
        >
          ✕
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 h-full relative bg-zinc-950 overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
             <Button 
               variant="secondary" 
               className="md:hidden" 
               onClick={() => setShowMobileEditor(true)}
               icon={<Code size={16}/>}
             >
               Edit
             </Button>
             <h1 className="text-white font-display font-bold hidden md:block">CineFolio <span className="text-zinc-500 font-normal text-sm ml-2">Live Preview</span></h1>
          </div>

          <div className="flex items-center gap-3">
             <Button 
               variant={copied ? 'secondary' : 'primary'}
               onClick={handleShare}
               icon={copied ? <Check size={16}/> : <Share2 size={16}/>}
             >
               {copied ? 'Link Copied!' : 'Share Portfolio'}
             </Button>
          </div>
        </div>

        {/* Live Preview Iframe/Component */}
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
           <div className="min-h-full origin-top transform scale-[0.8] md:scale-100 transition-transform duration-300 origin-top-left md:origin-top-center w-[125%] md:w-full h-full md:h-auto">
             <PortfolioView data={data} isPreview={true} />
           </div>
        </div>

      </div>
    </div>
  );
};

export default App;