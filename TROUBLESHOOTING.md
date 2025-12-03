# 🐛 Troubleshooting Registration Error

## Error You're Seeing

```json
[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": ["passwordVerifier"],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": ["encryptedVaultKey"],
    "message": "Required"
  }
]
```

**This means**: The backend is receiving your request, but `passwordVerifier` and `encryptedVaultKey` are missing or undefined.

---

## ✅ Quick Fix

### Option 1: Test with Simple curl Command

First, let's test the backend directly to ensure it works:

```powershell
# PowerShell command to test registration
$body = @{
    email = "test@example.com"
    passwordVerifier = "test-password-hash-12345"
    encryptedVaultKey = "test-encrypted-key-67890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "createdAt": "..."
  },
  "token": "eyJhbGc..."
}
```

---

### Option 2: Fix Your Frontend Code

The issue is likely in how you're calling the API. Here's the corrected version:

#### ❌ **Wrong Way (Missing await or wrong structure):**

```javascript
// This won't work - missing await or incorrect format
apiService.register(email, passwordVerifier, encryptedVaultKey);
```

#### ✅ **Correct Way:**

```javascript
async function registerUser(email, masterPassword) {
  try {
    // 1. Derive master key
    const masterKey = await cryptoService.deriveMasterKey(email, masterPassword);
    
    // 2. Generate password verifier
    const passwordVerifier = await cryptoService.generatePasswordVerifier(email, masterPassword);
    
    // 3. Generate vault key
    const vaultKey = cryptoService.generateVaultKey();
    
    // 4. Encrypt vault key
    const encryptedVaultKey = await cryptoService.encryptVaultKey(vaultKey, masterKey);
    
    // 5. IMPORTANT: Log to verify values exist
    console.log('Email:', email);
    console.log('Password Verifier:', passwordVerifier);
    console.log('Encrypted Vault Key:', encryptedVaultKey);
    
    // 6. Register (make sure these are strings!)
    const response = await apiService.register(
      email,
      passwordVerifier,
      encryptedVaultKey
    );
    
    console.log('✅ Registration successful:', response);
    return response;
  } catch (error) {
    console.error('❌ Registration failed:', error);
    throw error;
  }
}
```

---

### Option 3: Simplified Test (No Crypto)

If the crypto libraries aren't working, test with dummy values first:

```javascript
// Test registration WITHOUT crypto libraries
async function testRegistration() {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test@example.com',
      passwordVerifier: 'dummy-hash-12345',
      encryptedVaultKey: 'dummy-encrypted-key-67890'
    })
  });
  
  const data = await response.json();
  console.log(data);
  return data;
}

// Run in browser console
testRegistration();
```

**This should work and return a user + token!**

---

## 🔍 Common Issues & Solutions

### Issue 1: Crypto Libraries Not Installed

```bash
# Make sure these are installed
npm install argon2-browser tweetnacl tweetnacl-util
```

### Issue 2: Import Errors

```javascript
// ES6 Modules (if using type="module")
import cryptoService from './crypto.service.js';
import apiService from './api.service.js';

// CommonJS (if using require)
const cryptoService = require('./crypto.service.js');
const apiService = require('./api.service.js');
```

### Issue 3: CORS Error

If you see CORS error, check:
1. Backend is running: `http://localhost:3000/health`
2. Frontend is on `http://localhost:8080`
3. Backend `.env` has: `CORS_ORIGIN=http://localhost:8080`

### Issue 4: Values are Undefined

Add debugging:

```javascript
async function registerUser(email, masterPassword) {
  // Add checks
  if (!email) throw new Error('Email is required');
  if (!masterPassword) throw new Error('Master password is required');
  
  const masterKey = await cryptoService.deriveMasterKey(email, masterPassword);
  console.log('Master key generated:', masterKey ? '✓' : '✗');
  
  const passwordVerifier = await cryptoService.generatePasswordVerifier(email, masterPassword);
  console.log('Password verifier:', passwordVerifier ? '✓' : '✗');
  
  const vaultKey = cryptoService.generateVaultKey();
  console.log('Vault key generated:', vaultKey ? '✓' : '✗');
  
  const encryptedVaultKey = await cryptoService.encryptVaultKey(vaultKey, masterKey);
  console.log('Encrypted vault key:', encryptedVaultKey ? '✓' : '✗');
  
  // Now register
  const response = await apiService.register(email, passwordVerifier, encryptedVaultKey);
  return response;
}
```

