# ByteRyte Backend - Zero-Knowledge Password Wallet API (MongoDB)

Enterprise-grade, zero-knowledge password management system with military-grade encryption powered by MongoDB.

## 🔐 Security Architecture

- **Zero-Knowledge Encryption**: All data encrypted client-side before reaching the server
- **AES-256-GCM**: Military-grade encryption for vault items
- **Argon2id**: Secure password hashing with high iteration counts
- **JWT Authentication**: Secure session management
- **MongoDB**: Flexible, scalable NoSQL database
- **RBAC**: Role-based access control for enterprise environments
- **Audit Logging**: Immutable, append-only audit trail

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local, Docker, or Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Push schema to MongoDB (creates collections)
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Start development server
npm run dev
```

**Your API will be running at: `http://localhost:3000`**

## 📡 MongoDB Setup

### Option 1: Local MongoDB
```bash
# Install and start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Connection string
DATABASE_URL="mongodb://localhost:27017/byteryte"
```

### Option 2: MongoDB Atlas (FREE Cloud)
1. Create account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create FREE M0 cluster
3. Get connection string
4. Add to `.env`:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/byteryte?retryWrites=true&w=majority"
```

### Option 3: Docker
```bash
docker run -d --name byteryte-mongodb -p 27017:27017 mongo:latest
DATABASE_URL="mongodb://localhost:27017/byteryte"
```

**See `MONGODB_SETUP.md` for detailed instructions!**

## 📁 Project Structure

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
│   └── schema.prisma          # MongoDB schema
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

## 🔧 Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Push schema to MongoDB
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Run tests
npm test

# Format code
npm run format

# Lint code
npm run lint
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout and invalidate session
- `POST /api/auth/refresh` - Refresh JWT token

### Vaults
- `GET /api/vaults` - List user's vaults
- `POST /api/vaults` - Create new vault
- `GET /api/vaults/:id` - Get vault details
- `DELETE /api/vaults/:id` - Delete vault
- `GET /api/vaults/:id/items` - List items in vault

### Items (Password Entries)
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item (soft delete)
- `POST /api/items/:id/copy` - Log copy event

### Devices
- `GET /api/devices` - List user's devices
- `DELETE /api/devices/:id` - Revoke device access

### Audit Logs
- `GET /api/audit-logs` - Get user's audit logs

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

## 🌐 Connect Your Frontend (localhost:8080)

Your frontend can make requests to:

```javascript
const API_BASE = 'http://localhost:3000/api';

// Example: Login
const response = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    passwordVerifier: 'hashed_password_verifier'
  })
});
```

**See `FRONTEND_INTEGRATION.md` and `FRONTEND_CONNECTION.md` for complete examples!**

## 📊 MongoDB Collections

- `users` - User accounts & authentication
- `vaults` - Encrypted vaults (PERSONAL, GROUP, STEALTH)
- `vault_members` - Vault sharing & permissions
- `items` - Encrypted password entries
- `devices` - Login tracking & device management
- `audit_logs` - Immutable activity logs
- `emergency_access` - Emergency vault access
- `organizations` - Enterprise organizations
- `org_users` - Organization memberships
- `org_roles` - Custom roles & permissions
- `org_policies` - Security policies

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "passwordVerifier": "hash", "encryptedVaultKey": "key"}'
```

**See `API_TESTING.md` for complete test suite!**

## 🎯 Roadmap

### ✅ Phase 1 - MVP (COMPLETE)
- [x] Authentication & JWT
- [x] Vault management
- [x] Item CRUD
- [x] Audit logging
- [x] Device tracking
- [x] MongoDB integration

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

## 📚 Documentation

- **MONGODB_SETUP.md** - MongoDB installation & configuration
- **QUICKSTART.md** - Quick setup guide
- **FRONTEND_INTEGRATION.md** - Frontend integration examples
- **FRONTEND_CONNECTION.md** - Connection checklist with code
- **API_TESTING.md** - Complete API testing guide
- **IMPLEMENTATION_SUMMARY.md** - Feature overview

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
# Windows: net start MongoDB
# macOS: brew services list
# Linux: sudo systemctl status mongod
```

### Prisma Issues
```bash
# Regenerate client
npx prisma generate

# Reset and push schema
npx prisma db push --force-reset
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is a private enterprise project. Contact the team for contribution guidelines.

## 📧 Support

For security issues, contact: security@byteryte.com
For general support: support@byteryte.com

---

**Your ByteRyte backend with MongoDB is ready to power a world-class password manager! 🚀🔐**
