# ByteRyte Backend API Endpoints

**Base URL (Development):** `http://192.168.10.135:3000`  
**Base URL (Production):** `https://your-app.vercel.app`

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "passwordVerifier": "hashed-password-verifier",
  "encryptedVaultKey": "encrypted-vault-key-base64",
  "deviceFingerprint": "browser-123" // optional
}

Response: 201
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-09T10:00:00.000Z"
  },
  "vault": {
    "id": "vault-id",
    "encryptedVaultKey": "encrypted-vault-key-base64"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "passwordVerifier": "hashed-password-verifier",
  "deviceFingerprint": "browser-123", // optional
  "deviceName": "Chrome on Windows" // optional
}

Response: 200
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-09T10:00:00.000Z"
  },
  "vault": {
    "id": "vault-id",
    "encryptedVaultKey": "encrypted-vault-key-base64"
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}

Response: 200
{
  "success": true,
  "token": "new-jwt-token"
}
```

---

## 🔑 Vault Endpoints

### Get All Vaults
```http
GET /api/vaults
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "vault-id",
      "name": "My Vault",
      "type": "PERSONAL",
      "itemCount": 5,
      "isOwner": true,
      "memberCount": 1,
      "createdAt": "2025-12-09T10:00:00.000Z",
      "updatedAt": "2025-12-09T10:00:00.000Z"
    }
  ]
}
```

### Get Vault Details
```http
GET /api/vaults/:id
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "id": "vault-id",
    "name": "My Vault",
    "type": "PERSONAL",
    "encryptedVaultKey": "encrypted-key-for-this-user",
    "isOwner": true,
    "owner": {
      "id": "user-id",
      "email": "owner@example.com"
    },
    "members": [
      {
        "id": "member-id",
        "userId": "user-id",
        "role": "OWNER",
        "user": {
          "id": "user-id",
          "email": "owner@example.com"
        }
      }
    ],
    "createdAt": "2025-12-09T10:00:00.000Z",
    "updatedAt": "2025-12-09T10:00:00.000Z"
  }
}
```

### Create Vault
```http
POST /api/vaults
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Work Vault",
  "type": "GROUP",
  "encryptedVaultKey": "encrypted-vault-key-base64"
}

Response: 201
{
  "success": true,
  "message": "Vault created successfully",
  "data": {
    "id": "new-vault-id",
    "name": "Work Vault",
    "type": "GROUP",
    "ownerId": "user-id",
    "createdAt": "2025-12-09T10:00:00.000Z"
  }
}
```

### Update Vault
```http
PUT /api/vaults/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Vault Name"
}

Response: 200
{
  "success": true,
  "message": "Vault updated successfully",
  "data": {
    "id": "vault-id",
    "name": "Updated Vault Name",
    "updatedAt": "2025-12-09T10:30:00.000Z"
  }
}
```

### Delete Vault
```http
DELETE /api/vaults/:id
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Vault deleted successfully"
}
```

### Get Vault Items
```http
GET /api/vaults/:id/items
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "item-id",
      "vaultId": "vault-id",
      "encryptedBlob": "encrypted-item-data",
      "category": "login",
      "favorite": true,
      "createdAt": "2025-12-09T10:00:00.000Z",
      "updatedAt": "2025-12-09T10:00:00.000Z"
    }
  ]
}
```

---

## 👥 Vault Member Management

### Add Member to Vault
```http
POST /api/vaults/:id/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "userEmail": "member@example.com",
  "role": "MEMBER",
  "encryptedVaultKey": "vault-key-encrypted-for-member"
}

Response: 201
{
  "success": true,
  "message": "Member added successfully",
  "data": {
    "userId": "member-user-id",
    "email": "member@example.com",
    "role": "MEMBER",
    "addedAt": "2025-12-09T10:30:00.000Z"
  }
}
```

### Update Member Role
```http
PUT /api/vaults/:id/members/:memberId
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "ADMIN"
}

Response: 200
{
  "success": true,
  "message": "Member role updated successfully",
  "data": {
    "userId": "member-user-id",
    "email": "member@example.com",
    "role": "ADMIN"
  }
}
```

### Remove Member from Vault
```http
DELETE /api/vaults/:id/members/:memberId
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## 🔐 Password/Item Endpoints

### Get All Passwords
```http
GET /api/passwords
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "item-id",
      "vaultId": "vault-id",
      "encryptedBlob": "encrypted-password-data",
      "category": "login",
      "favorite": true,
      "createdAt": "2025-12-09T10:00:00.000Z",
      "updatedAt": "2025-12-09T10:00:00.000Z"
    }
  ]
}
```

### Get Single Password
```http
GET /api/passwords/:id
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {
    "id": "item-id",
    "vaultId": "vault-id",
    "encryptedBlob": "encrypted-password-data",
    "category": "login",
    "favorite": true,
    "createdAt": "2025-12-09T10:00:00.000Z",
    "updatedAt": "2025-12-09T10:00:00.000Z",
    "lastViewedAt": "2025-12-09T11:00:00.000Z"
  }
}
```

