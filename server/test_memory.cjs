const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { execSync } = require('child_process');
const http = require('http');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), (req, res) => {
  const mem = process.memoryUsage();
  console.log(`[Server] Memory during upload: ${Math.round(mem.rss / 1024 / 1024)} MB`);
  res.send('ok');
});

const server = app.listen(3005, async () => {
  console.log(`[Server] Started on port 3005`);
  const initialMem = process.memoryUsage();
  console.log(`[Server] Initial memory: ${Math.round(initialMem.rss / 1024 / 1024)} MB`);

  const sizes = [50, 100, 300];
  
  for (const size of sizes) {
    console.log(`\n--- Testing ${size}MB Upload ---`);
    const filepath = `./dummy-${size}mb.tmp`;
    
    // Create dummy file
    execSync(`fsutil file createnew ${filepath} ${size * 1024 * 1024}`);
    
    // Native HTTP request to upload file
    console.log(`[Client] Uploading ${size}MB...`);
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    const req = http.request({
      hostname: 'localhost',
      port: 3005,
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    });

    req.write(`--${boundary}\r\n`);
    req.write(`Content-Disposition: form-data; name="file"; filename="${filepath}"\r\n`);
    req.write('Content-Type: application/octet-stream\r\n\r\n');

    const fileStream = fs.createReadStream(filepath);
    
    await new Promise((resolve) => {
      fileStream.pipe(req, { end: false });
      fileStream.on('end', () => {
        req.write(`\r\n--${boundary}--\r\n`);
        req.end();
      });
      req.on('response', (res) => {
        res.resume();
        res.on('end', resolve);
      });
    });
    
    // Cleanup
    fs.unlinkSync(filepath);
    
    // Wait for GC
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\nTests complete.');
  server.close();
});
