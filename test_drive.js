const fileId = "1yvtfSktGTJa0rTdtzHPr90CcP5q11oFc";
const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
const fs = require('fs');

async function test() {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (response.headers.get('content-type')?.includes('text/html')) {
    const text = await response.text();
    fs.writeFileSync('virus_scan.html', text);
    console.log("Saved virus_scan.html");
  }
}

test();
