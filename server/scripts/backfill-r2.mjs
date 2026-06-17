import mongoose from 'mongoose';
import dotenv from 'dotenv';
import https from 'https';
import { URL } from 'url';
import { spawn } from 'child_process';

dotenv.config({ path: '.env' });
dotenv.config({ path: 'server/.env' });

// Add IPv4 first to bypass Windows SRV issues
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

// Ensure correct URI bypasses SRV issues if needed
let MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI && MONGODB_URI.startsWith('mongodb+srv://')) {
  const userPass = MONGODB_URI.match(/mongodb\+srv:\/\/(.*?)(?=@)/)[1];
  MONGODB_URI = `mongodb://${userPass}@ac-4orincq-shard-00-00.brqi4ap.mongodb.net:27017,ac-4orincq-shard-00-01.brqi4ap.mongodb.net:27017,ac-4orincq-shard-00-02.brqi4ap.mongodb.net:27017/frames?ssl=true&replicaSet=atlas-brw9jv-shard-0&authSource=admin&retryWrites=true&w=majority`;
}

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;


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

const keepAliveAgent = new https.Agent({ keepAlive: true });

function streamToR2(url, fileId) {
  return new Promise((resolve, reject) => {
    const makeRequest = (urlToFetch, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));
      const reqOpt = {
        method: 'GET',
        agent: keepAliveAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      };
      
      const request = https.request(urlToFetch, reqOpt, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          let redirectUrl = response.headers.location;
          if (!redirectUrl.startsWith('http')) {
             redirectUrl = new URL(redirectUrl, urlToFetch).toString();
          }
          makeRequest(redirectUrl, redirectCount + 1);
        } else if (response.statusCode >= 200 && response.statusCode < 300) {
          const contentType = response.headers['content-type'] || 'video/mp4';
          
          // Spawn wrangler to upload stream to R2
          // Using cmd.exe to handle npx execution on Windows correctly
          const wrangler = spawn('cmd.exe', [
            '/c', 
            `npx -y wrangler@latest r2 object put frames-videos-r2/${fileId} --remote --pipe --content-type "${contentType}"`
          ], {
            env: {
              ...process.env,
              CLOUDFLARE_API_TOKEN,
              CLOUDFLARE_ACCOUNT_ID
            }
          });

          let stderrData = '';
          wrangler.stderr.on('data', d => stderrData += d.toString());

          wrangler.on('error', (err) => {
            response.destroy();
            reject(new Error(`Wrangler spawn failed: ${err.message}`));
          });

          wrangler.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Wrangler exited with code ${code}. Stderr: ${stderrData}`));
            }
          });

          // Pipe the video response directly into wrangler's stdin
          response.pipe(wrangler.stdin);

          response.on('error', (err) => {
            wrangler.kill();
            reject(new Error(`Download stream error: ${err.message}`));
          });

        } else {
          response.destroy();
          reject(new Error(`Drive returned ${response.statusCode}`));
        }
      });
      request.on('error', reject);
      request.end();
    };
    makeRequest(url);
  });
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const projects = await Project.find({ videoSource: 'gdrive' });
  console.log(`Found ${projects.length} projects with Google Drive videos.\n`);

  let successCount = 0;
  const failedFiles = [];

  for (const project of projects) {
    if (!project.videoUrl) continue;
    
    // Extract ID from videoUrl
    let fileId = project.videoUrl;
    const match = project.videoUrl.match(/[-\w]{25,}/);
    if (match) fileId = match[0];
    
    try {
      process.stdout.write(`Migrating project "${project.title || 'Untitled'}" (${fileId})... `);
      const resolvedUrl = await getResolvedDriveUrl(fileId);
      await streamToR2(resolvedUrl, fileId);
      console.log(`✅ Success`);
      successCount++;
    } catch (err) {
      console.log(`❌ Failed`);
      console.error(`   Error: ${err.message}`);
      failedFiles.push({ title: project.title, fileId, error: err.message });
    }
  }

  console.log('\n--- Migration Verification Report ---');
  console.log(`Total Projects Checked: ${projects.length}`);
  console.log(`Successful Migrations:  ${successCount}`);
  console.log(`Failed Migrations:      ${failedFiles.length}`);
  if (failedFiles.length > 0) {
    console.log('\nFailed Details:');
    failedFiles.forEach(f => console.log(`- ${f.title} (${f.fileId}): ${f.error}`));
  }
  
  mongoose.disconnect();
}

main().catch(console.error);
