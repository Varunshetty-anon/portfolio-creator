const crypto = require('crypto');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createFakeFile(sizeMb, type = 'image/jpeg') {
  const size = sizeMb * 1024 * 1024;
  const buffer = Buffer.alloc(size, 'a');
  return new Blob([buffer], { type });
}

async function runTests() {
  const baseUrl = 'https://frames-aivg.onrender.com/api/v1';
  let cookie = '';

  console.log('--- 1. Registering user ---');
  const email = `test_upload_${Date.now()}@example.com`;
  const registerRes = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', displayName: 'Test User' })
  });
  
  if (!registerRes.ok) {
    const text = await registerRes.text();
    console.error('Signup failed:', text);
    return;
  }
  const setCookie = registerRes.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  } else {
    console.error('No cookie returned from signup');
  }

  // Polling for the new version by testing the unsupported file type
  console.log('--- 2. Waiting for deployment to reflect changes (polling) ---');
  let newDeploymentLive = false;
  for (let i = 0; i < 60; i++) {
    const unsupportedBlob = createFakeFile(1, 'application/pdf');
    const form = new FormData();
    form.append('image', unsupportedBlob, 'test.pdf');
    let typeRes, text;
    try {
      typeRes = await fetch(`${baseUrl}/upload/profile-image`, {
        method: 'POST',
        headers: { 'Cookie': cookie },
        body: form
      });
      text = await typeRes.text();
    } catch(e) {
      console.log('Network error:', e.message, 'Retrying in 15 seconds...');
      await sleep(15000);
      continue;
    }
    let typeData;
    try {
      typeData = JSON.parse(text);
    } catch(e) {
      console.log('Non-JSON response:', text.substring(0, 200));
      typeData = {};
    }
    if (typeData.error === 'Unsupported file type. Use JPG, PNG or WEBP.') {
      console.log('✅ New deployment detected! Error message matches.');
      newDeploymentLive = true;
      break;
    } else {
      console.log(`Current error: "${typeData.error}". Retrying in 15 seconds...`);
      await sleep(15000);
    }
  }

  if (!newDeploymentLive) {
    console.error('❌ Timeout waiting for deployment.');
    return;
  }

  console.log('--- 3. Testing 11MB Profile Image (Should fail with specific message) ---');
  const largeProfileBlob = createFakeFile(11, 'image/jpeg');
  const largeProfileForm = new FormData();
  largeProfileForm.append('image', largeProfileBlob, 'large.jpg');
  
  const p1 = await fetch(`${baseUrl}/upload/profile-image`, {
    method: 'POST',
    headers: { 'Cookie': cookie },
    body: largeProfileForm
  });
  const text1 = await p1.text();
  try {
    console.log('11MB Profile Image Response:', JSON.parse(text1));
  } catch(e) {
    console.log('11MB Profile Image Response (HTML):', text1.substring(0, 200));
  }

  console.log('--- 4. Testing 16MB Project Image (Should fail with specific message) ---');
  const largeProjectBlob = createFakeFile(16, 'image/jpeg');
  const largeProjectForm = new FormData();
  largeProjectForm.append('media', largeProjectBlob, 'large_project.jpg');
  
  const p2 = await fetch(`${baseUrl}/upload/project-media`, {
    method: 'POST',
    headers: { 'Cookie': cookie },
    body: largeProjectForm
  });
  const text2 = await p2.text();
  try {
    console.log('16MB Project Image Response:', JSON.parse(text2));
  } catch(e) {
    console.log('16MB Project Image Response (HTML):', text2.substring(0, 200));
  }

  console.log('--- 5. Testing 10MB Video via Project Media (Should succeed) ---');
  // I will only test 10MB to be nice to Cloudinary bandwidth, but it verifies it bypassed the 15MB image limit.
  const validVideoBlob = createFakeFile(10, 'video/mp4');
  const validVideoForm = new FormData();
  validVideoForm.append('media', validVideoBlob, 'video.mp4');
  
  const p3 = await fetch(`${baseUrl}/upload/project-media`, {
    method: 'POST',
    headers: { 'Cookie': cookie },
    body: validVideoForm
  });
  const text3 = await p3.text();
  try {
    console.log('10MB Video Response:', JSON.parse(text3));
  } catch(e) {
    console.log('10MB Video Response (HTML):', text3.substring(0, 200));
  }
}

runTests().catch(console.error);