### Create Password
```http
POST /api/passwords
Authorization: Bearer {token}
Content-Type: application/json

{
  "vaultId": "vault-id",
  "encryptedBlob": "encrypted-password-data",
  "category": "login", // login, payment, secure-note, other
  "favorite": false
}

Response: 201
{
  "success": true,
  "data": {
    "id": "new-item-id",
    "vaultId": "vault-id",
    "encryptedBlob": "encrypted-password-data",
    "category": "login",
    "favorite": false,
    "createdAt": "2025-12-09T10:00:00.000Z"
  }
}
```

### Update Password
```http
PUT /api/passwords/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "encryptedBlob": "updated-encrypted-data",
  "category": "payment",
  "favorite": true
}

Response: 200
{
  "success": true,
  "data": {
    "id": "item-id",
    "encryptedBlob": "updated-encrypted-data",
    "category": "payment",
    "favorite": true,
    "updatedAt": "2025-12-09T10:30:00.000Z"
  }
}
```

### Delete Password
```http
DELETE /api/passwords/:id
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Password deleted successfully"
}
```

### Copy Password (Track Usage)
```http
POST /api/passwords/:id/copy
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Copy event logged"
}
```

---

## 📱 Device Management

### Get All Devices
```http
GET /api/devices
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "device-id",
      "name": "Chrome on Windows",
      "fingerprint": "browser-123",
      "browser": "Chrome",
      "os": "Windows",
      "ipAddress": "192.168.1.100",
      "lastSeen": "2025-12-09T10:00:00.000Z",
      "createdAt": "2025-12-09T09:00:00.000Z",
      "isCurrentDevice": false,
      "isRevoked": false
    }
  ]
}
```

### Revoke Device
```http
POST /api/devices/:id/revoke
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Device revoked successfully"
}
```

---

## 📊 Audit Logs

### Get Audit Logs
```http
GET /api/audit
Authorization: Bearer {token}
Query Parameters:
  - limit: number (default: 50)
  - offset: number (default: 0)
  - actionType: string (optional)

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "log-id",
      "userId": "user-id",
      "actionType": "ITEM_CREATED",
      "targetId": "item-id",
      "targetType": "item",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-12-09T10:00:00.000Z",
      "metadata": {}
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100
  }
}
```

---

## 📋 Item Endpoints (Generic)

### Get All Items
```http
GET /api/items
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "count": 15,
  "data": [...]
}
```

### Get Single Item
```http
GET /api/items/:id
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "data": {...}
}
```

### Create Item
```http
POST /api/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "vaultId": "vault-id",
  "encryptedBlob": "encrypted-item-data",
  "category": "OTHER",
  "favorite": false
}
```

### Update Item
```http
PUT /api/items/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "encryptedBlob": "updated-encrypted-data",
  "category": "LOGIN",
  "favorite": true
}
```

### Delete Item
```http
DELETE /api/items/:id
Authorization: Bearer {token}
```

### Restore Deleted Item
```http
POST /api/items/:id/restore
Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "message": "Item restored successfully"
}
```

---

## 📝 Summary

### Total Endpoints: 33

**Authentication:** 4 endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh

**Vaults:** 6 endpoints
- GET /api/vaults
- GET /api/vaults/:id
- POST /api/vaults
- PUT /api/vaults/:id
- DELETE /api/vaults/:id
- GET /api/vaults/:id/items

**Vault Members:** 3 endpoints
- POST /api/vaults/:id/members
- PUT /api/vaults/:id/members/:memberId
- DELETE /api/vaults/:id/members/:memberId

**Passwords:** 7 endpoints
- GET /api/passwords
- GET /api/passwords/:id
- POST /api/passwords
- PUT /api/passwords/:id
- DELETE /api/passwords/:id
- POST /api/passwords/:id/copy
- GET /api/passwords/search (if implemented)

**Items:** 6 endpoints
- GET /api/items
- GET /api/items/:id
- POST /api/items
- PUT /api/items/:id
- DELETE /api/items/:id
- POST /api/items/:id/restore

**Devices:** 2 endpoints
- GET /api/devices
- POST /api/devices/:id/revoke

**Audit:** 1 endpoint
- GET /api/audit

---

## 🔑 Authentication

Most endpoints require JWT authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get token from `/api/auth/login` or `/api/auth/register`.

---

## 📊 Categories

Items/Passwords can have these categories:
- `login` - Login credentials
- `payment` - Payment cards
- `secure-note` - Secure notes
- `other` - Other items

---

## 🎭 Vault Roles

When adding members to vaults:
- `OWNER` - Full control (auto-assigned to creator)
- `ADMIN` - Can manage members and items
- `MEMBER` - Can create/edit/delete items
- `READ_ONLY` - Can only view items

---

## 🎯 Vault Types

- `PERSONAL` - Personal vault (default)
- `GROUP` - Shared with multiple users
- `STEALTH` - Hidden vault
- `ORGANIZATION` - Organization-wide vault

---

**API Version:** 1.0.0  
**Last Updated:** December 9, 2025  
**Documentation:** See FRONTEND_SYNC_GUIDE.md for detailed examples
