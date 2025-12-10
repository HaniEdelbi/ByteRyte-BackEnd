# Backend Requirements for Critical Features

This document outlines the **required backend API endpoints** for the newly implemented critical features in the frontend.

---

## 🎯 Overview

The frontend has implemented 4 critical features that require backend support:

1. ✅ **Edit Password** - Update existing password entries
2. ✅ **Delete Password** - Remove password entries
3. ✅ **Update Account Settings** - Modify user profile information
4. ✅ **Change Password** - Update user authentication password

---

## 1️⃣ Edit Password API

### Endpoint
```http
PUT /api/passwords/:id
```

### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "encryptedBlob": "base64-encoded-encrypted-data",
  "category": "login" | "payment" | "secure-note" | "other",
  "favorite": true | false
}
```

### Response (Success - 200 OK)
```json
{
  "success": true,
  "data": {
    "id": "password-uuid",
    "vaultId": "vault-uuid",
    "encryptedBlob": "base64-encoded-encrypted-data",
    "category": "login",
    "favorite": false,
    "createdAt": "2025-12-09T10:30:00.000Z",
    "updatedAt": "2025-12-09T12:45:00.000Z"
  }
}
```

### Error Responses
```json
// 404 Not Found
{
  "success": false,
  "message": "Password not found"
}

// 403 Forbidden
{
  "success": false,
  "message": "You don't have permission to edit this password"
}

// 400 Bad Request
{
  "success": false,
  "message": "Invalid request data"
}
```

### Implementation Notes
- **Verify ownership**: Check that the authenticated user owns the vault containing this password
- **Validate category**: Must be one of: `login`, `payment`, `secure-note`, `other`
- **Update timestamp**: Set `updatedAt` to current time
- **Keep encryption**: Don't decrypt the `encryptedBlob` - just store it as-is
- **Database field**: Ensure `encryptedBlob` field is TEXT (not VARCHAR) to handle large encrypted data

---

## 2️⃣ Delete Password API

### Endpoint
```http
DELETE /api/passwords/:id
```

### Headers
```http
Authorization: Bearer <token>
```

### Response (Success - 200 OK)
```json
{
  "success": true,
  "message": "Password deleted successfully"
}
```

### Error Responses
```json
// 404 Not Found
{
  "success": false,
  "message": "Password not found"
}

// 403 Forbidden
{
  "success": false,
  "message": "You don't have permission to delete this password"
}
```

### Implementation Notes
- **Verify ownership**: Check that the authenticated user owns the vault containing this password
- **Soft delete option**: Consider implementing soft delete (mark as deleted instead of permanent deletion)
- **Audit log**: Log deletion for security purposes
- **CASCADE behavior**: Handle related records properly

---

## 3️⃣ Update User Profile API

### Endpoint
```http
PUT /api/auth/profile
```

### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "name": "John Doe",
  "email": "newemail@example.com"
}
```

**Note:** Both fields are optional - send only the fields you want to update.

### Response (Success - 200 OK)
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "newemail@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "new-jwt-token-if-email-changed"
}
```

### Error Responses
```json
// 400 Bad Request - Email already exists
{
  "success": false,
  "message": "Email already in use"
}

// 400 Bad Request - Invalid email format
{
  "success": false,
  "message": "Invalid email format"
}

// 401 Unauthorized
{
  "success": false,
  "message": "Not authenticated"
}
```

### Implementation Notes
- **Email validation**: Validate email format and uniqueness
- **Email change**: If email changes, consider sending verification email
- **Token refresh**: If email changes, issue new JWT token with updated email
- **Update session**: Update user session data
- **Audit log**: Log profile changes for security

---

## 4️⃣ Change Password API

### Endpoint
```http
POST /api/auth/change-password
```

### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newStrongPassword456!"
}
```

### Response (Success - 200 OK)
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Error Responses
```json
// 400 Bad Request - Incorrect current password
{
  "success": false,
  "message": "Current password is incorrect"
}

// 400 Bad Request - Weak new password
{
  "success": false,
  "message": "Password must be at least 8 characters long"
}

// 401 Unauthorized
{
  "success": false,
  "message": "Not authenticated"
}
```

### Implementation Notes
- **Verify current password**: Check that `currentPassword` matches the stored hash
- **Password strength**: Validate new password meets minimum requirements:
  - At least 8 characters
  - (Optional) Require mix of uppercase, lowercase, numbers, symbols
- **Hash new password**: Use bcrypt/argon2 with proper salt
- **Invalidate sessions**: Consider invalidating all other user sessions
- **Send notification**: Email user about password change
- **Audit log**: Log password changes
- **Rate limiting**: Prevent brute force attempts

---

## 🔐 Security Considerations

### Authentication & Authorization
1. **JWT Validation**: All endpoints must validate JWT token
2. **User Context**: Extract user ID from token, never trust client-sent user IDs
3. **Ownership Verification**: For passwords, verify user owns the vault
4. **Rate Limiting**: Implement rate limiting on all endpoints

