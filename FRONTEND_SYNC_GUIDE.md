# 🔄 Frontend-Backend Synchronization Guide

**Date:** December 9, 2024  
**Backend Version:** 1.0.0  
**API Base URL:** `http://192.168.10.135:3000`

---

## 🚨 **CRITICAL BREAKING CHANGES**

### ⚠️ **1. Authentication Field Names Changed**

**BEFORE (Old):**
```typescript
// ❌ This will NO LONGER WORK
{
  "email": "user@example.com",
  "password": "client_derived_hash"
}
```

**NOW (Current):**
```typescript
// ✅ Use this format
{
  "email": "user@example.com",
  "passwordVerifier": "client_derived_hash"  // Renamed from "password"
}
```

### ⚠️ **2. Registration Now Requires Name Field**

**BEFORE:**
```typescript
// ❌ Old registration
{
  "email": "user@example.com",
  "password": "hash",
  "encryptedVaultKey": "key"  // Was optional
}
```

**NOW:**
```typescript
// ✅ New registration
{
  "email": "user@example.com",
  "name": "John Doe",              // REQUIRED - New field
  "passwordVerifier": "hash",      // Renamed
  "encryptedVaultKey": "key",      // Now REQUIRED
  "deviceFingerprint": "device_id" // Optional
}
```

### ⚠️ **3. Password Items Now Support Categories & Favorites**

**BEFORE:**
```typescript
// ❌ Old password creation
{
  "vaultId": "vault_id",
  "encryptedBlob": "encrypted_data"
}
```

**NOW:**
```typescript
// ✅ New password creation
{
  "vaultId": "vault_id",
  "encryptedBlob": "encrypted_data",
  "category": "login",    // NEW: "login", "payment", "secure-note", "other"
  "favorite": false       // NEW: Boolean
}
```

---

## 📋 **Complete API Endpoint Reference**

### **1. POST /api/auth/register**

**Purpose:** Create a new user account

**Request:**
```typescript
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",          // Required: Valid email
  "name": "John Doe",                   // Required: User's display name
  "passwordVerifier": "hashed_password", // Required: Client-side derived hash
  "encryptedVaultKey": "encrypted_key",  // Required: Master key encrypted with password
  "deviceFingerprint": "browser_id"      // Optional: Unique device identifier
}
```

**Response (201 Created):**
```typescript
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6755a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-09T10:30:00.000Z"
  }
}
```

**Response (409 Conflict - Email exists):**
```typescript
{
  "error": "UserExistsError",
  "message": "User with this email already exists"
}
```

**Frontend Implementation:**
```typescript
async function register(email: string, name: string, password: string) {
  // 1. Derive password verifier (client-side hashing)
  const passwordVerifier = await derivePasswordVerifier(password, email);
  
  // 2. Generate master key
  const masterKey = await generateMasterKey();
  
  // 3. Encrypt master key with password
  const encryptedVaultKey = await encryptWithPassword(masterKey, password);
  
  // 4. Get device fingerprint
  const deviceFingerprint = getDeviceFingerprint();
  
  // 5. Register
  const response = await fetch('http://192.168.10.135:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name,
      passwordVerifier,
      encryptedVaultKey,
      deviceFingerprint
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('userName', data.user.name);
    return data;
  }
  
  throw new Error(data.message);
}
```

---

### **2. POST /api/auth/login**

**Purpose:** Authenticate existing user

