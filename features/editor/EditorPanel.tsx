import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup, Reorder } from 'framer-motion';
import { PortfolioData, Project, Album } from '../../types';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ToolSelector } from '../../components/ToolSelector';
import { ImageCropper } from '../../components/ImageCropper';
import { Plus, Trash2, Video, Upload, ChevronDown, Loader2, CheckCircle2, AlertTriangle, Eye, Settings, LogOut, Wrench, LayoutDashboard, User, X, Link, Youtube, HardDrive, Database, Globe, ExternalLink, QrCode, Download, Copy, Link2, Check, Play, GripVertical, FolderPlus, Folder, FileVideo } from 'lucide-react';
import { uploadFileToStorage, getVideoMetadata, getPortfolioStats, PROJECT_CONTENT_TYPES, EDITING_TOOLS_LIST, downloadQrCode, generateThumbnailFromVideo } from '../../lib/utils';

interface EditorPanelProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onLogout?: () => void;
  onDeleteAccount?: () => Promise<void>;
  onPreview?: () => void;
}

const PublishButton = ({ onPublish }: { onPublish: () => Promise<void> }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const handleClick = async () => {
        setStatus('loading');
        try { await onPublish(); setStatus('success'); setTimeout(() => setStatus('idle'), 2500); } catch (e) { setStatus('idle'); }
    };
    return (
        <Button size="sm" onClick={handleClick} disabled={status === 'loading'} className={`transition-all rounded-full px-6 text-xs font-bold ${status === 'success' ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}>
            {status === 'loading' ? <Loader2 className="animate-spin" size={14}/> : status === 'success' ? 'Live' : 'Publish'}
        </Button>
    );
}

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all" onClick={() => onChange(!checked)}>
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-green-500' : 'bg-zinc-800'}`}>
            <motion.div 
                animate={{ x: checked ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-md"
            />
        </div>
    </div>
);

const ProjectCardEditor: React.FC<{ project: Project; albums: Album[]; onChange: (p: Partial<Project>) => void; onDelete: () => void; onAutoSave: () => void }> = ({ project, albums, onChange, onDelete, onAutoSave }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [linkStatus, setLinkStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

    // Link Validation & Auto-Save Logic
    const handleLinkChange = async (val: string) => {
        // Immediate update to UI
        onChange({ link: val });
        
        // Reset status if empty
        if (!val) {
            setLinkStatus('idle');
            return;
        }

        // Basic length check before validating
        if (val.length < 8) {
             setLinkStatus('invalid');
             return;
        }

        setLinkStatus('validating');

        // Debounce the metadata fetch slightly to avoid slamming API while typing
        const timer = setTimeout(async () => {
            try {
                const m = await getVideoMetadata(val);
                if (m.thumbnail) {
                    // Success!
                    onChange({ link: val, thumbnail: m.thumbnail, aspectRatio: m.aspectRatio });
                    setLinkStatus('valid');
                    // TRIGGER AUTO SAVE
                    onAutoSave();
                } else {
                    setLinkStatus('invalid');
                }
            } catch (e) {
                setLinkStatus('invalid');
            }
        }, 1000);

        return () => clearTimeout(timer);
    };

    return (
        <div className={`bg-zinc-900/50 border rounded-xl overflow-visible transition-all duration-300 ${isExpanded ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'}`}>
             <div className="p-4 flex gap-4 items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                 <div className="w-24 aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center relative group">
                    {project.thumbnail ? <img src={project.thumbnail} className="w-full h-full object-cover"/> : <Video size={16} className="text-zinc-700"/>}
                    {linkStatus === 'validating' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={12} className="animate-spin text-white"/></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{project.title || "Untitled Project"}</h4>
                        {linkStatus === 'valid' && <CheckCircle2 size={12} className="text-green-500" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 truncate">{project.contentType || "Video"} • {project.link ? "Linked" : "No Link"}</p>
                    {project.albumId && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">
                            {albums.find(a => a.id === project.albumId)?.title || 'Unknown Album'}
                        </span>
                    )}
                </div>
                <button onClick={(e) => {e.stopPropagation(); onDelete();}} className="p-2 text-zinc-600 hover:text-red-500"><Trash2 size={14}/></button>
             </div>

             <AnimatePresence>
                 {isExpanded && (
                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-zinc-800 bg-zinc-900/30 overflow-hidden">
                         <div className="p-5 space-y-4">
                             <Input label="Title" value={project.title} onChange={e => onChange({ title: e.target.value })} />
                             
                             <div className="relative">
                                <Input 
                                    label="Video Link" 
                                    value={project.link} 
                                    onChange={e => handleLinkChange(e.target.value)} 
                                    placeholder="YouTube, Vimeo, Drive..." 
                                    className={`pr-10 transition-colors ${linkStatus === 'invalid' ? 'border-red-500 focus:border-red-500' : linkStatus === 'valid' ? 'border-green-500/50 focus:border-green-500' : ''}`}
                                />
                                <div className="absolute right-3 top-[34px] pointer-events-none">
                                    {linkStatus === 'validating' && <Loader2 size={14} className="animate-spin text-zinc-500" />}
                                    {linkStatus === 'valid' && <CheckCircle2 size={14} className="text-green-500" />}
                                    {linkStatus === 'invalid' && <AlertTriangle size={14} className="text-red-500" />}
                                </div>
                             </div>
                             {linkStatus === 'valid' && <p className="text-[10px] text-green-500 flex items-center gap-1"><Check size={10}/> Link verified & saved</p>}

                             <TextArea label="Description" value={project.description} onChange={e => onChange({ description: e.target.value })} rows={3} />
                             
                             {/* Album Selection */}
                             <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Album / Category</label>
                                <select 
                                    value={project.albumId || ''} 
                                    onChange={e => onChange({ albumId: e.target.value })} 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600"
                                >
                                    <option value="">Uncategorized</option>
                                    {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                </select>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">Content Type</label>
                                    <select value={project.contentType} onChange={e => onChange({ contentType: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600">
                                        {PROJECT_CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">Aspect Ratio</label>
                                    <select value={project.aspectRatio} onChange={e => onChange({ aspectRatio: e.target.value as any })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600">
                                        <option value="16:9">Landscape (16:9)</option>
                                        <option value="9:16">Vertical (9:16)</option>
                                        <option value="4:3">Classic (4:3)</option>
                                    </select>
                                </div>
                             </div>
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
    );
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onSave, onPublish, isSaving, hasUnsavedChanges, onLogout, onDeleteAccount, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'tools' | 'settings'>('dashboard');
  const [stats, setStats] = useState({ views: 0, clicks: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Showreel Validation State
  const [isVerifyingShowreel, setIsVerifyingShowreel] = useState(false);
  const [showreelError, setShowreelError] = useState<string | null>(null);
  const showreelInputRef = useRef<HTMLInputElement>(null);

  // Dashboard Link State
  const [shortUrl, setShortUrl] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [copiedType, setCopiedType] = useState<'main' | 'short' | null>(null);
  const [isQrExpanded, setIsQrExpanded] = useState(false);

  // Albums State
  const [newAlbumTitle, setNewAlbumTitle] = useState('');

  // Cropper State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => { if (data.uid && activeTab === 'dashboard') getPortfolioStats(data.uid).then(setStats); }, [activeTab, data.uid]);

  // Debounced Showreel Validation (Only if not a direct file upload which we can assume is valid after our checks)
  useEffect(() => {
    const checkShowreel = async () => {
        setShowreelError(null);
        if (!data.showreelLink) return;

        // Skip validation for direct storage links or blobs
        if (data.showreelLink.includes('firebasestorage') || data.showreelLink.startsWith('blob:')) {
             return;
        }

        // Valid Check
        const isYoutube = data.showreelLink.match(/(youtube\.com|youtu\.?be)/i);
        const isVimeo = data.showreelLink.match(/vimeo\.com/i);
        const isDrive = data.showreelLink.match(/drive\.google\.com/i);
        
        if (!isYoutube && !isVimeo && !isDrive && data.showreelLink.length > 8) {
            setShowreelError("Use a YouTube, Vimeo, or Drive link.");
            return;
        }

        if (data.showreelLink.length < 10) return;
        
        setIsVerifyingShowreel(true);
        try {
            const meta = await getVideoMetadata(data.showreelLink);
            if (meta.thumbnail) {
                if (meta.thumbnail !== data.showreelThumbnail) {
                    const updated = { ...data, showreelThumbnail: meta.thumbnail };
                    onChange(updated);
                }
                setShowreelError(null);
            } else {
                setShowreelError("Could not verify video. Check permissions.");
            }
        } catch (error) {
            console.error("Showreel validation error", error);
            setShowreelError("Validation failed.");
        } finally {
            setIsVerifyingShowreel(false);
        }
    };

    const timeoutId = setTimeout(checkShowreel, 800);
    return () => clearTimeout(timeoutId);
  }, [data.showreelLink]);

  const updateField = (f: keyof PortfolioData, v: any) => onChange({ ...data, [f]: v });
  
  const updateSocial = (key: string, val: string) => {
      onChange({ ...data, socials: { ...data.socials, [key]: val } });
  }

  const publicUrl = `${window.location.origin}/#${data.username}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}&bgcolor=000000&color=ffffff&margin=10`;

  const handleShortenLink = async () => {
    setIsShortening(true);
    setShortUrl('');
    try {
        const encodedUrl = encodeURIComponent(publicUrl);
        const apiUrl = `https://tinyurl.com/api-create.php?url=${encodedUrl}`;
        
        // Try corsproxy.io first (generally more reliable/faster)
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Primary proxy failed");
        
        const short = await response.text();
        if (short.trim().startsWith('http')) {
             setShortUrl(short);
        } else {
             throw new Error("Invalid response");
        }
    } catch (e) {
        // Fallback to allorigins.win
        try {
            const encodedUrl = encodeURIComponent(publicUrl);
            const apiUrl = `https://tinyurl.com/api-create.php?url=${encodedUrl}`;
            const backupProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
            
            const res = await fetch(backupProxy);
            if (!res.ok) throw new Error("Backup proxy failed");
            
            const short = await res.text();
            if (short.trim().startsWith('http')) {
                 setShortUrl(short);
                 return;
            }
            throw new Error("Invalid response");
        } catch (err) {
            console.error("Shortening failed", err);
            setShortUrl("Service unavailable.");
        }
    } finally {
        setIsShortening(false);
    }
  };

  const copyToClipboard = (text: string, type: 'main' | 'short') => {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
  };

  const addAlbum = () => {
      if (!newAlbumTitle.trim()) return;
      const newAlbum: Album = { id: Date.now().toString(), title: newAlbumTitle.trim() };
      updateField('albums', [...(data.albums || []), newAlbum]);
      setNewAlbumTitle('');
  };

  const removeAlbum = (id: string) => {
      updateField('albums', (data.albums || []).filter(a => a.id !== id));
  };

  // --- Showreel Upload Handler ---
  const handleShowreelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset file input to allow re-selection
      e.target.value = '';

      if (file.type !== 'video/mp4') {
          setShowreelError("Only MP4 files are supported.");
          return;
      }
      
      // Max size check (100MB)
      if (file.size > 100 * 1024 * 1024) {
          setShowreelError("File size limit is 100MB.");
          return;
      }

      setIsVerifyingShowreel(true);
      setShowreelError(null);
      
      try {
          // 1. Generate Thumbnail & Check validity (implicit in generation)
          const { blob: thumbBlob } = await generateThumbnailFromVideo(file);
          
          // 2. Upload Video to user's showreel folder
          const videoPath = `users/${data.uid}/showreel/showreel.mp4`;
          const videoUrl = await uploadFileToStorage(file, videoPath);

          // 3. Upload Thumbnail to user's showreel folder
          const thumbPath = `users/${data.uid}/showreel/thumbnail.jpg`;
          const thumbFile = new File([thumbBlob], "thumbnail.jpg", { type: "image/jpeg" });
          const thumbUrl = await uploadFileToStorage(thumbFile, thumbPath);

          // 4. Update Data with new direct URLs
          const updated = {
              ...data,
              showreelLink: videoUrl,
              showreelThumbnail: thumbUrl
          };
          onChange(updated);
          
          // Trigger auto-save immediately to persist the new file paths
          setTimeout(() => onSave(), 100);
          
      } catch (err) {
          console.error("Showreel upload failed", err);
          setShowreelError("Upload failed. Ensure video is a valid MP4.");
      } finally {
          setIsVerifyingShowreel(false);
      }
  }

  // --- Image Crop Handlers ---
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', () => setCropImageSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(file);
        setIsCropping(true);
        e.target.value = '';
    }
  };

  const onCropComplete = async (croppedBlob: Blob) => {
      const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
      try {
          const url = await uploadFileToStorage(file, `users/${data.uid}/avatar_${Date.now()}`);
          const newData = { ...data, profileImage: url };
          onChange(newData);
          setIsCropping(false);
          setCropImageSrc(null);
          setTimeout(() => onSave(), 100); 
      } catch (e) {
          console.error("Upload failed", e);
          alert("Failed to upload image.");
      }
  };

  if (!data) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-zinc-500"/></div>;

  return (
    <>
    <div className="h-screen flex bg-[#050505] text-white font-sans overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 border-r border-zinc-900 flex flex-col bg-zinc-950/50 shrink-0">
            <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-zinc-900">
                <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black">F</div>
                <span className="hidden lg:block ml-3 font-bold text-sm tracking-widest uppercase">Studio</span>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                    { id: 'profile', icon: User, label: 'Profile' },
                    { id: 'content', icon: Video, label: 'Portfolio' },
                    { id: 'tools', icon: Wrench, label: 'Tools' },
                    { id: 'settings', icon: Settings, label: 'Settings' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}>
                        <tab.icon size={20} />
                        <span className="hidden lg:block ml-3 text-sm font-medium">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-zinc-900">
                <button onClick={onLogout} className="w-full flex items-center p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <LogOut size={20} />
                    <span className="hidden lg:block ml-3 text-sm font-medium">Log Out</span>
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Header */}
            <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur z-20 sticky top-0">
                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-1 rounded">Unsaved Changes</span>}
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onSave} disabled={isSaving} className="text-zinc-400 hover:text-white">
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <div className="w-px h-4 bg-zinc-800 mx-1" />
                    <Button variant="ghost" size="sm" onClick={onPreview} className="text-zinc-400 hover:text-white"><Eye size={18}/></Button>
                    <PublishButton onPublish={onPublish} />
                </div>
            </header>

            {/* Scroll Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
                <div className="max-w-3xl mx-auto space-y-12 pb-24">
                    
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-display font-bold mb-2">Welcome, {data.name}</h2>
                                <p className="text-zinc-500">Here's how your portfolio is performing.</p>
                            </div>
                            
                            {/* Analytics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Views</span>
                                    <div className="text-4xl font-display font-bold mt-2">{stats.views}</div>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Link Clicks</span>
                                    <div className="text-4xl font-display font-bold mt-2">{stats.clicks}</div>
                                </div>
                            </div>

                            {/* Public Link Section */}
                            <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Public Portfolio</h3>
                                    
                                    {/* Main Link */}
                                    <div className="flex items-center gap-2 bg-black/50 border border-zinc-800 p-3 rounded-lg mb-3">
                                        <Globe size={16} className="text-zinc-500 shrink-0" />
                                        <code className="text-zinc-300 text-xs truncate flex-1">{publicUrl}</code>
                                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(publicUrl, 'main')} className="text-zinc-500 hover:text-white">
                                            {copiedType === 'main' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => window.open(publicUrl, '_blank')} className="text-xs h-8">
                                            <ExternalLink size={12}/>
                                        </Button>
                                    </div>

                                    {/* Short Link & Actions */}
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* Short Link Generator */}
                                        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                                <Link2 size={12} /> Small Link
                                            </h4>
                                            {!shortUrl ? (
                                                <Button 
                                                    size="sm" 
                                                    onClick={handleShortenLink} 
                                                    disabled={isShortening}
                                                    className="w-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                                >
                                                    {isShortening ? <Loader2 size={14} className="animate-spin" /> : 'Generate Short Link'}
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-lg animate-in fade-in">
                                                    <span className="text-xs text-indigo-400 flex-1 truncate">{shortUrl}</span>
                                                    <button onClick={() => copyToClipboard(shortUrl, 'short')} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white">
                                                        {copiedType === 'short' ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                                                    </button>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-zinc-600 mt-2">
                                                Create a compact URL ideal for social media bios.
                                            </p>
                                        </div>

                                        {/* QR Code */}
                                        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex gap-4 items-center relative">
                                            <div 
                                                className="w-20 h-20 bg-white p-1 rounded-lg shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => setIsQrExpanded(true)}
                                            >
                                                <img src={qrCodeUrl} alt="Portfolio QR" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1">QR Code</h4>
                                                <p className="text-[10px] text-zinc-600 mb-2 truncate">Scan to view portfolio</p>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-7 text-[10px] px-2"
                                                        onClick={() => downloadQrCode(qrCodeUrl, 'frames-portfolio-qr.png')}
                                                    >
                                                        <Download size={10} className="mr-1.5"/> DL
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-7 text-[10px] px-2"
                                                        onClick={() => setIsQrExpanded(true)}
                                                    >
                                                        <Eye size={10} className="mr-1.5"/> View
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 relative group overflow-hidden">
                                    <img src={data.profileImage} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <label htmlFor="profile-upload" className="cursor-pointer w-full h-full flex items-center justify-center">
                                            <Upload size={20} className="text-white"/>
                                            <input 
                                                id="profile-upload"
                                                type="file" 
                                                accept="image/*"
                                                className="hidden"
                                                onChange={onFileSelect}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Profile Image</h3>
                                    <p className="text-zinc-500 text-xs">Recommended 400x400px</p>
                                </div>
                             </div>
                             
                             <div className="space-y-4">
                                 <Input label="Display Name" value={data.name} onChange={e => updateField('name', e.target.value)} />
                                 <Input label="Role / Title" value={data.role} onChange={e => updateField('role', e.target.value)} />
                                 
                                 {/* Availability Toggle Section */}
                                 <div className="py-2">
                                    <Toggle 
                                        label="Available for Work" 
                                        checked={data.availability?.status || false} 
                                        onChange={(status) => onChange({ ...data, availability: { ...data.availability, status } })} 
                                    />
                                    <AnimatePresence>
                                        {data.availability?.status && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }} 
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            >
                                                <Input 
                                                    label="Booking / Contact Link (Optional)" 
                                                    placeholder="https://calendly.com/..." 
                                                    value={data.availability?.link || ''} 
                                                    onChange={(e) => onChange({ ...data, availability: { ...data.availability, link: e.target.value } })} 
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                 </div>

                                 <TextArea label="Bio" value={data.bio} onChange={e => updateField('bio', e.target.value)} rows={4} />
                                 <Input label="Location" value={data.location} onChange={e => updateField('location', e.target.value)} />
                                 <Input label="Contact Email" value={data.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} />
                                 <Input label="Languages" value={data.languages} onChange={e => updateField('languages', e.target.value)} placeholder="English, Spanish, etc." />
                             </div>
                             
                             <div className="pt-8 border-t border-zinc-900 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Social Presence</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Instagram" placeholder="https://instagram.com/..." value={data.socials?.instagram || ''} onChange={e => updateSocial('instagram', e.target.value)} />
                                    <Input label="Twitter / X" placeholder="https://twitter.com/..." value={data.socials?.twitter || ''} onChange={e => updateSocial('twitter', e.target.value)} />
                                    <Input label="LinkedIn" placeholder="https://linkedin.com/in/..." value={data.socials?.linkedin || ''} onChange={e => updateSocial('linkedin', e.target.value)} />
                                    <Input label="YouTube" placeholder="https://youtube.com/..." value={data.socials?.youtube || ''} onChange={e => updateSocial('youtube', e.target.value)} />
                                    <Input label="Discord" placeholder="Server Invite (e.g. discord.gg/abc) or User ID" value={data.socials?.discord || ''} onChange={e => updateSocial('discord', e.target.value)} />
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Showreel</h3>
                                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
                                    <div className="space-y-2">
                                        <div className="relative flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <Input 
                                                    label="Showreel Link" 
                                                    value={data.showreelLink} 
                                                    onChange={e => updateField('showreelLink', e.target.value)} 
                                                    placeholder="Paste link or upload video..." 
                                                    className={`pr-10 ${showreelError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                                />
                                                <div className="absolute right-3 top-[34px] text-zinc-500">
                                                    {isVerifyingShowreel ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : showreelError ? (
                                                        <AlertTriangle size={16} className="text-red-500" />
                                                    ) : data.showreelLink && data.showreelThumbnail ? (
                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                    ) : data.showreelLink ? (
                                                        <Link size={16} />
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* File Upload Button */}
                                            <div className="relative top-[11px]">
                                                <input 
                                                    type="file" 
                                                    ref={showreelInputRef} 
                                                    className="hidden" 
                                                    accept="video/mp4" 
                                                    onChange={handleShowreelUpload}
                                                />
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => showreelInputRef.current?.click()}
                                                    className="bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 h-[42px] px-4"
                                                    disabled={isVerifyingShowreel}
                                                >
                                                    <FileVideo size={16} className="mr-2" /> Upload MP4
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {showreelError && (
                                            <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1">
                                                <AlertTriangle size={10} /> {showreelError}
                                            </p>
                                        )}
                                        
                                        {data.showreelLink && !showreelError && (
                                            <div className="mt-4 bg-black rounded-lg overflow-hidden border border-zinc-800 relative aspect-video">
                                                {data.showreelThumbnail ? (
                                                    <>
                                                        <img src={data.showreelThumbnail} alt="Showreel Thumbnail" className="w-full h-full object-cover opacity-60" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                             <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                                                                <Play size={24} className="text-white fill-white" />
                                                             </div>
                                                        </div>
                                                        <div className="absolute bottom-2 right-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                                                            <Check size={10} /> Ready to Autoplay
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                                                        <AlertTriangle size={24} className="text-amber-500" />
                                                        <span className="text-xs">No metadata found. Link might not autoplay.</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Album Management */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Albums / Categories</h3>
                                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl mb-8">
                                    <div className="flex gap-2 mb-4">
                                        <Input 
                                            placeholder="New Album Title (e.g., Commercials)" 
                                            value={newAlbumTitle} 
                                            onChange={e => setNewAlbumTitle(e.target.value)} 
                                            className="bg-black/50"
                                        />
                                        <Button onClick={addAlbum} className="bg-white text-black"><FolderPlus size={18} /></Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Reorder.Group axis="y" values={data.albums || []} onReorder={(newOrder) => updateField('albums', newOrder)} className="space-y-2">
                                            {(data.albums || []).map(album => (
                                                <Reorder.Item key={album.id} value={album}>
                                                    <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-zinc-700">
                                                        <GripVertical size={16} className="text-zinc-600 cursor-grab active:cursor-grabbing" />
                                                        <Folder size={16} className="text-zinc-500" />
                                                        <span className="flex-1 text-sm font-medium">{album.title}</span>
                                                        <button onClick={() => removeAlbum(album.id)} className="p-1.5 text-zinc-600 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                                                    </div>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                        {(!data.albums || data.albums.length === 0) && (
                                            <p className="text-xs text-zinc-600 italic">No albums created. Projects will be uncategorized.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Projects</h3>
                                    <Button size="sm" onClick={() => updateField('projects', [{ id: Date.now().toString(), title: "New Project", description: "", thumbnail: "", link: "", category: "Work", type: "video", aspectRatio: '16:9', albumId: "" }, ...data.projects])} className="bg-white text-black text-xs font-bold rounded-full px-4"><Plus size={14} className="mr-1"/> Add Project</Button>
                                </div>
                                <div className="space-y-4">
                                    {(data.projects || []).map(p => (
                                        <ProjectCardEditor 
                                            key={p.id} 
                                            project={p} 
                                            albums={data.albums || []}
                                            onChange={u => updateField('projects', data.projects.map(pr => pr.id === p.id ? { ...pr, ...u } : pr))} 
                                            onDelete={() => updateField('projects', data.projects.filter(pr => pr.id !== p.id))} 
                                            onAutoSave={onSave}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Primary Software</h3>
                                <ToolSelector type="editing" selectedTools={data.tools || []} primaryTool={data.primaryTool} onSelect={t => updateField('tools', t)} onSetPrimary={t => updateField('primaryTool', t)} />
                             </div>
                             <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">AI Tools</h3>
                                <ToolSelector type="ai" selectedTools={data.aiTools || []} onSelect={t => updateField('aiTools', t)} />
                             </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-6">
                                <h3 className="text-lg font-bold">Account Settings</h3>
                                <Input label="Custom URL Slug" value={data.username} onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))} />
                                <div className="pt-6 border-t border-zinc-800">
                                    <Button variant="outline" className="text-red-500 border-red-900/50 hover:bg-red-950/20 w-full" onClick={() => setShowDeleteModal(true)}>Delete Portfolio & Account</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>

        {/* QR Expansion Modal */}
        <AnimatePresence>
            {isQrExpanded && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
                    onClick={() => setIsQrExpanded(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="bg-white p-6 rounded-2xl max-w-sm w-full relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setIsQrExpanded(false)} className="absolute top-4 right-4 text-black/50 hover:text-black"><X size={24}/></button>
                        <div className="aspect-square bg-white rounded-xl overflow-hidden mb-4">
                            <img src={qrCodeUrl} className="w-full h-full object-contain" alt="Large QR" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-black font-bold text-lg mb-1">Scan to View</h3>
                            <p className="text-black/50 text-xs mb-4">{publicUrl}</p>
                             <Button 
                                size="md" 
                                className="w-full bg-black text-white hover:bg-zinc-800"
                                onClick={() => downloadQrCode(qrCodeUrl, 'frames-portfolio-qr.png')}
                            >
                                <Download size={16} className="mr-2"/> Download Image
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Image Cropper Modal */}
        {isCropping && cropImageSrc && (
            <ImageCropper 
                imageSrc={cropImageSrc}
                onCancel={() => { setIsCropping(false); setCropImageSrc(null); }}
                onCropComplete={onCropComplete}
            />
        )}

        {showDeleteModal && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6">
                    <AlertTriangle size={48} className="text-red-500 mx-auto" />
                    <h3 className="text-xl font-bold text-white">Permanently Delete?</h3>
                    <p className="text-zinc-400 text-sm">This action cannot be undone. All your data will be wiped.</p>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={onDeleteAccount}>Delete</Button>
                    </div>
                </div>
            </div>, document.body
        )}
    </div>
    </>
  );
};