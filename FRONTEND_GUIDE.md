# 🎨 Frontend Integration Guide

## What to Do in Your Frontend (localhost:8080)

Your ByteRyte backend is running on **localhost:3000**. Here's what you need to implement in your frontend to connect to it.

---

## 📋 Quick Checklist

- [ ] Create API service to communicate with backend
- [ ] Implement zero-knowledge encryption (client-side)
- [ ] Add authentication flow (register/login)
- [ ] Create vault management UI
- [ ] Add password item CRUD
- [ ] Handle encrypted data storage

---

## 🔐 Step 1: Implement Zero-Knowledge Encryption

**CRITICAL**: The backend stores ONLY encrypted data. Your frontend MUST handle all encryption/decryption.

### Install Crypto Libraries

```bash
npm install argon2-browser tweetnacl tweetnacl-util
# or
yarn add argon2-browser tweetnacl tweetnacl-util
```

### Create Crypto Service (`crypto.service.js`)

```javascript
import argon2 from 'argon2-browser';
import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

class CryptoService {
  /**
   * Derive encryption key from master password
   * This happens ONLY in the browser - never sent to server
   */
  async deriveMasterKey(email, masterPassword) {
    const result = await argon2.hash({
      pass: masterPassword,
      salt: email, // Use email as salt (or derive separate salt)
      type: argon2.ArgonType.Argon2id,
      hashLen: 32,
      time: 3,      // iterations
      mem: 65536,   // 64 MB memory
      parallelism: 4
    });
    
    return result.hash; // 32-byte key
  }

  /**
   * Generate password verifier for server authentication
   * Server NEVER sees the actual password
   */
  async generatePasswordVerifier(email, masterPassword) {
    const masterKey = await this.deriveMasterKey(email, masterPassword);
    
    // Double-hash for verifier (server stores this)
    const verifier = await argon2.hash({
      pass: masterKey,
      salt: 'byteryte-verifier-salt',
      type: argon2.ArgonType.Argon2id,
      hashLen: 32,
      time: 1,
      mem: 32768,
      parallelism: 2
    });
    
    return encodeBase64(verifier.hash);
  }

  /**
   * Generate vault encryption key
   */
  generateVaultKey() {
    return nacl.randomBytes(32); // 256-bit key
  }

  /**
   * Encrypt vault key with master key
   */
  async encryptVaultKey(vaultKey, masterKey) {
    const nonce = nacl.randomBytes(24);
    const encrypted = nacl.secretbox(vaultKey, nonce, masterKey);
    
    // Combine nonce + ciphertext
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);
    
    return encodeBase64(combined);
  }

  /**
   * Decrypt vault key with master key
   */
  async decryptVaultKey(encryptedVaultKey, masterKey) {
    const combined = decodeBase64(encryptedVaultKey);
    const nonce = combined.slice(0, 24);
    const ciphertext = combined.slice(24);
    
    const decrypted = nacl.secretbox.open(ciphertext, nonce, masterKey);
    if (!decrypted) {
      throw new Error('Failed to decrypt vault key');
    }
    
    return decrypted;
  }

  /**
   * Encrypt password item data
   */
  async encryptItem(itemData, vaultKey) {
    const nonce = nacl.randomBytes(24);
    const plaintext = encodeUTF8(JSON.stringify(itemData));
    const encrypted = nacl.secretbox(plaintext, nonce, vaultKey);
    
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);
    
    return encodeBase64(combined);
  }

  /**
   * Decrypt password item data
   */
  async decryptItem(encryptedBlob, vaultKey) {
    const combined = decodeBase64(encryptedBlob);
    const nonce = combined.slice(0, 24);
    const ciphertext = combined.slice(24);
    
    const decrypted = nacl.secretbox.open(ciphertext, nonce, vaultKey);
    if (!decrypted) {
      throw new Error('Failed to decrypt item');
    }
    
    return JSON.parse(decodeUTF8(decrypted));
  }
}

export default new CryptoService();
```

---

## 🌐 Step 2: Create API Service

### API Service (`api.service.js`)

```javascript
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('byteryte_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('byteryte_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('byteryte_token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // ============ AUTH ============
  async register(email, passwordVerifier, encryptedVaultKey) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        passwordVerifier,
        encryptedVaultKey,
      }),
    });
  }

  async login(email, passwordVerifier, deviceFingerprint, deviceName) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        passwordVerifier,
        deviceFingerprint,
        deviceName,
      }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // ============ VAULTS ============
  async getVaults() {
    return this.request('/vaults');
  }

  async createVault(name, type, encryptedVaultKey) {
    return this.request('/vaults', {
      method: 'POST',
      body: JSON.stringify({ name, type, encryptedVaultKey }),
    });
  }

  async getVaultItems(vaultId) {
    return this.request(`/vaults/${vaultId}/items`);
  }

  // ============ ITEMS ============
  async createItem(vaultId, encryptedBlob, metadata) {
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify({
        vaultId,
        encryptedBlob,
        metadata,
      }),
    });
  }

  async getItem(itemId) {
    return this.request(`/items/${itemId}`);
  }

  async updateItem(itemId, encryptedBlob, metadata) {
    return this.request(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ encryptedBlob, metadata }),
    });
  }

  async deleteItem(itemId) {
    return this.request(`/items/${itemId}`, { method: 'DELETE' });
  }

  // ============ DEVICES ============
  async getDevices() {
    return this.request('/devices');
  }

  async revokeDevice(deviceId) {
    return this.request(`/devices/${deviceId}`, { method: 'DELETE' });
  }
}

export default new ApiService();
```

