import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Instagram, MapPin, Globe, ExternalLink, Play, Disc } from 'lucide-react';
import { PortfolioData } from '../types';

interface PortfolioViewProps {
  data: PortfolioData;
  isPreview?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export const PortfolioView: React.FC<PortfolioViewProps> = ({ data, isPreview = false }) => {
  return (
    <div className={`min-h-screen bg-black text-white selection:bg-zinc-800 ${isPreview ? 'pointer-events-none select-none' : ''}`}>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-screen">
        
        {/* === Left Sidebar (Profile) === */}
        <motion.aside 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-[400px] xl:w-[450px] lg:fixed lg:h-screen lg:overflow-y-auto p-6 lg:p-12 flex flex-col border-r border-zinc-900/50 bg-zinc-950/50 backdrop-blur-sm z-10"
        >
          <div className="flex-1 flex flex-col justify-center">
            {/* Profile Image */}
            <div className="mb-8 relative group">
              <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-full overflow-hidden border-2 border-zinc-800 ring-4 ring-black shadow-2xl mx-auto lg:mx-0">
                <img src={data.profileImage} alt={data.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out transform group-hover:scale-105" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full hidden lg:block">
                OPEN TO WORK
              </div>
            </div>

            {/* Name & Role */}
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-2 tracking-tight">
              {data.name}
            </h1>
            <p className="text-xl text-zinc-400 font-light mb-8 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-zinc-600 inline-block"></span>
              {data.role}
            </p>

            {/* Meta Info */}
            <div className="flex flex-col gap-3 text-sm text-zinc-500 mb-8 font-mono">
              <div className="flex items-center gap-3">
                <MapPin size={16} />
                <span>{data.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={16} />
                <span>{data.languages}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-8 relative">
               <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-700 to-transparent rounded-full opacity-50"></div>
               <p className="text-zinc-300 leading-relaxed text-lg italic pl-4">
                "{data.bio}"
               </p>
            </div>

            {/* Socials */}
            <div className="flex gap-4 mt-auto">
              <a href={`mailto:${data.socials.email}`} className="p-3 bg-zinc-900 rounded-full hover:bg-white hover:text-black transition-colors duration-300">
                <Mail size={20} />
              </a>
              <a href={`https://instagram.com/${data.socials.instagram}`} target="_blank" rel="noreferrer" className="p-3 bg-zinc-900 rounded-full hover:bg-[#E1306C] hover:text-white transition-colors duration-300">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-3 bg-zinc-900 rounded-full hover:bg-[#5865F2] hover:text-white transition-colors duration-300">
                <Disc size={20} />
              </a>
            </div>
          </div>
        </motion.aside>

        {/* === Right Content (Scrollable) === */}
        <div className="flex-1 lg:ml-[400px] xl:ml-[450px] p-6 lg:p-12 xl:p-16 space-y-20">
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Showreel Section */}
            <motion.section variants={itemVariants} className="space-y-6">
              <h2 className="text-3xl font-display font-bold">Showreels</h2>
              <div className="relative aspect-video rounded-3xl overflow-hidden group bg-zinc-900 ring-1 ring-zinc-800">
                 {/* In a real app, this would be a video player overlay */}
                 <img src={data.showreelThumbnail} alt="Showreel" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                 <a href={data.showreelLink} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/20">
                      <Play fill="white" className="ml-1 text-white" size={32} />
                    </div>
                 </a>
                 <div className="absolute bottom-6 left-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1 block">Featured Work</span>
                    <h3 className="text-xl font-bold">2024 Visual Anthology</h3>
                 </div>
              </div>
            </motion.section>

            {/* Editing Tools */}
            <motion.section variants={itemVariants} className="space-y-6 mt-16">
              <h2 className="text-3xl font-display font-bold">Editing Arsenal</h2>
              <div className="flex flex-wrap gap-3">
                {data.tools.map((tool, i) => (
                  <span key={i} className="px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 font-medium hover:border-zinc-600 hover:text-white transition-colors cursor-default flex items-center gap-2">
                    {tool.includes('Premiere') && <span className="text-purple-500 font-bold text-xs bg-purple-500/10 px-1 rounded">Pr</span>}
                    {tool.includes('After') && <span className="text-blue-500 font-bold text-xs bg-blue-500/10 px-1 rounded">Ae</span>}
                    {tool}
                  </span>
                ))}
              </div>
            </motion.section>

            {/* AI Tools */}
             <motion.section variants={itemVariants} className="space-y-6 mt-12">
              <h2 className="text-3xl font-display font-bold flex items-center gap-3">
                AI Integrations
                <span className="text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2 py-0.5 rounded-md font-mono">NEXT GEN</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.aiTools.map((tool, i) => (
                  <div key={i} className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                     <span className="relative z-10 font-medium text-zinc-300 group-hover:text-white">{tool}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* My Work / Gallery */}
            <motion.section variants={itemVariants} className="space-y-8 mt-20">
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-display font-bold">Selected Works</h2>
                <span className="text-zinc-500 font-mono text-sm hidden sm:block">SCROLL DOWN ↓</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.projects.map((project) => (
                  <div key={project.id} className="group relative rounded-2xl overflow-hidden bg-zinc-900 aspect-[4/5] md:aspect-[3/4]">
                    <img src={project.thumbnail} alt={project.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-300"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block px-2 py-1 bg-white/10 backdrop-blur-md rounded text-xs font-mono mb-2">{project.category}</span>
                      <h3 className="text-2xl font-bold leading-tight mb-2">{project.title}</h3>
                      <a href={project.link} className="inline-flex items-center text-sm font-medium text-zinc-300 hover:text-white mt-2 group/link">
                        Watch Video <ExternalLink size={14} className="ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Footer */}
            <motion.footer variants={itemVariants} className="pt-20 pb-10 border-t border-zinc-900 mt-20 text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} {data.name}. All rights reserved.</p>
                <div className="text-zinc-700 text-xs font-mono uppercase tracking-widest">
                  Made with CineFolio
                </div>
              </div>
            </motion.footer>

          </motion.div>
        </div>
      </div>
    </div>
  );
};