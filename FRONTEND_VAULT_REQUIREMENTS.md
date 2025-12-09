# ByteRyte Vault Management - Frontend Requirements

**Date:** December 9, 2025  
**Backend Team to Frontend Team**

---

## 🎯 Overview

The backend has completed implementation of **vault member management** and **vault key handling** in authentication responses. This document outlines what the frontend needs to implement to support vault sharing and proper zero-knowledge encryption.

---

## ✅ What's New in the Backend

### 1. **Authentication Now Returns Vault Information**

Both `/api/auth/register` and `/api/auth/login` now include vault details in their responses:

```typescript
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-09T10:00:00.000Z"
  },
  "vault": {
    "id": "vault-uuid",
    "encryptedVaultKey": "base64-encrypted-vault-key-string"
  }
}
```

**Why This Matters:**
- Frontend can immediately decrypt passwords after login
- No need for separate API call to get vault info
- Vault key is ready for decrypting password items

---

### 2. **New Vault Member Management Endpoints**

Three new endpoints for sharing vaults:

#### **Add Member to Vault**
```http
POST /api/vaults/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userEmail": "member@example.com",
  "role": "MEMBER",
  "encryptedVaultKey": "base64-vault-key-encrypted-for-member"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member added successfully",
  "data": {
    "userId": "member-user-uuid",
    "email": "member@example.com",
    "role": "MEMBER",
    "addedAt": "2025-12-09T10:30:00.000Z"
  }
}
```

**Permissions:**
- Only vault OWNER or ADMIN can add members
- Cannot add user who is already a member

---

#### **Update Member Role**
```http
PUT /api/vaults/:id/members/:memberId
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member role updated successfully",
  "data": {
    "userId": "member-user-uuid",
    "email": "member@example.com",
    "role": "ADMIN"
  }
}
```

**Permissions:**
- Only vault OWNER or ADMIN can update roles
- Roles: `ADMIN`, `MEMBER`, `READ_ONLY`

---

#### **Remove Member from Vault**
```http
DELETE /api/vaults/:id/members/:memberId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Permissions:**
- Only vault OWNER or ADMIN can remove members

---

### 3. **Updated Vault Items Endpoint**

`GET /api/vaults/:id/items` now returns properly formatted items:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "item-uuid",
      "vaultId": "vault-uuid",
      "encryptedBlob": "base64-encrypted-item-data",
      "category": "login",
      "favorite": true,
      "createdAt": "2025-12-09T10:00:00.000Z",
      "updatedAt": "2025-12-09T10:00:00.000Z"
    }
  ]
}
```

**Changes:**
- Category is lowercase with hyphens: `login`, `payment`, `secure-note`, `other`
- Includes `favorite` boolean field
- Includes `count` for total items

---

## 🔐 Zero-Knowledge Vault Sharing Flow

Here's what the frontend needs to implement for secure vault sharing:

### **Step 1: User Initiates Share**
User clicks "Share Vault" and enters member's email address.

### **Step 2: Get Member's Public Key**
Frontend needs to fetch the public key of the user being added.

**⚠️ CRITICAL:** The backend does NOT currently have a public key endpoint. You need to:

**Option A: Add public key storage**
- Add a new endpoint: `GET /api/users/by-email/:email` that returns public key
- Store user public keys during registration
- Frontend retrieves member's public key

**Option B: Exchange keys out-of-band**
- Use a secure key exchange mechanism (Signal protocol, etc.)
- Not recommended for MVP

**Recommendation:** Ask backend team to add user public key storage and retrieval endpoint.

### **Step 3: Re-encrypt Vault Key**
Frontend must:
1. Decrypt the vault key using current user's private key
2. Re-encrypt the vault key using member's public key
3. Send encrypted vault key in `addMember` request

```typescript
// Pseudocode for frontend
const currentUserPrivateKey = getUserPrivateKey(); // From secure storage
const vaultKey = decryptVaultKey(vault.encryptedVaultKey, currentUserPrivateKey);

const memberPublicKey = await fetchPublicKey(memberEmail); // NEW ENDPOINT NEEDED
const encryptedVaultKeyForMember = encryptVaultKey(vaultKey, memberPublicKey);

await addMemberToVault(vaultId, {
  userEmail: memberEmail,
  role: 'MEMBER',
  encryptedVaultKey: encryptedVaultKeyForMember
});
```

