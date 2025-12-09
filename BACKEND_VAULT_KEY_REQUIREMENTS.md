# Backend Requirements for Vault Key Encryption

## Overview
The frontend now properly encrypts vault keys using AES-GCM-256 encryption. The backend needs to accept and store this encrypted vault key.

## What Changed in Frontend

### OLD Implementation (WRONG ❌)
```typescript
// Just a simple hash - NOT encrypted
encryptedVaultKey = SHA-256(password + 'vault-key-salt')
// Example: "a3f8e9d2c1b0..."
```

### NEW Implementation (CORRECT ✅)
```typescript
// Proper encryption with AES-GCM-256
1. Generate random 256-bit vault key
2. Derive encryption key from password using PBKDF2
3. Encrypt vault key with AES-GCM
4. Combine IV (12 bytes) + ciphertext
5. Encode as base64

// Example: "kMx9vR3pL8qW4nZ... (much longer, ~100+ chars)"
```

## Backend Changes Required

### 1. Database Schema - NO CHANGES NEEDED ✅

The `encryptedVaultKey` field should already support this. Just ensure:

```sql
-- Vault table
CREATE TABLE vaults (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  encrypted_vault_key TEXT NOT NULL,  -- Should be TEXT, not limited length
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Important**: The field must support strings of ~100-150 characters (base64 encoded).

### 2. Registration Endpoint - NO CHANGES NEEDED ✅

```typescript
// POST /api/auth/register
{
  "email": "user@example.com",
  "name": "User Name",
  "passwordVerifier": "abc123...",     // SHA-256 hash
  "encryptedVaultKey": "kMx9vR3...",  // Now properly encrypted (longer string)
  "deviceFingerprint": "xyz789..."
}
```

**Backend should**:
- ✅ Accept `encryptedVaultKey` as string
- ✅ Store it in database as-is (no processing)
- ✅ Return it on login

### 3. Login Response - NO CHANGES NEEDED ✅

```typescript
// POST /api/auth/login response
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "vault": {
    "id": "vault-id",
    "encryptedVaultKey": "kMx9vR3..."  // Return exactly as stored
  }
}
```

**Backend should**:
- ✅ Return `vault` object with login response
- ✅ Include `encryptedVaultKey` exactly as stored in database
- ✅ Include `vault.id`

## Validation

### What Backend Should Check

```typescript
// Registration validation
if (!encryptedVaultKey) {
  return 400, "encryptedVaultKey is required"
}

if (typeof encryptedVaultKey !== 'string') {
  return 400, "encryptedVaultKey must be a string"
}

if (encryptedVaultKey.length < 50 || encryptedVaultKey.length > 500) {
  return 400, "encryptedVaultKey has invalid length"
}

// Store in database
vault.encryptedVaultKey = encryptedVaultKey  // As-is, no processing
```

### What Backend Should NOT Do

❌ Don't decode/decrypt the encryptedVaultKey
❌ Don't hash it again
❌ Don't validate the content (it's encrypted, will look random)
❌ Don't try to parse it

## Testing

### Test Case 1: Register New User

**Frontend sends**:
```json
{
  "email": "test@example.com",
  "name": "Test User",
  "passwordVerifier": "a1b2c3d4...",
  "encryptedVaultKey": "kMx9vR3pL8qW4nZ7yA2cE5fH9jK0mN3pQ6sT8vX1zA4bD7eF0gI2hJ5kL8nM0oP3qR6sU9tV1wX4yZ7aB0cD3eF6g==",
  "deviceFingerprint": "browser-123"
}
```

**Backend should**:
1. Create user
2. Create vault with the encrypted key
3. Return login response with vault info

**Response**:
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "name": "Test User"
  },
  "vault": {
    "id": "vault-uuid",
    "encryptedVaultKey": "kMx9vR3pL8qW4nZ7yA2cE5fH9jK0mN3pQ6sT8vX1zA4bD7eF0gI2hJ5kL8nM0oP3qR6sU9tV1wX4yZ7aB0cD3eF6g=="
  }
}
```

