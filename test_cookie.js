const fileId = "1yvtfSktGTJa0rTdtzHPr90CcP5q11oFc";
const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

async function test() {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  
  if (response.headers.get('content-type')?.includes('text/html')) {
    const text = await response.text();
    const actionMatch = text.match(/action="([^"]+)"/);
    const uuidMatch = text.match(/name="uuid" value="([^"]+)"/);
    
    if (actionMatch && uuidMatch) {
      const action = actionMatch[1];
      const uuid = uuidMatch[1];
      const downloadUrl = `${action}?id=${fileId}&export=download&confirm=t&uuid=${uuid}`;
      
      console.log("Testing download URL WITHOUT COOKIE:");
      const res2 = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Range': 'bytes=0-100'
        }
      });
      console.log("Status:", res2.status);
      console.log("Content-Type:", res2.headers.get('content-type'));
    }
  }
}

test();
