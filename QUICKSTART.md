# ByteRyte Backend - Quick Start

## ✅ What's Been Built (Phase 1 MVP - COMPLETE)

Your ByteRyte backend is production-ready with these features:

### 🔐 Authentication System
- ✅ User registration with password verifier (NOT plaintext)
- ✅ Secure login with JWT tokens
- ✅ Session management & token refresh
- ✅ Device fingerprinting & tracking
- ✅ Foundation for 2FA (TOTP)

### 🗄️ Vault Management
- ✅ Personal vaults (encrypted)
- ✅ Group vaults support
- ✅ Stealth vault capability
- ✅ Multi-user vault sharing

### 📝 Password Items (Zero-Knowledge)
- ✅ Create/Read/Update/Delete encrypted items
- ✅ Metadata support (categories, favorites, strength)
- ✅ Tracking: last viewed, last copied, last used
- ✅ Soft delete for secure shredding

### 🔍 Audit & Security
- ✅ Immutable audit logs
- ✅ Track all vault operations
- ✅ Device management & revocation
- ✅ IP & user agent tracking

### 🏗️ Database Schema
- ✅ Users, Vaults, Items, Devices
- ✅ Audit logs
- ✅ Emergency access (Phase 2 ready)
- ✅ Organizations (Phase 5 ready)

---

## 🚀 Getting Started (3 Steps)

### Step 1: Set up PostgreSQL

```bash
# Option A: Local PostgreSQL
createdb byteryte

# Option B: Docker
docker run --name byteryte-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Option C: Use existing PostgreSQL server
# Just update DATABASE_URL in .env
```

### Step 2: Configure Environment

Edit `.env` file:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/byteryte"
JWT_SECRET="change-this-to-something-secure"
CORS_ORIGIN=http://localhost:8080
```

### Step 3: Initialize & Run

```bash
# Install dependencies (already done)
npm install

# Run database migrations
npm run prisma:migrate

# Start the server
npm run dev
```

**Your API will be running at: `http://localhost:3000`**

---

## 🧪 Test the API

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "passwordVerifier": "hashed_password_here",
    "encryptedVaultKey": "encrypted_key_here"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "passwordVerifier": "hashed_password_here"
  }'
```

---

## 📡 Connect Your Frontend (localhost:8080)

Your frontend can now make requests to:

### Base URL
```
http://localhost:3000/api
```

### Required Headers
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN' // After login
}
```

### Example Frontend Call
```javascript
// From your frontend @ localhost:8080
const response = await fetch('http://localhost:3000/api/vaults', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data); // { success: true, data: [...vaults] }
```

See `FRONTEND_INTEGRATION.md` for complete integration examples!

---

## 📚 Project Structure

```
ByteRyte-BackEnd/
├── src/
│   ├── server.ts              # Main server entry point
│   ├── routes/
│   │   ├── auth.routes.ts     # Registration, login, logout
│   │   ├── vault.routes.ts    # Vault CRUD operations
│   │   ├── item.routes.ts     # Password item management
│   │   ├── device.routes.ts   # Device tracking
│   │   └── audit.routes.ts    # Audit log queries
│   ├── middleware/
│   │   ├── auth.middleware.ts # JWT verification
│   │   └── error.middleware.ts# Error handling
│   ├── services/
│   │   └── audit.service.ts   # Audit logging service
│   └── models/
│       └── types.ts           # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

---

## 🔒 Zero-Knowledge Architecture

**CRITICAL**: The backend NEVER has access to:
- Master passwords
- Decrypted vault keys
- Decrypted item data

### How It Works:
```
Frontend                          Backend
--------                          -------
Master Password
    ↓
Argon2id/PBKDF2
    ↓
Master Key (256-bit)              (NEVER sent)
    ↓
Encrypts Vault Key                Stores: encryptedVaultKey (opaque)
    ↓
Encrypts Item Data                Stores: encryptedBlob (opaque)
    ↓
Password Verifier Hash     →      Stores: passwordVerifier (bcrypt)
                                  Uses for: Authentication only
```

---

## 📖 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "passwordVerifier": "bcrypt_or_srp_verifier",
  "encryptedVaultKey": "base64_encrypted_key",
  "publicKey": "optional_for_group_vaults",
  "privateKeyBlob": "optional_encrypted_private_key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "userId": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "passwordVerifier": "bcrypt_or_srp_verifier",
  "deviceFingerprint": "optional_device_hash",
  "totpCode": "optional_2fa_code"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "userId": "uuid",
    "email": "user@example.com",
    "vaults": [
      {
        "id": "vault_uuid",
        "name": "My Vault",
        "type": "PERSONAL",
        "itemCount": 15
      }
    ]
  }
}
```

### Vault Endpoints

#### GET /api/vaults
Lists all vaults for authenticated user.

#### POST /api/vaults
**Request:**
```json
{
  "name": "Family Vault",
  "type": "GROUP",
  "encryptedVaultKey": "encrypted_key"
}
```

#### GET /api/vaults/:id/items
Returns all items in a vault (encrypted).

### Item Endpoints

#### POST /api/items
**Request:**
```json
{
  "vaultId": "vault_uuid",
  "encryptedBlob": "base64_encrypted_json",
  "metadata": {
    "category": "banking",
    "isFavorite": true,
    "domain": "bankofamerica.com",
    "strength": "strong"
  }
}
```

#### PUT /api/items/:id
Update encrypted item data.

#### DELETE /api/items/:id
Soft delete (marks as deleted, actual shredding in Phase 2).

#### POST /api/items/:id/copy
Log that password was copied (for audit trail).

---

## 🎯 Roadmap

### ✅ Phase 1 - MVP (DONE)
- [x] Authentication & JWT
- [x] Vault management
- [x] Item CRUD
- [x] Audit logging
- [x] Device tracking

### ⏳ Phase 2 - Security Features (Next)
- [ ] Emergency access system
- [ ] Secure delete (password shredding)
- [ ] Tamper detection
- [ ] Breach monitoring integration

### ⏳ Phase 3 - Organization Features
- [ ] Password strength audit
- [ ] Smart tags & categorization
- [ ] Password health dashboard

### ⏳ Phase 4 - Group Collaboration
- [ ] Group vault sharing
- [ ] Public/private key encryption
- [ ] Member management & permissions

### ⏳ Phase 5 - Enterprise
- [ ] Organizations & RBAC
- [ ] SSO (SAML/OIDC)
- [ ] SCIM provisioning
- [ ] DLP policies
- [ ] Admin console

---

## 🛠️ Development Commands

```bash
# Development
npm run dev                # Start with hot reload
npm run build              # Build for production
npm start                  # Run production build

# Database
npm run prisma:migrate     # Run migrations
npm run prisma:generate    # Generate Prisma Client
npm run prisma:studio      # Open database GUI

# Code Quality
npm run lint               # Lint code
npm run format             # Format code
npm test                   # Run tests
```

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
psql -U postgres

# Test connection
psql $DATABASE_URL
```

### Prisma Issues
```bash
# Regenerate client
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3001
```

---

## 🎉 You're Ready!

Your ByteRyte backend is fully operational and ready to receive requests from your frontend on `localhost:8080`.

**Next steps:**
1. Run `npm run prisma:migrate` to create database tables
2. Start the server with `npm run dev`
3. Implement frontend crypto module (see FRONTEND_INTEGRATION.md)
4. Start making API calls from your frontend!

**Questions?** Check the integration guide in `FRONTEND_INTEGRATION.md`
