require('dotenv').config();
const fs = require('fs');
const { execSync } = require('child_process');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
  const sizes = [50, 100, 300];
  
  for (const size of sizes) {
    console.log(`\n========================================`);
    console.log(`[Test] Testing ${size}MB Upload via Direct Cloudinary`);
    
    const initialMem = process.memoryUsage();
    console.log(`[Node] Memory before upload: ${Math.round(initialMem.rss / 1024 / 1024)} MB`);

    // 1. Backend Signature Generation
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = { timestamp, folder: 'frames/projects/videos', eager: 'sp_hd/m3u8', eager_async: true };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
    const { CLOUDINARY_API_KEY: apiKey, CLOUDINARY_CLOUD_NAME: cloudName } = process.env;
    
    console.log('[Backend] Generated signature successfully.');
    
    const filepath = `./dummy-${size}mb.tmp`;
    execSync(`fsutil file createnew ${filepath} ${size * 1024 * 1024}`);
    
    // 2. Client Direct Upload
    console.log(`[Client] Uploading ${size}MB directly to Cloudinary...`);
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    const req = require('https').request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudName}/video/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    });

    req.write(`--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${apiKey}\r\n`);
    req.write(`--${boundary}\r\nContent-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}\r\n`);
    req.write(`--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${signature}\r\n`);
    req.write(`--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\n${paramsToSign.folder}\r\n`);
    req.write(`--${boundary}\r\nContent-Disposition: form-data; name="eager"\r\n\r\n${paramsToSign.eager}\r\n`);
    req.write(`--${boundary}\r\nContent-Disposition: form-data; name="eager_async"\r\n\r\n${paramsToSign.eager_async}\r\n`);
    req.write(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filepath}"\r\n`);
    req.write('Content-Type: application/octet-stream\r\n\r\n');

    const fileStream = fs.createReadStream(filepath);
    
    const cloudinaryResponse = await new Promise((resolve) => {
      fileStream.pipe(req, { end: false });
      fileStream.on('end', () => {
        req.write(`\r\n--${boundary}--\r\n`);
        req.end();
      });
      req.on('response', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
    });
    
    const finalMem = process.memoryUsage();
    console.log(`[Node] Memory during/after upload: ${Math.round(finalMem.rss / 1024 / 1024)} MB`);
    console.log(`[Cloudinary] Success! Response URL: ${cloudinaryResponse.secure_url}`);
    
    fs.unlinkSync(filepath);
    
    // Wait for GC
    await new Promise(r => setTimeout(r, 1000));
  }
}

run();