### Test Case 2: Login Existing User

**Frontend sends**:
```json
{
  "email": "test@example.com",
  "passwordVerifier": "a1b2c3d4...",
  "deviceFingerprint": "browser-123"
}
```

**Backend returns**:
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "name": "Test User"
  },
  "vault": {
    "id": "vault-uuid",
    "encryptedVaultKey": "kMx9vR3pL8qW4nZ..."  // Same as registration
  }
}
```

## Common Issues

### Issue 1: Field Too Short

**Symptom**: Database truncates encryptedVaultKey

**Fix**: 
```sql
ALTER TABLE vaults 
ALTER COLUMN encrypted_vault_key TYPE TEXT;
```

### Issue 2: Vault Not Returned on Login

**Symptom**: Frontend gets "No vault found"

**Fix**: Add vault to login response:
```typescript
// In your login handler
const vault = await db.vaults.findOne({ userId: user.id });

return {
  token,
  user,
  vault: {
    id: vault.id,
    encryptedVaultKey: vault.encryptedVaultKey
  }
};
```

### Issue 3: EncryptedVaultKey Validation Error

**Symptom**: Backend rejects the encryptedVaultKey

**Fix**: Remove strict validation, just check:
- Not empty
- Is string
- Length between 50-500 characters

## Migration for Existing Users

If you have existing users with the old hash-based vault keys:

### Option 1: Force Re-registration (Simple)
```typescript
// Return error on login for old accounts
if (vault.encryptedVaultKey.length < 50) {
  return 400, "Please register a new account. Vault key format changed."
}
```

### Option 2: Reset Vault Keys (Better)
```typescript
// Add endpoint: POST /api/auth/reset-vault-key
{
  "email": "user@example.com",
  "password": "current-password",
  "newEncryptedVaultKey": "new-encrypted-key"
}

// Backend:
// 1. Verify password
// 2. Delete all passwords in vault
// 3. Update encryptedVaultKey
// 4. Return success
```

## Security Notes

### What Backend Knows
- ✅ User's email
- ✅ Password verifier (for authentication)
- ✅ **Encrypted** vault key
- ❌ User's actual password
- ❌ **Decrypted** vault key
- ❌ Decrypted password data

### Zero-Knowledge Architecture
```
User's Password → (PBKDF2) → Encryption Key
                              ↓
Random Vault Key → (AES-GCM) → Encrypted Vault Key → Stored in DB
                              ↓
                    Password Data → (AES-GCM) → Encrypted Blob → Stored in DB

Backend only sees the encrypted versions!
```

## Summary for Backend Team

**What you need to do:**

1. ✅ Accept `encryptedVaultKey` in registration (it's now longer, ~100-150 chars)
2. ✅ Store it as-is in database (no processing)
3. ✅ Return it with login response in `vault` object
4. ✅ Ensure database field supports TEXT (not VARCHAR with limit)
5. ✅ For old users: Either force re-registration or add vault key reset endpoint

**What you DON'T need to do:**

❌ No changes to encryption logic (frontend handles it)
❌ No changes to password verification
❌ No changes to password storage
❌ No decryption on backend (zero-knowledge!)

## Questions?

If backend team has questions:

1. **Is the encryptedVaultKey format different?**
   - Yes, it's now properly encrypted (longer, base64 encoded)

2. **Do we need to decrypt it?**
   - No! Backend never decrypts it. Only frontend can decrypt it.

3. **What if users have old vault keys?**
   - They need to either re-register or use a vault key reset endpoint

4. **Do we need to validate the content?**
   - No, just check it's a non-empty string with reasonable length

5. **Is this a breaking change?**
   - Yes, for existing users with old vault keys
   - New users work perfectly
   - Recommend forcing re-registration or providing reset option
