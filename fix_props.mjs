import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.join(process.cwd(), 'client/src/features/vision');

for (let i = 1; i <= 10; i++) {
  const files = fs.readdirSync(TARGET_DIR);
  const targetFile = files.find(f => f.startsWith(`VisionB_${i}_`));
  if (targetFile) {
    const fullPath = path.join(TARGET_DIR, targetFile);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the props in FramesPlayer
    content = content.replace(
      /<FramesPlayer videoUrl={activeProject.videoUrl} posterUrl={activeProject.posterUrl} autoPlay loop muted \/>/g,
      '<FramesPlayer url={activeProject.videoUrl} thumbnail={activeProject.posterUrl} autoplay loop muted />'
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${targetFile}`);
  }
}
