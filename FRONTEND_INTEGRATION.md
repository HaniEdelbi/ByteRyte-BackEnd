# ByteRyte Backend - Frontend Integration Guide

## 🎯 Quick Summary

Your ByteRyte **backend API** is now ready to connect to your frontend on `http://localhost:8080`.

**Backend Status**: ✅ Phase 1 MVP Complete  
**API Base URL**: `http://localhost:3000/api`  
**Frontend URL**: `http://localhost:8080` (configured in CORS)

---

## 📡 Available API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login    - Login and get JWT token
POST /api/auth/logout   - Logout (audit log only)
POST /api/auth/refresh  - Refresh JWT token
```

### Vaults
```
GET    /api/vaults       - List all user vaults
GET    /api/vaults/:id   - Get vault details
POST   /api/vaults       - Create new vault
DELETE /api/vaults/:id   - Delete vault
GET    /api/vaults/:id/items - Get all items in vault
```

### Items (Password Entries)
```
POST   /api/items          - Create new password item
GET    /api/items/:id      - Get item details
PUT    /api/items/:id      - Update item
DELETE /api/items/:id      - Delete item (soft delete)
POST   /api/items/:id/copy - Log copy event
```

### Devices
```
GET    /api/devices     - List user's devices
DELETE /api/devices/:id - Revoke device access
```

### Audit Logs
```
GET /api/audit-logs - Get user's audit history
```

---

## 🔌 Frontend Integration Examples

### 1. User Registration (From Frontend)

```javascript
// frontend/src/services/auth.js
export async function register(email, masterPassword) {
  // Step 1: Derive master key from password (CLIENT-SIDE ONLY!)
  const masterKey = await deriveMasterKey(masterPassword, email);
  
  // Step 2: Create password verifier for server
  const passwordVerifier = await hashForServer(masterPassword, email);
  
  // Step 3: Generate vault key
  const vaultKey = crypto.getRandomValues(new Uint8Array(32));
  const encryptedVaultKey = await encryptWithMasterKey(vaultKey, masterKey);
  
  // Step 4: Send to backend (NO PLAINTEXT PASSWORD!)
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      passwordVerifier, // Hashed, NOT plaintext
      encryptedVaultKey,
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store JWT token
    localStorage.setItem('token', data.data.token);
    return data.data;
  }
}
```

### 2. User Login

```javascript
export async function login(email, masterPassword, deviceFingerprint) {
  const passwordVerifier = await hashForServer(masterPassword, email);
  
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      passwordVerifier,
      deviceFingerprint, // Hash of browser + OS + IP
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    return data.data; // { token, userId, email, vaults }
  }
}
```

### 3. Create Password Item (Zero-Knowledge)

```javascript
export async function createPasswordItem(vaultId, itemData) {
  // Step 1: Encrypt item client-side
  const vaultKey = await getVaultKey(vaultId); // Decrypt from vault
  const encryptedBlob = await encryptItem(itemData, vaultKey);
  
  // Step 2: Send encrypted blob to backend
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      vaultId,
      encryptedBlob, // Server NEVER sees plaintext
      metadata: {
        category: 'social', // Non-sensitive metadata
        isFavorite: false,
        domain: 'youtube.com',
      },
    }),
  });
  
  return await response.json();
}
```

### 4. Get and Decrypt Item

```javascript
export async function getPasswordItem(itemId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3000/api/items/${itemId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  
  if (data.success) {
    const item = data.data;
    
    // Decrypt client-side
    const vaultKey = await getVaultKey(item.vaultId);
    const decryptedData = await decryptItem(item.encryptedBlob, vaultKey);
    
    return {
      ...decryptedData, // { title, username, password, notes, tags }
      id: item.id,
      createdAt: item.createdAt,
      lastViewedAt: item.lastViewedAt,
    };
  }
}
```

---

## 🛠️ Setup Instructions

### Prerequisites
1. **PostgreSQL** database running
2. **Node.js** v18+ installed
3. Frontend running on `http://localhost:8080`

### Backend Setup

```bash
# 1. Update .env with your PostgreSQL credentials
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/byteryte"

# 2. Run database migrations
npm run prisma:migrate

# 3. Start the backend server
npm run dev

# Server will start on http://localhost:3000
```

### Test the Connection

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# { "status": "healthy", "timestamp": "2025-12-03T..." }
```

---

## 🔒 Security Architecture

### Zero-Knowledge Model
```
Frontend (Browser)
├── Master Password (NEVER sent to server)
├── Master Key = Argon2id(master_password, salt)
├── Vault Key (encrypted with Master Key)
└── Items (encrypted with Vault Key)
          ↓
          ↓ ONLY ENCRYPTED DATA
          ↓
Backend (Server)
├── Password Verifier (bcrypt hash for auth)
├── Encrypted Vault Key (opaque blob)
└── Encrypted Items (opaque blobs)
```

**The server NEVER sees:**
- Master password
- Master key
- Vault keys (decrypted)
- Item data (decrypted)

---

## 📋 Frontend TODO Checklist

To fully integrate with this backend, your frontend needs:

- [ ] **Crypto Module** - Argon2id/PBKDF2 for key derivation
- [ ] **AES-256-GCM** - For encrypting vault items
- [ ] **Password Verifier** - Hash function for authentication
- [ ] **Device Fingerprinting** - Browser + OS + IP hash
- [ ] **JWT Storage** - localStorage or sessionStorage
- [ ] **Auto-lock Timer** - Clear keys after inactivity
- [ ] **Clipboard Management** - Clear copied passwords after 30s

---

## 🎨 Sample Frontend API Service

```javascript
// frontend/src/services/api.js
const API_BASE = 'http://localhost:3000/api';

class ByteRyteAPI {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    return await response.json();
  }
  
  // Auth
  register = (email, passwordVerifier, encryptedVaultKey) => 
    this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, passwordVerifier, encryptedVaultKey }),
    });
  
  login = (email, passwordVerifier, deviceFingerprint) =>
    this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, passwordVerifier, deviceFingerprint }),
    });
  
  // Vaults
  getVaults = () => this.request('/vaults');
  createVault = (name, type, encryptedVaultKey) =>
    this.request('/vaults', {
      method: 'POST',
      body: JSON.stringify({ name, type, encryptedVaultKey }),
    });
  
  // Items
  getVaultItems = (vaultId) => this.request(`/vaults/${vaultId}/items`);
  createItem = (vaultId, encryptedBlob, metadata) =>
    this.request('/items', {
      method: 'POST',
      body: JSON.stringify({ vaultId, encryptedBlob, metadata }),
    });
  updateItem = (itemId, encryptedBlob, metadata) =>
    this.request(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ encryptedBlob, metadata }),
    });
  deleteItem = (itemId) =>
    this.request(`/items/${itemId}`, { method: 'DELETE' });
  logCopyEvent = (itemId) =>
    this.request(`/items/${itemId}/copy`, { method: 'POST' });
  
  // Devices
  getDevices = () => this.request('/devices');
  revokeDevice = (deviceId) =>
    this.request(`/devices/${deviceId}`, { method: 'DELETE' });
  
  // Audit
  getAuditLogs = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs?${query}`);
  };
}

export default new ByteRyteAPI();
```

---

## 🚀 Next Steps

1. **Set up PostgreSQL database**
2. **Run migrations**: `npm run prisma:migrate`
3. **Start backend**: `npm run dev`
4. **Test from frontend**: Make a test registration call
5. **Implement crypto module** in frontend
6. **Build UI** to connect to these endpoints

---

## 📞 Need Help?

- Check backend logs in terminal
- Use `prisma studio` to view database: `npm run prisma:studio`
- Test endpoints with Postman or curl
- Review `src/routes/*.ts` for endpoint details

**Your backend is ready! Just connect your frontend crypto layer and start building! 🎉**