---

## 🔑 Step 3: Implement Authentication Flow

### Registration Example

```javascript
import cryptoService from './crypto.service.js';
import apiService from './api.service.js';

async function registerUser(email, masterPassword) {
  try {
    // 1. Derive master key from password (STAYS IN BROWSER)
    const masterKey = await cryptoService.deriveMasterKey(email, masterPassword);
    
    // 2. Generate password verifier (SENT TO SERVER)
    const passwordVerifier = await cryptoService.generatePasswordVerifier(email, masterPassword);
    
    // 3. Generate vault encryption key
    const vaultKey = cryptoService.generateVaultKey();
    
    // 4. Encrypt vault key with master key
    const encryptedVaultKey = await cryptoService.encryptVaultKey(vaultKey, masterKey);
    
    // 5. Register with server
    const response = await apiService.register(email, passwordVerifier, encryptedVaultKey);
    
    // 6. Store token
    apiService.setToken(response.token);
    
    // 7. Store master key in memory (NOT localStorage for security)
    window.sessionMasterKey = masterKey;
    window.sessionVaultKey = vaultKey;
    
    console.log('✅ Registration successful!');
    return response.user;
  } catch (error) {
    console.error('❌ Registration failed:', error);
    throw error;
  }
}
```

### Login Example

```javascript
async function loginUser(email, masterPassword) {
  try {
    // 1. Derive master key from password
    const masterKey = await cryptoService.deriveMasterKey(email, masterPassword);
    
    // 2. Generate password verifier
    const passwordVerifier = await cryptoService.generatePasswordVerifier(email, masterPassword);
    
    // 3. Get device fingerprint
    const deviceFingerprint = getDeviceFingerprint();
    const deviceName = getDeviceName();
    
    // 4. Login with server
    const response = await apiService.login(
      email,
      passwordVerifier,
      deviceFingerprint,
      deviceName
    );
    
    // 5. Store token
    apiService.setToken(response.token);
    
    // 6. Decrypt vault key
    const vaultKey = await cryptoService.decryptVaultKey(
      response.user.encryptedVaultKey,
      masterKey
    );
    
    // 7. Store keys in memory
    window.sessionMasterKey = masterKey;
    window.sessionVaultKey = vaultKey;
    
    console.log('✅ Login successful!');
    return response.user;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
}

// Helper functions
function getDeviceFingerprint() {
  // Generate unique device ID (use fingerprint.js or similar)
  return navigator.userAgent + navigator.language + screen.width;
}

function getDeviceName() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Linux')) return 'Linux PC';
  return 'Unknown Device';
}
```

---

## 💾 Step 4: Save & Retrieve Password Items

### Save New Password

```javascript
async function savePassword(vaultId, passwordData) {
  try {
    // 1. Get vault key from memory
    const vaultKey = window.sessionVaultKey;
    
    // 2. Prepare item data
    const itemData = {
      type: 'LOGIN',
      name: passwordData.name,
      username: passwordData.username,
      password: passwordData.password,
      url: passwordData.url,
      notes: passwordData.notes,
      customFields: passwordData.customFields || []
    };
    
    // 3. Encrypt the entire item
    const encryptedBlob = await cryptoService.encryptItem(itemData, vaultKey);
    
    // 4. Prepare metadata (NOT encrypted - for search/display)
    const metadata = {
      name: passwordData.name,
      url: passwordData.url,
      favicon: passwordData.favicon,
      category: passwordData.category
    };
    
    // 5. Save to server
    const response = await apiService.createItem(vaultId, encryptedBlob, metadata);
    
    console.log('✅ Password saved!');
    return response.item;
  } catch (error) {
    console.error('❌ Failed to save password:', error);
    throw error;
  }
}
```

### Retrieve & Decrypt Password