**Request:**
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "passwordVerifier": "hashed_password",
  "deviceFingerprint": "browser_id"  // Optional
}
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6755a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-09T10:30:00.000Z"
  }
}
```

**Response (401 Unauthorized):**
```typescript
{
  "error": "UnauthorizedError",
  "message": "Invalid email or password"
}
```

**Frontend Implementation:**
```typescript
async function login(email: string, password: string) {
  const passwordVerifier = await derivePasswordVerifier(password, email);
  const deviceFingerprint = getDeviceFingerprint();
  
  const response = await fetch('http://192.168.10.135:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passwordVerifier, deviceFingerprint })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('userName', data.user.name);
    return data;
  }
  
  throw new Error(data.message);
}
```

---

### **3. POST /api/auth/logout**

**Purpose:** End current session

**Request:**
```typescript
POST /api/auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{}  // Empty body is acceptable
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Frontend Implementation:**
```typescript
async function logout() {
  const token = localStorage.getItem('authToken');
  
  await fetch('http://192.168.10.135:3000/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  
  // Clear local storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
}
```

---

### **4. GET /api/vaults**

**Purpose:** Get all vaults for authenticated user

**Request:**
```typescript
GET /api/vaults
Authorization: Bearer <token>
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "6755a1b2c3d4e5f6a7b8c9d1",
      "name": "My Vault",
      "type": "PERSONAL",
      "itemCount": 12,           // Number of passwords in vault
      "isOwner": true,
      "memberCount": 1,
      "createdAt": "2025-12-09T10:30:00.000Z",
      "updatedAt": "2025-12-09T10:30:00.000Z"
    }
  ]
}
```

**Frontend Implementation:**
```typescript
async function getVaults() {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://192.168.10.135:3000/api/vaults', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data; // Array of vaults
  }
  
  throw new Error(data.message);
}
```

---

### **5. GET /api/passwords**

**Purpose:** Get all passwords across all user's vaults

**Request:**
```typescript
GET /api/passwords
Authorization: Bearer <token>

// Optional query parameters (future enhancement):
// ?vaultId=xxx&category=login&search=gmail
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "count": 10,
  "items": [
    {
      "id": "6755a1b2c3d4e5f6a7b8c9d2",
      "vaultId": "6755a1b2c3d4e5f6a7b8c9d1",
      "encryptedBlob": "base64_encrypted_json_data",
      "category": "login",        // "login", "payment", "secure-note", "other"
      "favorite": true,
      "createdAt": "2025-12-09T10:30:00.000Z",
      "updatedAt": "2025-12-09T10:30:00.000Z"
    },
    {
      "id": "6755a1b2c3d4e5f6a7b8c9d3",
      "vaultId": "6755a1b2c3d4e5f6a7b8c9d1",
      "encryptedBlob": "base64_encrypted_json_data",
      "category": "payment",
      "favorite": false,
      "createdAt": "2025-12-09T11:00:00.000Z",
      "updatedAt": "2025-12-09T11:00:00.000Z"
    }
  ]
}
```

**What's in encryptedBlob:**
```typescript
// Client-side ONLY - Server never sees this
const decryptedData = {
  "title": "Gmail Account",
  "username": "user@gmail.com",
  "password": "SuperSecret123!",
  "website": "https://gmail.com",
  "notes": "My personal email"
};

// Server receives this encrypted version
const encryptedBlob = await encrypt(JSON.stringify(decryptedData), masterKey);
```

**Frontend Implementation:**
```typescript
async function getPasswords() {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://192.168.10.135:3000/api/passwords', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Decrypt passwords client-side
    const masterKey = await getMasterKey(); // From user's session
    
    const decryptedPasswords = await Promise.all(
      data.items.map(async (item) => ({
        ...item,
        decryptedData: JSON.parse(await decrypt(item.encryptedBlob, masterKey))
      }))
    );
    
    return decryptedPasswords;
  }
  
  throw new Error(data.message);
}
```

---

### **6. POST /api/passwords**

**Purpose:** Create a new password entry

**Request:**
```typescript
POST /api/passwords
Authorization: Bearer <token>
Content-Type: application/json

{
  "vaultId": "6755a1b2c3d4e5f6a7b8c9d1",
  "encryptedBlob": "base64_encrypted_data",
  "category": "login",      // Required: "login", "payment", "secure-note", "other"
  "favorite": false         // Optional: defaults to false
}
```

