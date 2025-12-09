# Backend API Requirements for ByteRyte Frontend

## Overview
This document outlines all the API endpoints, data structures, and functionality required by the ByteRyte frontend application.

---

## 🔐 Authentication Endpoints

### 1. **POST /api/auth/register**
Register a new user account with zero-knowledge encryption.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "passwordVerifier": "hash_from_client_side_hashing",
  "encryptedVaultKey": "encrypted_master_key",
  "deviceFingerprint": "unique_device_identifier"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_auth_token",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 2. **POST /api/auth/login**
Authenticate user and create a new session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "passwordVerifier": "hash_from_client_side_hashing",
  "deviceFingerprint": "unique_device_identifier"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_auth_token",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 3. **POST /api/auth/logout**
Destroy current session.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 4. **GET /api/auth/sessions**
Get all active sessions for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "session_uuid",
      "fingerprint": "device_fingerprint",
      "name": "Chrome on Windows",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## 📱 Device Management Endpoints

### 5. **GET /api/devices**
Get all devices registered to the user's account.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "device_uuid",
      "fingerprint": "unique_device_id",
      "name": "My Laptop",
      "userAgent": "Mozilla/5.0...",
      "lastUsed": "2025-01-01T12:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 6. **DELETE /api/devices/:deviceId**
Revoke access for a specific device.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Device revoked successfully"
}
```

---

## 🔒 Vault Management Endpoints

### 7. **GET /api/vaults**
Get user's vault information.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "vault_uuid",
      "name": "Primary Vault",
      "createdAt": "2025-01-01T00:00:00Z",
      "itemCount": 12
    }
  ]
}
```

---

### 8. **POST /api/vaults**
Create a new vault (for multi-vault support).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Work Vault",
  "encryptedVaultKey": "encrypted_key"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Vault created successfully",
  "data": {
    "id": "vault_uuid",
    "name": "Work Vault",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## 🔑 Password Management Endpoints

### 9. **GET /api/passwords**
Get all passwords in a vault.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `vaultId` (required): UUID of the vault
- `category` (optional): Filter by category (login, payment, secure-note, other)
- `search` (optional): Search query

**Response (Success - 200):**
```json
{
  "success": true,
  "count": 10,
  "items": [
    {
      "id": "password_uuid",
      "vaultId": "vault_uuid",
      "encryptedBlob": "base64_encrypted_data",
      "category": "login",
      "favorite": false,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Note:** `encryptedBlob` contains the encrypted JSON:
```json
{
  "title": "Gmail",
  "username": "user@gmail.com",
  "password": "SecurePass123!",
  "website": "https://gmail.com",
  "notes": "Personal email account"
}
```

---

### 10. **POST /api/passwords**
Create a new password entry.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "vaultId": "vault_uuid",
  "encryptedBlob": "base64_encrypted_password_data",
  "category": "login",
  "favorite": false
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Password created successfully",
  "data": {
    "id": "password_uuid",
    "vaultId": "vault_uuid",
    "encryptedBlob": "base64_encrypted_data",
    "category": "login",
    "favorite": false,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 11. **PUT /api/passwords/:passwordId**
Update an existing password entry.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "encryptedBlob": "new_encrypted_data",
  "category": "login",
  "favorite": true
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "id": "password_uuid",
    "updatedAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 12. **DELETE /api/passwords/:passwordId**
Delete a password entry.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password deleted successfully"
}
```

---

## 👤 User Profile Endpoints

### 13. **GET /api/user/profile**
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00Z",
    "subscription": {
      "plan": "free",
      "status": "active",
      "nextBilling": null
    },
    "stats": {
      "totalPasswords": 12,
      "securityScore": 85,
      "lastLogin": "2025-01-01T12:00:00Z"
    }
  }
}
```

---

### 14. **PUT /api/user/profile**
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "newmail@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "name": "John Smith",
    "email": "newmail@example.com"
  }
}
```

---

