const fileId = "1yvtfSktGTJa0rTdtzHPr90CcP5q11oFc"; // from the image
const url = `https://frames-aivg.onrender.com/api/v1/portfolio/drive-proxy/${fileId}`;

async function test() {
  console.log("Testing without Range");
  const res1 = await fetch(url);
  console.log("Status:", res1.status);
  console.log("Headers:");
  res1.headers.forEach((v, k) => console.log(k, v));

  console.log("\nTesting with Range");
  const res2 = await fetch(url, { headers: { 'Range': 'bytes=0-100' } });
  console.log("Status:", res2.status);
  console.log("Headers:");
  res2.headers.forEach((v, k) => console.log(k, v));
}

test();