```javascript
async function getPassword(itemId) {
  try {
    // 1. Fetch encrypted item from server
    const response = await apiService.getItem(itemId);
    
    // 2. Get vault key from memory
    const vaultKey = window.sessionVaultKey;
    
    // 3. Decrypt the item
    const decryptedData = await cryptoService.decryptItem(
      response.item.encryptedBlob,
      vaultKey
    );
    
    console.log('✅ Password decrypted!');
    return {
      ...response.item,
      ...decryptedData // Merge metadata + decrypted sensitive data
    };
  } catch (error) {
    console.error('❌ Failed to decrypt password:', error);
    throw error;
  }
}
```

---

## 🎨 Step 5: UI Components to Build

### 1. **Registration Form**
```html
<form id="register-form">
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="masterPassword" placeholder="Master Password" required />
  <input type="password" name="confirmPassword" placeholder="Confirm Password" required />
  <button type="submit">Create Account</button>
</form>
```

### 2. **Login Form**
```html
<form id="login-form">
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="masterPassword" placeholder="Master Password" required />
  <button type="submit">Login</button>
</form>
```

### 3. **Vault Dashboard**
- Display list of vaults
- Show item count per vault
- Create new vault button

### 4. **Password List**
- Display items from selected vault
- Show metadata (name, URL, favicon)
- Click to view/edit (decrypt on demand)

### 5. **Add/Edit Password Form**
```html
<form id="password-form">
  <input type="text" name="name" placeholder="Name (e.g., Gmail)" required />
  <input type="text" name="username" placeholder="Username" />
  <input type="password" name="password" placeholder="Password" />
  <input type="url" name="url" placeholder="Website URL" />
  <textarea name="notes" placeholder="Notes"></textarea>
  <button type="submit">Save</button>
</form>
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Store master key ONLY in memory (`window.sessionMasterKey`)
- Clear keys on logout
- Use HTTPS in production
- Implement password strength meter
- Add 2FA support (TOTP)
- Validate all inputs

### ❌ DON'T:
- Store master password or master key in localStorage
- Send unencrypted data to server
- Log sensitive data to console (in production)
- Trust server with decryption
- Hardcode secrets in frontend

---

## 🧪 Testing Your Integration

### Test Registration
```javascript
// In browser console
await registerUser('test@example.com', 'super-secure-password-123');
```

### Test Login
```javascript
await loginUser('test@example.com', 'super-secure-password-123');
```

### Test Save Password
```javascript
const vaultId = 'your-vault-id-from-api';
await savePassword(vaultId, {
  name: 'Gmail',
  username: 'user@gmail.com',
  password: 'my-gmail-password',
  url: 'https://gmail.com',
  notes: 'Personal email'
});
```

### Test Get Password
```javascript
const itemId = 'your-item-id-from-api';
const password = await getPassword(itemId);
console.log(password);
```

---

## 📚 Full Example: Complete Auth Flow

```javascript
// main.js - Complete example

import cryptoService from './crypto.service.js';
import apiService from './api.service.js';

// Handle registration
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.masterPassword.value;
  
  try {
    await registerUser(email, password);
    window.location.href = '/dashboard.html';
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
});

// Handle login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.masterPassword.value;
  
  try {
    await loginUser(email, password);
    window.location.href = '/dashboard.html';
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
});

// Load vaults on dashboard
async function loadDashboard() {
  const vaults = await apiService.getVaults();
  displayVaults(vaults);
}

// Display vaults
function displayVaults(vaults) {
  const container = document.getElementById('vaults-list');
  container.innerHTML = vaults.map(vault => `
    <div class="vault-card" onclick="openVault('${vault.id}')">
      <h3>${vault.name}</h3>
      <p>${vault._count.items} items</p>
    </div>
  `).join('');
}

// Open vault and load items
async function openVault(vaultId) {
  const items = await apiService.getVaultItems(vaultId);
  displayItems(items);
}

// Display items (metadata only, decrypt on click)
function displayItems(items) {
  const container = document.getElementById('items-list');
  container.innerHTML = items.map(item => `
    <div class="item-card" onclick="viewItem('${item.id}')">
      <img src="${item.metadata.favicon || '/default-icon.png'}" />
      <h4>${item.metadata.name}</h4>
      <p>${item.metadata.url}</p>
    </div>
  `).join('');
}

// View item (decrypt password)
async function viewItem(itemId) {
  const item = await getPassword(itemId);
  showPasswordModal(item);
}
```

---

## 🎯 Next Steps

1. **Copy the crypto.service.js and api.service.js** files to your frontend
2. **Install crypto libraries**: `npm install argon2-browser tweetnacl tweetnacl-util`
3. **Update your frontend components** to use these services
4. **Test registration flow** first
5. **Then test login and password saving**
6. **Build your UI** around these core functions

---

## 🆘 Need Help?

- **Backend API docs**: See `API_TESTING.md`
- **Crypto examples**: See `FRONTEND_CONNECTION.md`
- **Backend running**: Check `http://localhost:3000/health`

Your backend is ready and waiting! Just implement these crypto functions in your frontend and you're good to go! 🚀