### 15. **PUT /api/user/password**
Change master password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPasswordVerifier": "current_hash",
  "newPasswordVerifier": "new_hash",
  "reEncryptedVaultKey": "vault_key_encrypted_with_new_password"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 16. **DELETE /api/user/account**
Delete user account (with all data).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "passwordVerifier": "confirmation_hash",
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## ⚙️ Settings Endpoints

### 17. **GET /api/user/settings**
Get user settings/preferences.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": true,
      "security": true,
      "loginAlerts": true
    },
    "security": {
      "twoFactorEnabled": false,
      "sessionTimeout": 3600
    }
  }
}
```

---

### 18. **PUT /api/user/settings**
Update user settings.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notifications": {
    "email": false,
    "security": true,
    "loginAlerts": true
  }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 📊 Statistics & Security Endpoints

### 19. **GET /api/security/score**
Get security score and recommendations.

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "rating": "Good",
    "weakPasswords": 2,
    "reusedPasswords": 1,
    "oldPasswords": 3,
    "recommendations": [
      "Update 2 weak passwords",
      "Change 1 reused password"
    ]
  }
}
```

---

## 🔔 Error Response Format

All errors should follow this format:

**Response (Error - 4xx/5xx):**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {} // Optional additional details
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Invalid or missing authentication token
- `FORBIDDEN` - User doesn't have permission
- `NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Invalid request data
- `DUPLICATE_ENTRY` - Resource already exists
- `SERVER_ERROR` - Internal server error

---

## 🔒 Security Requirements

1. **Authentication:**
   - All protected endpoints must require valid JWT token
   - Tokens should expire after 24 hours
   - Implement refresh token mechanism (optional)

2. **Zero-Knowledge Architecture:**
   - Server should NEVER receive plaintext passwords
   - All password data stored as encrypted blobs
   - Client-side encryption/decryption only

3. **Rate Limiting:**
   - Login endpoint: 5 attempts per 15 minutes per IP
   - API endpoints: 100 requests per minute per user

4. **CORS:**
   - Allow requests from: `http://localhost:8080`, `http://192.168.10.135:8080`
   - Include proper CORS headers

5. **Device Tracking:**
   - Track device fingerprint on login
   - Auto-create session entry
   - Link passwords to specific devices

---

## 📝 Additional Notes

1. **Database Schema:**
   - Users table: id, email, name, passwordVerifier, encryptedVaultKey, createdAt
   - Vaults table: id, userId, name, createdAt
   - Passwords table: id, vaultId, encryptedBlob, category, favorite, createdAt, updatedAt
   - Sessions table: id, userId, fingerprint, name, userAgent, createdAt
   - Devices table: id, userId, fingerprint, name, userAgent, lastUsed, createdAt

2. **Timestamp Format:**
   - All timestamps in ISO 8601 format: `2025-01-01T00:00:00Z`

3. **UUID Format:**
   - Use UUID v4 for all IDs

4. **Password Categories:**
   - Enum: `login`, `payment`, `secure-note`, `other`

---

## 🚀 Priority Implementation Order

### Phase 1 (MVP - Core Functionality):
1. ✅ POST /api/auth/register
2. ✅ POST /api/auth/login
3. ✅ POST /api/auth/logout
4. ✅ GET /api/vaults
5. ✅ GET /api/passwords (basic)
6. ✅ POST /api/passwords
7. ✅ PUT /api/passwords/:id
8. ✅ DELETE /api/passwords/:id

### Phase 2 (User Management):
9. ✅ GET /api/devices
10. ✅ DELETE /api/devices/:id
11. GET /api/user/profile
12. PUT /api/user/profile
13. PUT /api/user/password

### Phase 3 (Enhanced Features):
14. GET /api/user/settings
15. PUT /api/user/settings
16. GET /api/security/score
17. GET /api/auth/sessions
18. POST /api/vaults (multi-vault)
19. DELETE /api/user/account

---

## 📬 Questions or Clarifications?

If you need any clarification on:
- Data structures
- Encryption implementation
- Specific endpoint behavior
- Additional endpoints needed

Please let me know and I'll provide detailed specifications.