**Response (201 Created):**
```typescript
{
  "success": true,
  "message": "Password created successfully",
  "data": {
    "id": "6755a1b2c3d4e5f6a7b8c9d2",
    "vaultId": "6755a1b2c3d4e5f6a7b8c9d1",
    "encryptedBlob": "base64_encrypted_data",
    "category": "login",
    "favorite": false,
    "createdAt": "2025-12-09T10:30:00.000Z",
    "updatedAt": "2025-12-09T10:30:00.000Z"
  }
}
```

**Frontend Implementation:**
```typescript
async function createPassword(
  vaultId: string,
  passwordData: {
    title: string;
    username: string;
    password: string;
    website?: string;
    notes?: string;
  },
  category: 'login' | 'payment' | 'secure-note' | 'other',
  favorite: boolean = false
) {
  const token = localStorage.getItem('authToken');
  const masterKey = await getMasterKey();
  
  // Encrypt the password data
  const encryptedBlob = await encrypt(JSON.stringify(passwordData), masterKey);
  
  const response = await fetch('http://192.168.10.135:3000/api/passwords', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      vaultId,
      encryptedBlob,
      category,
      favorite
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.message);
}
```

---

### **7. PUT /api/passwords/:id**

**Purpose:** Update an existing password entry

**Request:**
```typescript
PUT /api/passwords/6755a1b2c3d4e5f6a7b8c9d2
Authorization: Bearer <token>
Content-Type: application/json

{
  "encryptedBlob": "new_encrypted_data",  // Optional
  "category": "payment",                   // Optional
  "favorite": true                         // Optional
}
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "id": "6755a1b2c3d4e5f6a7b8c9d2",
    "updatedAt": "2025-12-09T12:00:00.000Z"
  }
}
```

**Frontend Implementation:**
```typescript
async function updatePassword(
  passwordId: string,
  updates: {
    passwordData?: any;
    category?: 'login' | 'payment' | 'secure-note' | 'other';
    favorite?: boolean;
  }
) {
  const token = localStorage.getItem('authToken');
  const body: any = {};
  
  if (updates.passwordData) {
    const masterKey = await getMasterKey();
    body.encryptedBlob = await encrypt(JSON.stringify(updates.passwordData), masterKey);
  }
  
  if (updates.category) body.category = updates.category;
  if (updates.favorite !== undefined) body.favorite = updates.favorite;
  
  const response = await fetch(`http://192.168.10.135:3000/api/passwords/${passwordId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.message);
}
```

---

### **8. DELETE /api/passwords/:id**

**Purpose:** Delete a password entry

**Request:**
```typescript
DELETE /api/passwords/6755a1b2c3d4e5f6a7b8c9d2
Authorization: Bearer <token>
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "message": "Password deleted successfully"
}
```

**Frontend Implementation:**
```typescript
async function deletePassword(passwordId: string) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`http://192.168.10.135:3000/api/passwords/${passwordId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.success) {
    return true;
  }
  
  throw new Error(data.message);
}
```

---

### **9. GET /api/devices**

**Purpose:** Get all registered devices/sessions

**Request:**
```typescript
GET /api/devices
Authorization: Bearer <token>
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "6755a1b2c3d4e5f6a7b8c9d4",
      "name": "My Laptop",
      "fingerprint": "chrome-windows-abc123",
      "browser": "Chrome",
      "os": "Windows",
      "ipAddress": "192.168.10.135",
      "lastSeen": "2025-12-09T12:00:00.000Z",
      "createdAt": "2025-12-09T10:30:00.000Z",
      "isCurrentDevice": false
    }
  ]
}
```

**Frontend Implementation:**
```typescript
async function getDevices() {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://192.168.10.135:3000/api/devices', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.message);
}
```

---

### **10. DELETE /api/devices/:id**

**Purpose:** Revoke device access (logout from specific device)

