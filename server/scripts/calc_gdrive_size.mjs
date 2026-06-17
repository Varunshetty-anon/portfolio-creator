import mongoose from 'mongoose';
import dotenv from 'dotenv';
import https from 'https';
import { URL } from 'url';

dotenv.config({ path: '.env' });
dotenv.config({ path: 'server/.env' });
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const userPass = process.env.MONGODB_URI.match(/mongodb\+srv:\/\/(.*?)(?=@)/)[1];
const MONGODB_URI = `mongodb://${userPass}@ac-4orincq-shard-00-00.brqi4ap.mongodb.net:27017,ac-4orincq-shard-00-01.brqi4ap.mongodb.net:27017,ac-4orincq-shard-00-02.brqi4ap.mongodb.net:27017/frames?ssl=true&replicaSet=atlas-brw9jv-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Mock schema for Project
const projectSchema = new mongoose.Schema({
  title: String,
  videoSource: String,
  videoUrl: String,
});
const Project = mongoose.model('Project', projectSchema);

async function getResolvedDriveUrl(fileId) {
  const ucUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  const response = await fetch(ucUrl, {
    headers: { ...headers, Range: 'bytes=0-0' }
  });

  let finalUrl = '';

  if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
    const text = await response.text();
    const actionMatch = text.match(/action="([^"]+)"/);
    const uuidMatch = text.match(/name="uuid" value="([^"]+)"/);
    const oldConfirmMatch = text.match(/confirm=([a-zA-Z0-9_-]+)/);
    
    if (actionMatch && uuidMatch) {
      const actionUrl = actionMatch[1].startsWith('http') ? actionMatch[1] : `https://drive.google.com${actionMatch[1]}`;
      finalUrl = `${actionUrl}?id=${fileId}&export=download&confirm=t&uuid=${uuidMatch[1]}`;
    } else if (oldConfirmMatch) {
      finalUrl = `${ucUrl}&confirm=${oldConfirmMatch[1]}`;
    } else {
      throw new Error('Google Drive file not found or private');
    }
  } else {
    finalUrl = response.url;
  }
  return finalUrl;
}

function getFileSize(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (urlToFetch, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));
      const reqOpt = {
        headers: {
          'Range': 'bytes=0-0',
          'User-Agent': 'Mozilla/5.0'
        }
      };
      https.get(urlToFetch, reqOpt, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          let redirectUrl = response.headers.location;
          if (!redirectUrl.startsWith('http')) {
             redirectUrl = new URL(redirectUrl, urlToFetch).toString();
          }
          makeRequest(redirectUrl, redirectCount + 1);
        } else {
          // response is 206 Partial Content or 200 OK
          const contentRange = response.headers['content-range'];
          const contentLength = response.headers['content-length'];
          
          let size = 0;
          if (contentRange) {
            const match = contentRange.match(/\/(\d+)$/);
            if (match) size = parseInt(match[1], 10);
          } else if (contentLength) {
            size = parseInt(contentLength, 10);
          }
          response.destroy();
          resolve(size);
        }
      }).on('error', reject);
    };
    makeRequest(url);
  });
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const projects = await Project.find({ videoSource: 'gdrive' });
  console.log(`Found ${projects.length} projects with Google Drive videos.`);

  let totalSizeBytes = 0;
  let successCount = 0;

  for (const project of projects) {
    if (!project.videoUrl) continue;
    
    // Extract ID from videoUrl
    let fileId = project.videoUrl;
    const match = project.videoUrl.match(/[-\w]{25,}/);
    if (match) fileId = match[0];
    
    try {
      console.log(`Resolving project ${project.title || 'Untitled'} (${fileId})...`);
      const resolvedUrl = await getResolvedDriveUrl(fileId);
      const size = await getFileSize(resolvedUrl);
      console.log(`  Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
      totalSizeBytes += size;
      successCount++;
    } catch (err) {
      console.error(`  Error resolving ${fileId}:`, err.message);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total Projects Checked: ${projects.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Total Size: ${(totalSizeBytes / 1024 / 1024).toFixed(2)} MB (${(totalSizeBytes / 1024 / 1024 / 1024).toFixed(2)} GB)`);
  
  mongoose.disconnect();
}

main().catch(console.error);
