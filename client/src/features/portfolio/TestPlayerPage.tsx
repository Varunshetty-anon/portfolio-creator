import React from 'react';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

export default function TestPlayerPage() {
  const sources = [
    { name: 'Cloudinary', url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4' },
    { name: 'Direct MP4', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    { name: 'Vimeo', url: 'https://vimeo.com/90509568' },
    { name: 'YouTube', url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4' },
    // Google Drive direct link
    { name: 'Google Drive', url: 'https://drive.google.com/file/d/1vO3N0-bW-uG9-T3iYf8O-wO2h5s-4t/view?usp=sharing' }
  ];

  return (
    <div className="p-8 bg-zinc-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Phase 1.0 Player Audit</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sources.map(src => (
          <div key={src.name} className="border border-zinc-700 p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-4">{src.name}</h2>
            <div className="w-full aspect-video bg-black">
              <FramesPlayer url={src.url} controls={true} autoplay={false} muted={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