**Request:**
```typescript
DELETE /api/devices/6755a1b2c3d4e5f6a7b8c9d4
Authorization: Bearer <token>
```

**Response (200 OK):**
```typescript
{
  "success": true,
  "message": "Device session revoked successfully",
  "data": {
    "deviceId": "6755a1b2c3d4e5f6a7b8c9d4",
    "deviceName": "My Laptop"
  }
}
```

---

## 🔒 **Authentication & Security**

### **JWT Token Handling**

All protected endpoints require JWT token in Authorization header:

```typescript
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

**Token Lifecycle:**
- Expires in: 7 days (default)
- Store in: `localStorage.getItem('authToken')`
- Include in: All requests except login/register

### **Error Handling**

**401 Unauthorized (Invalid/Expired Token):**
```typescript
{
  "error": "UnauthorizedError",
  "message": "Authentication required",
  "statusCode": 401,
  "code": "UNAUTHORIZED"
}
```

**Action:** Redirect to login page, clear stored token

---

## 📊 **Data Type Definitions (TypeScript)**

```typescript
// User
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO 8601
}

// Auth Response
interface AuthResponse {
  success: true;
  message: string;
  token: string;
  user: User;
}

// Vault
interface Vault {
  id: string;
  name: string;
  type: 'PERSONAL' | 'GROUP' | 'STEALTH' | 'ORGANIZATION';
  itemCount: number;
  isOwner: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// Password Item
interface PasswordItem {
  id: string;
  vaultId: string;
  encryptedBlob: string; // Base64 encrypted JSON
  category: 'login' | 'payment' | 'secure-note' | 'other';
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Decrypted Password Data (Client-side only)
interface DecryptedPasswordData {
  title: string;
  username?: string;
  password?: string;
  website?: string;
  notes?: string;
  // Add custom fields as needed
}

// Device
interface Device {
  id: string;
  name: string;
  fingerprint: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastSeen: string;
  createdAt: string;
  isCurrentDevice: boolean;
}

// API Response
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  items?: T[];
}

// API Error
interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
  code?: string;
  details?: any;
}
```

---

## ✅ **Frontend Checklist**

### **Phase 1: Authentication (REQUIRED)**

- [ ] Update registration form to include `name` field
- [ ] Change `password` to `passwordVerifier` in all auth calls
- [ ] Update login to use `passwordVerifier`
- [ ] Store `user.name` from auth responses
- [ ] Display user name in UI (navbar, profile, etc.)

### **Phase 2: Password Management (REQUIRED)**

- [ ] Add `category` dropdown to password creation form
  - [ ] Options: "Login", "Payment", "Secure Note", "Other"
- [ ] Add `favorite` toggle/checkbox to password form
- [ ] Update password creation to send `category` and `favorite`
- [ ] Display category badges/icons in password list
- [ ] Show favorite star/heart icon for favorited passwords
- [ ] Add filter by category functionality
- [ ] Add filter by favorites functionality

### **Phase 3: Response Handling (REQUIRED)**

- [ ] Update all API calls to handle `success` field
- [ ] Check `data.success` before accessing data
- [ ] Handle error responses with `error` and `message` fields
- [ ] Display `message` from successful operations (toast/notification)

### **Phase 4: Device Management (OPTIONAL)**

- [ ] Implement device list page
- [ ] Show device browser/OS with icons
- [ ] Add "Revoke Access" button for each device
- [ ] Mark current device in the list

---

## 🧪 **Testing Your Frontend Integration**

### **Quick Test Script**

```typescript
// test-integration.ts