### **Step 4: Member Accesses Shared Vault**
When member logs in:
1. Backend returns their vault access (including shared vaults)
2. Member can decrypt vault key with their private key
3. Member can decrypt all items in the vault

---

## 📋 Frontend Implementation Checklist

### **Required Immediately:**

- [ ] **Update Login/Register Flow**
  - Store `vault.id` and `vault.encryptedVaultKey` after authentication
  - Decrypt vault key using user's private key
  - Use vault key to decrypt password items

- [ ] **Password Decryption on Load**
  - After login, use vault key to decrypt all password items
  - Display decrypted passwords in password list

- [ ] **Test Vault Key Flow**
  - Register new user → verify vault info in response
  - Login → verify vault info in response
  - Decrypt passwords using vault key

---

### **Required for Vault Sharing (Phase 2):**

- [ ] **Request Backend: User Public Key Endpoint**
  - Backend needs: `GET /api/users/by-email/:email` returning user's public key
  - This is CRITICAL for zero-knowledge vault sharing

- [ ] **Implement Vault Sharing UI**
  - "Share Vault" button/modal
  - Enter member email
  - Select role (ADMIN, MEMBER, READ_ONLY)

- [ ] **Implement Vault Key Re-encryption**
  - Fetch member's public key
  - Decrypt current vault key with user's private key
  - Re-encrypt vault key with member's public key
  - Send to `POST /api/vaults/:id/members`

- [ ] **Implement Member Management UI**
  - List vault members
  - Update member roles
  - Remove members

- [ ] **Handle Shared Vaults**
  - Display vaults user owns vs. vaults shared with user
  - Show member count for each vault
  - Indicate user's role in each vault

---

## 🚨 Critical Security Considerations

### **1. Vault Key Management**
```typescript
// ✅ CORRECT: Frontend decrypts vault key client-side
const vaultKey = decryptWithPrivateKey(vault.encryptedVaultKey, userPrivateKey);

// ❌ WRONG: Never send decrypted vault key to backend
await api.post('/vaults', { vaultKey: decryptedKey }); // NEVER DO THIS
```

### **2. Private Key Storage**
- User's private key should NEVER be sent to backend
- Store private key in browser's secure storage (IndexedDB with encryption)
- Private key should be derived from user's master password

### **3. Vault Sharing**
```typescript
// ✅ CORRECT: Re-encrypt for each member
const memberKey = await getPublicKey(memberEmail);
const encryptedForMember = encrypt(vaultKey, memberKey);

// ❌ WRONG: Sharing same encrypted key
const encryptedKey = vault.encryptedVaultKey; // This is encrypted for YOU, not the member
await addMember(email, encryptedKey); // Member can't decrypt this!
```

---

## 🔧 Example Frontend Code

### **After Login:**
```typescript
async function handleLogin(email: string, password: string) {
  // 1. Derive password verifier (same as registration)
  const passwordVerifier = await derivePasswordVerifier(email, password);
  
  // 2. Login
  const response = await fetch('http://192.168.10.135:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      passwordVerifier,
      deviceFingerprint: 'web-device'
    })
  });
  
  const data = await response.json();
  
  // 3. Store token
  localStorage.setItem('authToken', data.token);
  
  // 4. Store and decrypt vault key
  const userPrivateKey = await derivePrivateKey(email, password);
  const vaultKey = await decryptVaultKey(
    data.vault.encryptedVaultKey,
    userPrivateKey
  );
  
  // 5. Store vault key securely (encrypted in IndexedDB)
  await storeVaultKey(data.vault.id, vaultKey);
  
  // 6. Fetch and decrypt passwords
  const passwords = await fetchPasswords(data.vault.id);
  const decryptedPasswords = passwords.map(p => 
    decryptPassword(p.encryptedBlob, vaultKey)
  );
  
  return { user: data.user, passwords: decryptedPasswords };
}
```

