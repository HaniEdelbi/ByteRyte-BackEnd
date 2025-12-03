# ByteRyte API Testing Guide

Test your backend API endpoints using curl, Postman, or your frontend.

## Prerequisites
- Backend running at `http://localhost:3000`
- PostgreSQL database initialized
- Migrations completed

---

## 🧪 Test Sequence

### 1. Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-03T...",
  "version": "1.0.0"
}
```

---

### 2. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "passwordVerifier": "hashed_password_12345",
    "encryptedVaultKey": "encrypted_vault_key_base64"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com"
  }
}
```

**Save the token** for subsequent requests!

---

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "passwordVerifier": "hashed_password_12345",
    "deviceFingerprint": "chrome_macos_192.168.1.100"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "vaults": [
      {
        "id": "vault-uuid-here",
        "name": "My Vault",
        "type": "PERSONAL",
        "itemCount": 0
      }
    ]
  }
}
```

---

### 4. List Vaults (Authenticated)

```bash
TOKEN="your_jwt_token_from_login"

curl http://localhost:3000/api/vaults \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "vault-uuid",
      "name": "My Vault",
      "type": "PERSONAL",
      "itemCount": 0,
      "isOwner": true,
      "memberCount": 0,
      "createdAt": "2025-12-03T...",
      "updatedAt": "2025-12-03T..."
    }
  ]
}
```

---

### 5. Create a New Vault

```bash
curl -X POST http://localhost:3000/api/vaults \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work Vault",
    "type": "PERSONAL",
    "encryptedVaultKey": "encrypted_key_for_work_vault"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-vault-uuid",
    "name": "Work Vault",
    "type": "PERSONAL",
    "encryptedVaultKey": "encrypted_key_for_work_vault",
    "ownerId": "user-uuid",
    "createdAt": "2025-12-03T...",
    "updatedAt": "2025-12-03T..."
  }
}
```

---

### 6. Create a Password Item

```bash
VAULT_ID="vault-uuid-from-step-4"

curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "'$VAULT_ID'",
    "encryptedBlob": "base64_encrypted_data_containing_password_info",
    "metadata": {
      "category": "social",
      "isFavorite": true,
      "domain": "youtube.com",
      "strength": "strong"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "item-uuid",
    "vaultId": "vault-uuid",
    "encryptedBlob": "base64_encrypted_data...",
    "metadata": {
      "category": "social",
      "isFavorite": true,
      "domain": "youtube.com",
      "strength": "strong"
    },
    "createdAt": "2025-12-03T...",
    "updatedAt": "2025-12-03T...",
    "lastViewedAt": null,
    "lastCopiedAt": null,
    "lastUsedAt": null,
    "isDeleted": false,
    "deletedAt": null
  }
}
```

---

### 7. Get All Items in Vault

```bash
curl http://localhost:3000/api/vaults/$VAULT_ID/items \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "item-uuid",
      "vaultId": "vault-uuid",
      "encryptedBlob": "base64_encrypted_data...",
      "metadata": { ... },
      "createdAt": "2025-12-03T...",
      ...
    }
  ]
}
```

---

### 8. Get Single Item

```bash
ITEM_ID="item-uuid-from-step-6"

curl http://localhost:3000/api/items/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "item-uuid",
    "vaultId": "vault-uuid",
    "encryptedBlob": "base64_encrypted_data...",
    "metadata": { ... },
    "lastViewedAt": "2025-12-03T...", // Updated!
    ...
  }
}
```

---

### 9. Update Item

```bash
curl -X PUT http://localhost:3000/api/items/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedBlob": "updated_encrypted_data_base64",
    "metadata": {
      "category": "social",
      "isFavorite": false,
      "domain": "youtube.com",
      "strength": "excellent"
    }
  }'
```

---

### 10. Log Copy Event

```bash
curl -X POST http://localhost:3000/api/items/$ITEM_ID/copy \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Copy event logged"
  }
}
```

---

### 11. Delete Item (Soft Delete)

```bash
curl -X DELETE http://localhost:3000/api/items/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Item deleted successfully"
  }
}
```

---

### 12. List Devices

```bash
curl http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "device-uuid",
      "fingerprint": "chrome_macos_192.168.1.100",
      "name": null,
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "lastSeen": "2025-12-03T...",
      "createdAt": "2025-12-03T..."
    }
  ]
}
```

---

### 13. Revoke Device

```bash
DEVICE_ID="device-uuid"

curl -X DELETE http://localhost:3000/api/devices/$DEVICE_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

### 14. Get Audit Logs

```bash
# All logs
curl http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer $TOKEN"

# Filtered by action type
curl "http://localhost:3000/api/audit-logs?actionType=ITEM_CREATED&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "actionType": "ITEM_CREATED",
      "targetId": "item-uuid",
      "targetType": "item",
      "metadata": { "vaultId": "vault-uuid" },
      "ipAddress": "192.168.1.100",
      "userAgent": "curl/7.68.0",
      "timestamp": "2025-12-03T..."
    },
    ...
  ]
}
```

---

### 15. Refresh JWT Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

---

### 16. Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 🎨 Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "ByteRyte API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"passwordVerifier\": \"hashed_password\",\n  \"encryptedVaultKey\": \"encrypted_key\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"passwordVerifier\": \"hashed_password\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Vaults",
      "item": [
        {
          "name": "List Vaults",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/vaults",
              "host": ["{{baseUrl}}"],
              "path": ["vaults"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## ✅ Success Indicators

After running these tests, you should see:

1. ✅ User registered successfully
2. ✅ JWT token received
3. ✅ Vaults listed
4. ✅ Items created & retrieved
5. ✅ Audit logs populated
6. ✅ Devices tracked

**If all tests pass, your backend is fully operational! 🎉**

---

## 🐛 Common Issues

### 401 Unauthorized
- Token expired or invalid
- Run login again to get fresh token

### 404 Not Found
- Check resource IDs
- Verify the resource exists

### 500 Internal Server Error
- Check server logs
- Verify database connection
- Run `npm run prisma:generate` again

---

## 🔗 Integration with Frontend

Once tests pass, connect your frontend:

```javascript
// Example: Register from frontend
async function register(email, password) {
  // 1. Derive keys client-side
  const { masterKey, passwordVerifier, vaultKey } = 
    await deriveKeys(email, password);
  
  // 2. Call backend
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      passwordVerifier, // NOT plaintext password!
      encryptedVaultKey: await encrypt(vaultKey, masterKey)
    })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.data.token);
}
```

See `FRONTEND_INTEGRATION.md` for complete examples!