### Password Management
1. **Zero-Knowledge Encryption**: Backend NEVER decrypts password data
2. **Store encrypted blobs as-is**: Only frontend has vault key
3. **Validate encrypted blob format**: Ensure it's valid base64

### Data Validation
1. **Input sanitization**: Sanitize all user inputs
2. **SQL injection prevention**: Use parameterized queries
3. **XSS prevention**: Sanitize output data
4. **CSRF protection**: Implement CSRF tokens for state-changing operations

### Audit Logging
Log the following events:
- Password edited (user ID, password ID, timestamp)
- Password deleted (user ID, password ID, timestamp)
- Profile updated (user ID, changed fields, timestamp)
- Password changed (user ID, timestamp, IP address)

---

## 📋 Database Schema Updates

### Users Table
Ensure you have these fields:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Passwords Table
```sql
CREATE TABLE passwords (
  id UUID PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  encrypted_blob TEXT NOT NULL,  -- IMPORTANT: TEXT not VARCHAR!
  category VARCHAR(20) NOT NULL CHECK (category IN ('login', 'payment', 'secure-note', 'other')),
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_vault_id (vault_id),
  INDEX idx_favorite (favorite),
  INDEX idx_category (category)
);
```

### Audit Logs Table (Recommended)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,  -- 'PASSWORD_UPDATED', 'PASSWORD_DELETED', etc.
  entity_type VARCHAR(50),       -- 'password', 'user', 'vault'
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
```

---

## 🧪 Testing Checklist

### Edit Password
- [ ] Can update password with valid data
- [ ] Cannot update someone else's password
- [ ] Cannot update with invalid category
- [ ] Updates `updatedAt` timestamp
- [ ] Preserves vault ownership

### Delete Password
- [ ] Can delete own password
- [ ] Cannot delete someone else's password
- [ ] Returns 404 for non-existent password
- [ ] Password is actually removed from database

### Update Profile
- [ ] Can update name only
- [ ] Can update email only
- [ ] Can update both name and email
- [ ] Cannot use duplicate email
- [ ] Email validation works
- [ ] Token refreshes on email change

### Change Password
- [ ] Can change password with correct current password
- [ ] Cannot change with incorrect current password
- [ ] New password is properly hashed
- [ ] Password strength validation works
- [ ] Old password no longer works after change
- [ ] Rate limiting prevents brute force

---

## 🚀 Implementation Priority

### Phase 1 - Critical (Implement First)
1. ✅ Edit Password API
2. ✅ Delete Password API

### Phase 2 - High Priority
3. ✅ Update User Profile API
4. ✅ Change Password API

### Phase 3 - Security Enhancements
5. Audit logging for all operations
6. Rate limiting on password change
7. Email notifications for security events

---

## 📞 Frontend Integration Details

### Frontend Service Calls

**Edit Password:**
```typescript
// Frontend calls: PUT /api/passwords/:id
await passwordService.update(id, {
  website: "example.com",
  username: "user@example.com",
  password: "password123",
  notes: "Optional notes",
  category: "login",
  favorite: false
});
// Auto-encrypts data before sending to backend
```

**Delete Password:**
```typescript
// Frontend calls: DELETE /api/passwords/:id
await passwordService.delete(id);
```

**Update Profile:**
```typescript
// Frontend calls: PUT /api/auth/profile
await authService.updateProfile({
  name: "John Doe",
  email: "john@example.com"
});
```

**Change Password:**
```typescript
// Frontend calls: POST /api/auth/change-password
await authService.changePassword({
  currentPassword: "oldPass123",
  newPassword: "newPass456!"
});
```

---

## ✅ Success Criteria

Your backend is ready when:

1. ✅ All 4 endpoints are implemented and working
2. ✅ Authentication/authorization is properly enforced
3. ✅ Database schema supports all operations
4. ✅ Error handling returns proper status codes
5. ✅ Input validation prevents invalid data
6. ✅ Security measures are in place (rate limiting, audit logs)
7. ✅ Integration tests pass for all endpoints

---

## 🔗 Related Documents

- `BACKEND_INTEGRATION.md` - General backend integration guide
- `VAULT_IMPLEMENTATION.md` - Vault encryption details
- `ARCHITECTURE.md` - Overall system architecture

---

## 📝 Questions or Issues?

If you encounter any issues implementing these endpoints:

1. Check the frontend console for detailed request/response logs
2. Verify JWT token is being sent correctly
3. Ensure CORS is configured if backend is on different domain
4. Check that Content-Type headers are correct
5. Validate database field sizes (especially `encryptedBlob` as TEXT)

---

**Last Updated:** December 9, 2025  
**Frontend Version:** Compatible with current ByteRyte-FrontEnd main branch