### **Share Vault:**
```typescript
async function shareVault(vaultId: string, memberEmail: string, role: string) {
  // 1. Get current vault key
  const vaultKey = await getStoredVaultKey(vaultId);
  
  // 2. Get member's public key (BACKEND NEEDS TO IMPLEMENT THIS)
  const memberPublicKey = await fetch(
    `http://192.168.10.135:3000/api/users/by-email/${memberEmail}`
  ).then(r => r.json()).then(d => d.publicKey);
  
  // 3. Re-encrypt vault key for member
  const encryptedVaultKeyForMember = await encryptWithPublicKey(
    vaultKey,
    memberPublicKey
  );
  
  // 4. Add member
  const response = await fetch(
    `http://192.168.10.135:3000/api/vaults/${vaultId}/members`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        userEmail: memberEmail,
        role,
        encryptedVaultKey: encryptedVaultKeyForMember
      })
    }
  );
  
  return response.json();
}
```

---

## 📞 Backend Support Needed

The frontend team needs the backend to implement:

### **1. User Public Key Endpoint** (CRITICAL for vault sharing)
```http
GET /api/users/by-email/:email
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "publicKey": "base64-encoded-public-key"
  }
}
```

**Requires:**
- Adding `publicKey` field to User model in database
- Storing public key during registration
- Endpoint to fetch public key by email

---

### **2. User Public Key Storage During Registration**

Update registration to accept and store public key:

```typescript
// Frontend sends during registration:
{
  "email": "user@example.com",
  "name": "John Doe",
  "passwordVerifier": "derived-key",
  "encryptedVaultKey": "encrypted-vault-key",
  "publicKey": "user-public-key-for-sharing"  // NEW FIELD
}
```

---

## 🧪 Testing the New Features

### **Test 1: Vault Info in Auth Response**
```bash
# Register
curl -X POST http://192.168.10.135:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "passwordVerifier": "test-verifier",
    "encryptedVaultKey": "encrypted-key-data"
  }'

# Verify response includes vault.id and vault.encryptedVaultKey
```

### **Test 2: Add Member to Vault**
```bash
# First, create two users
# Then, add second user to first user's vault

curl -X POST http://192.168.10.135:3000/api/vaults/{vaultId}/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "userEmail": "member@example.com",
    "role": "MEMBER",
    "encryptedVaultKey": "vault-key-encrypted-for-member"
  }'
```

### **Test 3: Get Vault Items with Category/Favorite**
```bash
curl -X GET http://192.168.10.135:3000/api/vaults/{vaultId}/items \
  -H "Authorization: Bearer {token}"

# Verify response includes category and favorite fields
```

---

## 📊 API Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/register` | POST | Register + get vault info | No |
| `/api/auth/login` | POST | Login + get vault info | No |
| `/api/vaults` | GET | List all user vaults | Yes |
| `/api/vaults/:id` | GET | Get vault details | Yes |
| `/api/vaults/:id` | PUT | Update vault name | Yes (Owner only) |
| `/api/vaults/:id/items` | GET | Get vault items | Yes |
| `/api/vaults/:id/members` | POST | Add member to vault | Yes (Owner/Admin) |
| `/api/vaults/:id/members/:memberId` | PUT | Update member role | Yes (Owner/Admin) |
| `/api/vaults/:id/members/:memberId` | DELETE | Remove member | Yes (Owner/Admin) |

---

## 🎯 Next Steps

### **For Frontend Team:**

1. **Immediate (This Week):**
   - Update login/register to use vault info from response
   - Implement password decryption using vault key
   - Test end-to-end password flow

2. **Phase 2 (Next Sprint):**
   - Coordinate with backend for public key endpoint
   - Implement vault sharing UI
   - Implement member management UI
   - Test vault sharing flow

### **For Backend Team:**

1. **Immediate:**
   - Add `publicKey` field to User model
   - Implement `GET /api/users/by-email/:email` endpoint
   - Update registration to accept and store public key

---

## 📝 Questions?

Contact the backend team if you need:
- Clarification on any endpoint
- Additional response fields
- Help with encryption/decryption flow
- Test accounts or data

**Backend API Base URL:** `http://192.168.10.135:3000`

---

**Status:** ✅ Backend vault member management complete  
**Waiting on:** Frontend implementation + public key endpoint request
