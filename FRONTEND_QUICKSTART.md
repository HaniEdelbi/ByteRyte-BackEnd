# 🎯 Quick Start: Frontend Integration

## Your Backend is Ready! ✅

**Backend URL**: `http://localhost:3000`  
**Frontend URL**: `http://localhost:8080`  
**Status**: ✅ Connected to MongoDB Atlas

---

## 🚀 What You Need to Do (3 Steps)

### Step 1: Install Crypto Libraries
```bash
npm install argon2-browser tweetnacl tweetnacl-util
```

### Step 2: Copy Services to Your Frontend

Create these two files in your frontend project:

**`crypto.service.js`** - Handles all encryption/decryption  
**`api.service.js`** - Communicates with backend

*(Full code in FRONTEND_GUIDE.md)*

### Step 3: Implement Auth Flow

```javascript
// Registration
await registerUser('user@example.com', 'masterPassword123');

// Login
await loginUser('user@example.com', 'masterPassword123');

// Save password
await savePassword(vaultId, {
  name: 'Gmail',
  username: 'user@gmail.com',
  password: 'secret123',
  url: 'https://gmail.com'
});
```

---

## 🔐 How Zero-Knowledge Works

```
┌─────────────────────────────────────────────────────┐
│                   YOUR FRONTEND                     │
│  (localhost:8080)                                   │
│                                                     │
│  1. User enters master password                    │
│  2. Derive encryption key (Argon2id)              │
│  3. Encrypt password data (NaCl)                   │
│  4. Send ENCRYPTED blob to backend                 │
│                                                     │
│  ✅ Encryption happens HERE                         │
│  ✅ Master key NEVER leaves browser                 │
└─────────────────────────────────────────────────────┘
                      ↓ HTTPS
                      ↓ Encrypted Data Only
┌─────────────────────────────────────────────────────┐
│                  YOUR BACKEND                       │
│  (localhost:3000)                                   │
│                                                     │
│  1. Receives encrypted blob                        │
│  2. Stores in MongoDB (still encrypted)            │
│  3. Returns encrypted blob on request              │
│                                                     │
│  ❌ Backend CANNOT decrypt                          │
│  ✅ Zero-knowledge architecture                     │
└─────────────────────────────────────────────────────┘
                      ↑ HTTPS
                      ↑ Encrypted Data Only
┌─────────────────────────────────────────────────────┐
│                   YOUR FRONTEND                     │
│  (localhost:8080)                                   │
│                                                     │
│  1. Receives encrypted blob                        │
│  2. User enters master password                    │
│  3. Derive same encryption key                     │
│  4. Decrypt password data                          │
│                                                     │
│  ✅ Decryption happens HERE                         │
│  ✅ Only user knows master password                 │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Essential Frontend Files to Create

### 1. `services/crypto.service.js`
- `deriveMasterKey()` - Password → Encryption Key
- `generatePasswordVerifier()` - For server auth
- `encryptItem()` - Encrypt password data
- `decryptItem()` - Decrypt password data

### 2. `services/api.service.js`
- `register()` - Create account
- `login()` - Authenticate
- `createItem()` - Save encrypted password
- `getItem()` - Retrieve encrypted password

### 3. `pages/register.html`
- Email input
- Master password input
- Submit → calls `registerUser()`

### 4. `pages/login.html`
- Email input
- Master password input
- Submit → calls `loginUser()`

### 5. `pages/dashboard.html`
- List vaults
- List password items
- Add/Edit password form

---

## 🧪 Test Your Setup

### 1. Test Backend Health
Open browser console:
```javascript
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log);
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-03T...",
  "version": "1.0.0",
  "database": "connected"
}
```

### 2. Test Registration
```javascript
// Copy crypto.service.js and api.service.js first
import apiService from './api.service.js';

const response = await apiService.register(
  'test@example.com',
  'hashed-password-verifier',
  'encrypted-vault-key'
);
console.log(response);
```

---

## 🔑 Key Concepts

### Master Password
- User creates this during registration
- NEVER sent to server
- Used to derive encryption keys
- If forgotten, data is LOST (zero-knowledge!)

### Password Verifier
- Hash of the master password
- Sent to server for authentication
- Server can verify identity but can't decrypt data

### Vault Key
- Random 256-bit key
- Encrypts all password items
- Encrypted with master key
- Stored encrypted in database

### Encrypted Blob
- All sensitive data (username, password, notes)
- Encrypted client-side before sending
- Server stores it as-is
- Decrypted only in browser

---

## 📚 Full Documentation

- **FRONTEND_GUIDE.md** - Complete implementation guide (START HERE)
- **API_TESTING.md** - Test all backend endpoints
- **FRONTEND_CONNECTION.md** - Crypto examples
- **FRONTEND_INTEGRATION.md** - Architecture overview

---

## 🎨 Example: Complete Login Flow

```javascript
// 1. User enters credentials
const email = 'user@example.com';
const masterPassword = 'super-secure-123';

// 2. Import services
import cryptoService from './crypto.service.js';
import apiService from './api.service.js';

// 3. Derive master key (browser only, never sent)
const masterKey = await cryptoService.deriveMasterKey(email, masterPassword);

// 4. Generate verifier (sent to server)
const verifier = await cryptoService.generatePasswordVerifier(email, masterPassword);

// 5. Login
const response = await apiService.login(
  email,
  verifier,
  'device-fingerprint-123',
  'Chrome on Windows'
);

// 6. Store JWT token
apiService.setToken(response.token);

// 7. Decrypt vault key
const vaultKey = await cryptoService.decryptVaultKey(
  response.user.encryptedVaultKey,
  masterKey
);

// 8. Store keys in memory (NOT localStorage!)
window.sessionMasterKey = masterKey;
window.sessionVaultKey = vaultKey;

// 9. Redirect to dashboard
window.location.href = '/dashboard.html';
```

---

## ⚠️ Important Security Rules

### ✅ DO:
- Encrypt ALL sensitive data client-side
- Store master key ONLY in memory (`window.sessionMasterKey`)
- Clear keys on logout
- Use secure random for vault keys
- Validate all user inputs

### ❌ DON'T:
- Store master password ANYWHERE
- Store master key in localStorage
- Send unencrypted data to backend
- Trust server with encryption
- Log sensitive data

---

## 🎯 Your Next Action

1. **Open FRONTEND_GUIDE.md** (most important!)
2. **Copy the crypto.service.js code**
3. **Copy the api.service.js code**
4. **Implement registration form**
5. **Test with your backend**

Your backend is running and ready! Just add these services to your frontend and you're done! 🚀

---

## 🆘 Common Issues

**CORS Error?**
- Backend has CORS enabled for `localhost:8080`
- Check that your frontend is on port 8080
- Or update `CORS_ORIGIN` in backend `.env`

**Can't connect to localhost:3000?**
- Make sure backend is running: `npm run dev`
- Check health: `http://localhost:3000/health`

**Encryption fails?**
- Check crypto libraries installed
- Use exact code from FRONTEND_GUIDE.md
- Test with simple example first

**401 Unauthorized?**
- Check JWT token is stored
- Token expires after 7 days
- Re-login to get new token

---

**Ready to build your frontend! See FRONTEND_GUIDE.md for complete code examples! 🎉**
