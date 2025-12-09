# 🔐 ByteRyte Backend API

**Enterprise-grade Zero-Knowledge Password Management System**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)](https://www.mongodb.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-brightgreen.svg)](https://www.prisma.io/)

ByteRyte is a modern, secure, and scalable password management backend API built with zero-knowledge encryption principles. The server never sees your plaintext passwords—all encryption and decryption happens client-side.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Features

### 🔒 **Zero-Knowledge Architecture**
- **Client-side encryption**: All password data encrypted before transmission
- **Server-blind storage**: Backend never sees plaintext passwords
- **End-to-end encryption**: AES-256-GCM encryption standard
- **Secure key derivation**: Password verifiers never stored in plain text

### 🔐 **Authentication & Security**
- **JWT-based authentication**: Secure token-based session management
- **Device fingerprinting**: Track and manage sessions across devices
- **Session management**: Revoke access from any device remotely
- **Audit logging**: Complete trail of all user actions
- **CORS protection**: Configurable cross-origin resource sharing

### 💾 **Data Management**
- **MongoDB database**: Flexible, scalable NoSQL storage
- **Prisma ORM**: Type-safe database queries and migrations
- **Multi-vault support**: Personal, group, stealth, and organization vaults
- **Category organization**: Login, payment, secure note, and other categories
- **Favorites system**: Mark frequently used passwords

### 🎯 **Developer Experience**
- **TypeScript**: Full type safety across the codebase
- **Fastify framework**: High-performance HTTP server
- **Hot reload**: Live development with tsx watch
- **API documentation**: Comprehensive guides and examples
- **Error handling**: Consistent JSON error responses
- **Validation**: Zod schema validation on all endpoints

---

## 🏗️ Architecture

ByteRyte follows a **zero-knowledge architecture** where:

1. **Client generates encryption keys** from user's master password
2. **Client encrypts all sensitive data** before sending to server
3. **Server stores encrypted blobs** without decryption capability
4. **Client decrypts data** after retrieval using master key

```
┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
│   Client    │                  │   Backend   │                  │  MongoDB    │
│  (Browser)  │                  │     API     │                  │  Database   │
└──────┬──────┘                  └──────┬──────┘                  └──────┬──────┘
       │                                │                                │
       │  1. Derive Key from Password   │                                │
       │────────────────────────────────>                                │
       │                                │                                │
       │  2. Encrypt Data Client-Side   │                                │
       │────────────────────────────────>                                │
       │                                │                                │
       │  3. Send Encrypted Blob        │                                │
       │───────────────────────────────>│                                │
       │                                │  4. Store Encrypted            │
       │                                │───────────────────────────────>│
       │                                │                                │
       │  5. Retrieve Encrypted Blob    │                                │
       │<───────────────────────────────│                                │
       │                                │  6. Fetch Encrypted            │
       │                                │<───────────────────────────────│
       │                                │                                │
       │  7. Decrypt Data Client-Side   │                                │
       │<───────────────────────────────                                 │
```

### **Key Principles:**
- ✅ **Server never has decryption keys**
- ✅ **All encryption happens client-side**
- ✅ **Backend is "blind" to actual password data**
- ✅ **Even database compromise doesn't expose passwords**

---

## 🛠️ Technology Stack

### **Core Framework**
- **[Node.js](https://nodejs.org/)** (v18+) - JavaScript runtime
- **[TypeScript](https://www.typescriptlang.org/)** (v5.0+) - Type-safe development
- **[Fastify](https://www.fastify.io/)** (v5.2.0) - High-performance web framework

### **Database & ORM**
- **[MongoDB](https://www.mongodb.com/)** (v7.0+) - NoSQL database
- **[Prisma](https://www.prisma.io/)** (v5.22.0) - Next-generation ORM
- **MongoDB Atlas** - Cloud database (recommended for production)

### **Authentication & Security**
- **[@fastify/jwt](https://github.com/fastify/fastify-jwt)** (v9.1.0) - JWT token generation/verification
- **[@fastify/cors](https://github.com/fastify/fastify-cors)** (v10.1.0) - CORS middleware
- **[@fastify/helmet](https://github.com/fastify/fastify-helmet)** - Security headers
- **[@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit)** - API rate limiting

### **Validation & Utilities**
- **[Zod](https://zod.dev/)** (v3.24.1) - Schema validation
- **[dotenv](https://github.com/motdotla/dotenv)** - Environment variable management

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v9.0.0 or higher (comes with Node.js)
- **MongoDB** instance (local, Docker, or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HaniEdelbi/ByteRyte-BackEnd.git
   cd ByteRyte-BackEnd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   
   Edit `.env` file:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   HOST=0.0.0.0

   # Database Connection
   DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/byteryte"

   # JWT Secret (CHANGE IN PRODUCTION!)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-characters
   JWT_EXPIRES_IN=7d

   # CORS Settings
   CORS_ORIGIN=http://localhost:8080
   ```

   **⚠️ Security:** Generate a strong `JWT_SECRET` using: `openssl rand -base64 32`

5. **Initialize database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Push schema to database
   npm run prisma:push
   ```

6. **Start the server**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

**Server will start at:** `http://localhost:3000`

**Health check:** `http://localhost:3000/health`

---

## 📚 API Documentation

### **Quick Links**

- **[Complete API Reference](./FRONTEND_SYNC_GUIDE.md)** - Detailed endpoint documentation with examples
- **[Backend Requirements](./BACKEND_REQUIREMENTS.md)** - Original specification document
- **[Implementation Status](./API_IMPLEMENTATION_STATUS.md)** - Current progress and roadmap

### **Base URL**

```
Development: http://localhost:3000
Production:  https://api.byteryte.com
```

### **Core Endpoints**

#### 🔐 **Authentication**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user account | No |
| POST | `/api/auth/login` | Authenticate user | No |
| POST | `/api/auth/logout` | End current session | Yes |
| GET | `/api/auth/sessions` | Get active sessions | Yes |

#### 🔑 **Password Management**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/passwords` | List all passwords | Yes |
| POST | `/api/passwords` | Create new password | Yes |
| GET | `/api/passwords/:id` | Get specific password | Yes |
| PUT | `/api/passwords/:id` | Update password | Yes |
| DELETE | `/api/passwords/:id` | Delete password | Yes |

#### 🗄️ **Vault Management**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/vaults` | List user's vaults | Yes |
| POST | `/api/vaults` | Create new vault | Yes |
| GET | `/api/vaults/:id` | Get vault details | Yes |
| DELETE | `/api/vaults/:id` | Delete vault | Yes |

#### 📱 **Device Management**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/devices` | List registered devices | Yes |
| DELETE | `/api/devices/:id` | Revoke device access | Yes |

### **Example Request**

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "passwordVerifier": "client_derived_hash",
    "encryptedVaultKey": "encrypted_master_key"
  }'
```

**For complete documentation**, see [FRONTEND_SYNC_GUIDE.md](./FRONTEND_SYNC_GUIDE.md)

---

## 📂 Project Structure

```
ByteRyte-BackEnd/
├── prisma/
│   └── schema.prisma             # Database schema definition
├── src/
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT authentication
│   │   └── error.middleware.ts   # Error handling
│   ├── models/
│   │   └── types.ts              # TypeScript types
│   ├── routes/
│   │   ├── auth.routes.ts        # Authentication endpoints
│   │   ├── vault.routes.ts       # Vault management
│   │   ├── password.routes.ts    # Password CRUD
│   │   ├── item.routes.ts        # Generic item management
│   │   ├── device.routes.ts      # Device/session management
│   │   └── audit.routes.ts       # Audit logging
│   ├── services/
│   │   ├── audit.service.ts      # Audit logging service
│   │   └── session.service.ts    # Session management
│   └── server.ts                 # Main application entry
├── .env                          # Environment variables (not in git)
├── .env.example                  # Example environment config
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## 🔒 Security

### **Implemented Security Measures**

- ✅ **Zero-Knowledge Encryption** - Server never sees plaintext passwords
- ✅ **JWT Authentication** - Secure token-based auth with 7-day expiration
- ✅ **Device Tracking** - Monitor and revoke sessions remotely
- ✅ **CORS Protection** - Configurable cross-origin policies
- ✅ **Input Validation** - Zod schema validation on all endpoints
- ✅ **Audit Logging** - Complete trail of all user actions
- ✅ **Security Headers** - Helmet middleware for HTTP security
- ✅ **Rate Limiting** - Prevent abuse and DoS attacks

### **Security Best Practices**

#### For Production:
- Generate strong `JWT_SECRET` using: `openssl rand -base64 32`
- Set `NODE_ENV=production`
- Use HTTPS/SSL for all communications
- Configure specific CORS origins (not wildcard)
- Enable rate limiting on all endpoints
- Regular security audits and dependency updates

### **Vulnerability Reporting**

If you discover a security vulnerability, please email: **security@byteryte.com**

---

## 💻 Development

### **Available Scripts**

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run watch            # Watch mode with auto-restart

# Building
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled production code

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema changes to database
npm run prisma:studio    # Open Prisma Studio UI

# Testing
.\test-api.ps1                    # Basic API test
.\test-api-comprehensive.ps1      # Full test suite
```

---

## 🧪 Testing

### **API Testing**

```bash
# Comprehensive test suite
.\test-api-comprehensive.ps1

# Manual testing with cURL
curl http://localhost:3000/health
```

### **Test Coverage**

All Phase 1 (MVP) endpoints are fully tested:
- ✅ User registration
- ✅ User login/logout
- ✅ Vault management
- ✅ Password CRUD operations
- ✅ Device management
- ✅ Session handling

---

## 🚀 Deployment

### **Production Checklist**

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET`
- [ ] Configure MongoDB Atlas or secure MongoDB
- [ ] Set appropriate `CORS_ORIGIN`
- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Automated backups

### **Deployment Platforms**

- **Heroku** - Quick deployment with Git integration
- **Vercel** - Serverless deployment
- **AWS EC2** - Full control and scalability
- **Docker** - Containerized deployment

### **Environment Variables for Production**

```env
NODE_ENV=production
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=<generate-strong-secret>
CORS_ORIGIN=https://app.byteryte.com
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📞 Support & Contact

### **Documentation**
- [Complete API Documentation](./FRONTEND_SYNC_GUIDE.md)
- [Backend Requirements](./BACKEND_REQUIREMENTS.md)
- [Implementation Status](./API_IMPLEMENTATION_STATUS.md)

### **Get Help**
- 📧 Email: support@byteryte.com
- 🐛 Bug Reports: [GitHub Issues](https://github.com/HaniEdelbi/ByteRyte-BackEnd/issues)

### **Team**
- **Project Lead**: Hani Edelbi
- **Repository**: [github.com/HaniEdelbi/ByteRyte-BackEnd](https://github.com/HaniEdelbi/ByteRyte-BackEnd)

---

## 🎯 Roadmap

### **Phase 1: MVP** ✅ **COMPLETE**
- [x] User authentication
- [x] Password CRUD operations
- [x] Vault management
- [x] Device/session management
- [x] Category and favorites support
- [x] Audit logging

### **Phase 2: Enhanced Features** 🚧 **In Progress**
- [ ] User profile management
- [ ] Security score endpoint
- [ ] Password strength analysis
- [ ] Settings management

### **Phase 3: Advanced Features** 📋 **Planned**
- [ ] Emergency access system
- [ ] Password sharing
- [ ] Two-factor authentication
- [ ] Password breach detection

---

<div align="center">

**Built with ❤️ by the ByteRyte Team**

[Report Bug](https://github.com/HaniEdelbi/ByteRyte-BackEnd/issues) · [Request Feature](https://github.com/HaniEdelbi/ByteRyte-BackEnd/issues) · [Documentation](./FRONTEND_SYNC_GUIDE.md)

</div>