---

## 🧪 Step-by-Step Debugging

### Step 1: Test Backend Directly

```javascript
// In browser console (no crypto needed)
fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'debug@test.com',
    passwordVerifier: 'test123',
    encryptedVaultKey: 'encrypted123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**If this works** → Backend is fine, issue is in your frontend crypto

**If this fails** → Backend issue, check server logs

### Step 2: Check Your Request Payload

Add this to your `api.service.js`:

```javascript
async request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (this.token) {
    headers['Authorization'] = `Bearer ${this.token}`;
  }

  // DEBUG: Log the request
  console.log('🌐 API Request:', {
    url: `${this.baseURL}${endpoint}`,
    method: options.method || 'GET',
    body: options.body
  });

  const response = await fetch(`${this.baseURL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  // DEBUG: Log the response
  console.log('📥 API Response:', data);

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}
```

### Step 3: Verify Crypto Output

```javascript
// Test crypto functions individually
import cryptoService from './crypto.service.js';

async function testCrypto() {
  const email = 'test@example.com';
  const password = 'MyPassword123';
  
  // Test 1: Derive master key
  const masterKey = await cryptoService.deriveMasterKey(email, password);
  console.log('Master Key:', masterKey);
  console.log('Master Key type:', typeof masterKey);
  console.log('Master Key length:', masterKey?.length);
  
  // Test 2: Generate verifier
  const verifier = await cryptoService.generatePasswordVerifier(email, password);
  console.log('Verifier:', verifier);
  console.log('Verifier type:', typeof verifier);
  
  // Test 3: Generate vault key
  const vaultKey = cryptoService.generateVaultKey();
  console.log('Vault Key:', vaultKey);
  console.log('Vault Key type:', typeof vaultKey);
  
  // Test 4: Encrypt vault key
  const encrypted = await cryptoService.encryptVaultKey(vaultKey, masterKey);
  console.log('Encrypted:', encrypted);
  console.log('Encrypted type:', typeof encrypted);
  
  return { masterKey, verifier, vaultKey, encrypted };
}

testCrypto();
```

---

## 💡 Quick Solution (No Crypto for Now)

If you just want to test the backend without implementing crypto:

```javascript
// Temporary simple registration
async function quickRegister(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      passwordVerifier: btoa(password), // Simple base64 encoding (NOT SECURE)
      encryptedVaultKey: btoa('my-vault-key-' + Date.now())
    })
  });
  
  return response.json();
}

// Use it
quickRegister('user@example.com', 'password123')
  .then(console.log)
  .catch(console.error);
```

**⚠️ This is ONLY for testing! Use proper crypto in production!**

---

## 📋 Checklist

- [ ] Backend is running (`npm run dev`)
- [ ] Backend health check works (`http://localhost:3000/health`)
- [ ] Crypto libraries installed in frontend
- [ ] `crypto.service.js` file exists
- [ ] `api.service.js` file exists
- [ ] Services are properly imported
- [ ] Request body contains all 3 fields: `email`, `passwordVerifier`, `encryptedVaultKey`
- [ ] Values are strings (not undefined/null)
- [ ] CORS is configured correctly

---

## 🎯 Recommended Next Steps

1. **Test with dummy data first** (Option 3 above)
2. **If that works**, implement crypto libraries
3. **Add console.logs** to verify each step
4. **Check browser Network tab** to see the actual request

---

## 🆘 Still Not Working?

Share:
1. Your frontend code (registration function)
2. Browser console errors
3. Network tab request/response
4. Backend terminal logs

I'll help you debug further! 🚀