async function testFullFlow() {
  try {
    // 1. Register
    console.log('1. Testing Registration...');
    const registerData = await register(
      'test@example.com',
      'Test User',
      'SecurePassword123!'
    );
    console.log('✅ Registration successful:', registerData);
    
    // 2. Get Vaults
    console.log('\n2. Testing Get Vaults...');
    const vaults = await getVaults();
    console.log('✅ Vaults retrieved:', vaults);
    const vaultId = vaults[0].id;
    
    // 3. Create Password
    console.log('\n3. Testing Create Password...');
    const password = await createPassword(
      vaultId,
      {
        title: 'Gmail',
        username: 'test@gmail.com',
        password: 'gmail_pass_123',
        website: 'https://gmail.com'
      },
      'login',
      true // favorite
    );
    console.log('✅ Password created:', password);
    
    // 4. List Passwords
    console.log('\n4. Testing List Passwords...');
    const passwords = await getPasswords();
    console.log('✅ Passwords listed:', passwords);
    
    // 5. Update Password
    console.log('\n5. Testing Update Password...');
    await updatePassword(password.id, {
      category: 'payment',
      favorite: false
    });
    console.log('✅ Password updated');
    
    // 6. Delete Password
    console.log('\n6. Testing Delete Password...');
    await deletePassword(password.id);
    console.log('✅ Password deleted');
    
    // 7. Logout
    console.log('\n7. Testing Logout...');
    await logout();
    console.log('✅ Logout successful');
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
```

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: 401 Unauthorized on all requests**

**Cause:** Token not being sent or expired

**Solution:**
```typescript
// Check if token exists
const token = localStorage.getItem('authToken');
if (!token) {
  // Redirect to login
  window.location.href = '/login';
}

// Verify token is in Authorization header
headers: {
  'Authorization': `Bearer ${token}` // Note the "Bearer " prefix
}
```

---

### **Issue 2: Registration returns "User already exists"**

**Cause:** Email is already registered

**Solution:**
```typescript
try {
  await register(email, name, password);
} catch (error) {
  if (error.message.includes('already exists')) {
    // Show user-friendly message
    alert('This email is already registered. Please login instead.');
    // Redirect to login page
  }
}
```

---

### **Issue 3: Passwords not decrypting**

**Cause:** Wrong master key or encryption method mismatch

**Solution:**
```typescript
// Ensure you're using the same encryption method on both ends
// Backend expects: Base64-encoded encrypted data
// Frontend should: 
//   1. Encrypt data with master key
//   2. Convert to base64
//   3. Send to backend

const encrypted = await encrypt(data, masterKey);
const base64 = btoa(encrypted); // For binary data
// OR
const base64 = encrypted; // If encrypt() already returns base64
```

---

### **Issue 4: CORS errors**

**Cause:** Frontend origin not allowed

**Current Setup:** Development mode allows all origins

**If still getting errors:**
```typescript
// Make sure your frontend is making requests to the correct URL
const API_URL = 'http://192.168.10.135:3000'; // Not localhost

// For production, contact backend team to add your domain
```

---

## 📞 **Support & Contact**

### **Backend is Ready! ✅**

- Server: `http://192.168.10.135:3000`
- Health Check: `http://192.168.10.135:3000/health`
- Status: Running & Tested

### **Documentation Files**

1. `BACKEND_REQUIREMENTS.md` - Original specifications
2. `API_IMPLEMENTATION_STATUS.md` - Implementation details
3. `FRONTEND_SYNC_GUIDE.md` - This file (Frontend integration guide)
4. `test-api-comprehensive.ps1` - Backend test script

### **Questions?**

If you encounter any issues:
1. Check this guide first
2. Verify your request format matches examples
3. Check browser console for error details
4. Test with curl/Postman to isolate frontend issues

---

## 🚀 **Ready to Integrate!**

All Phase 1 MVP endpoints are fully implemented and tested. The backend is ready for your frontend to connect.

**Key Points to Remember:**
1. ✅ Use `passwordVerifier` not `password`
2. ✅ Include `name` field in registration
3. ✅ Send `category` and `favorite` with passwords
4. ✅ Always check `success` field in responses
5. ✅ Include JWT token in Authorization header

**Happy Coding! 🎉**

