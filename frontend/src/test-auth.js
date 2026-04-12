// Quick test script - paste this in browser console

const API_URL = 'https://cxzol9zbdf.execute-api.us-west-2.amazonaws.com/prod';

async function testAuth() {
  console.log('🔍 Testing authentication flow...\n');
  
  // 1. Register
  console.log('1️⃣ Registering user...');
  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      password: 'Test1234',
      name: 'Console Test'
    })
  });
  
  console.log('Register Status:', registerRes.status);
  console.log('Register Headers:', [...registerRes.headers.entries()]);
  const registerData = await registerRes.json();
  console.log('Register Data:', registerData);
  
  // 2. Check cookies
  console.log('\n2️⃣ Checking cookies...');
  console.log('document.cookie:', document.cookie);
  
  // 3. Call /auth/me
  console.log('\n3️⃣ Calling /auth/me...');
  const meRes = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  
  console.log('Me Status:', meRes.status);
  console.log('Me Headers:', [...meRes.headers.entries()]);
  const meData = await meRes.json();
  console.log('Me Data:', meData);
}

testAuth();
