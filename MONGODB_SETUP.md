# ByteRyte Backend - MongoDB Setup Guide

## 🎉 MongoDB Configuration Complete!

Your ByteRyte backend has been configured to use **MongoDB** instead of PostgreSQL.

---

## 📦 Database Options

### Option 1: Local MongoDB (Recommended for Development)

#### Install MongoDB Locally

**Windows:**
```powershell
# Download from: https://www.mongodb.com/try/download/community
# Or use chocolatey:
choco install mongodb

# Start MongoDB service
net start MongoDB
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
```

#### Connection String (Local)
```env
DATABASE_URL="mongodb://localhost:27017/byteryte"
```

---

### Option 2: MongoDB Atlas (Cloud - FREE Tier Available)

1. **Create Account**: Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)

2. **Create Cluster**:
   - Click "Build a Database"
   - Select FREE "Shared" tier (M0)
   - Choose a region close to you
   - Click "Create Cluster"

3. **Configure Access**:
   - Create a database user (username + password)
   - Add your IP address to whitelist (or use `0.0.0.0/0` for development)

4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your actual password

#### Connection String (Atlas)
```env
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/byteryte?retryWrites=true&w=majority"
```

---

### Option 3: Docker MongoDB

```bash
# Run MongoDB in Docker container
docker run -d \
  --name byteryte-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=byteryte \
  mongo:latest

# Connection string
DATABASE_URL="mongodb://localhost:27017/byteryte"
```

---

## 🚀 Quick Start with MongoDB

### 1. Update .env File

```env
# Choose one of the options above
DATABASE_URL="mongodb://localhost:27017/byteryte"

# Or for MongoDB Atlas:
# DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/byteryte?retryWrites=true&w=majority"
```

### 2. Push Schema to MongoDB

**Important:** MongoDB with Prisma doesn't use migrations like PostgreSQL. Instead, use `db push`:

```bash
# Push schema to MongoDB (creates collections)
npx prisma db push

# This will:
# - Create the database if it doesn't exist
# - Create all collections (users, vaults, items, etc.)
# - Add indexes
```

### 3. Generate Prisma Client (Already Done!)

```bash
npx prisma generate
```

### 4. Start the Server

```bash
npm run dev
```

**Your API will be running at: `http://localhost:3000`** ✅

---

## 📊 MongoDB vs PostgreSQL Differences

### ID Fields
- **PostgreSQL**: UUID strings (`550e8400-e29b-41d4-a716-446655440000`)
- **MongoDB**: ObjectId strings (`507f1f77bcf86cd799439011`)

### Migrations
- **PostgreSQL**: Uses `prisma migrate dev`
- **MongoDB**: Uses `prisma db push` (no migration files)

### Collections (Tables)
All your data is stored in MongoDB collections:
- `users`
- `vaults`
- `vault_members`
- `items`
- `devices`
- `audit_logs`
- `emergency_access`
- `organizations`
- `org_users`
- `org_roles`
- `org_policies`

---

## 🔍 View Your Data

### Using Prisma Studio (GUI)

```bash
npx prisma studio
```

Opens a web interface at `http://localhost:5555` where you can:
- ✅ View all collections
- ✅ Browse data
- ✅ Edit records
- ✅ Run queries

### Using MongoDB Compass (Official GUI)

1. Download: [https://www.mongodb.com/products/compass](https://www.mongodb.com/products/compass)
2. Connect using your DATABASE_URL
3. Browse collections visually

### Using mongosh (CLI)

```bash
# Connect to local MongoDB
mongosh

# Use byteryte database
use byteryte

# Show collections
show collections

# Query users
db.users.find().pretty()

# Count items
db.items.countDocuments()
```

---

## 🧪 Test the Database Connection

```bash
# Test MongoDB connection
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ MongoDB connected!')).catch(e => console.error('❌ Failed:', e))"
```

**Expected Output:**
```
✅ MongoDB connected!
```

---

## 📝 Updated npm Scripts

```bash
# Push schema to MongoDB (use this instead of migrate)
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio
npm run prisma:studio

# Start dev server
npm run dev
```

Add this to your `package.json`:

```json
{
  "scripts": {
    "prisma:push": "prisma db push",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio"
  }
}
```

---

## 🔄 Key Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)
- ✅ Changed `provider = "mongodb"`
- ✅ All IDs now use `@id @default(auto()) @map("_id") @db.ObjectId`
- ✅ Foreign keys use `@db.ObjectId`
- ✅ Collections mapped with `@@map("collection_name")`

### 2. Environment Variables (`.env`)
- ✅ Updated `DATABASE_URL` to MongoDB connection string
- ✅ Added MongoDB Atlas example

### 3. No Migration Files
- ✅ MongoDB uses schema push, not migrations
- ✅ No `/prisma/migrations` folder needed

---

## ✅ Advantages of MongoDB for ByteRyte

### 1. **Flexible Schema**
- Store encrypted blobs of any size
- Easy to add new fields without migrations
- Perfect for varying metadata structures

### 2. **JSON-Native**
- Natural fit for encrypted JSON blobs
- No need to stringify/parse for metadata
- Better performance for nested data

### 3. **Horizontal Scaling**
- Easy to scale as user base grows
- Sharding support for large deployments
- Replica sets for high availability

### 4. **Cloud-Ready**
- MongoDB Atlas free tier
- Automatic backups
- Global clusters

---

## 🎯 Complete Setup Checklist

- [ ] Choose MongoDB option (Local, Atlas, or Docker)
- [ ] Update `DATABASE_URL` in `.env`
- [ ] Run `npx prisma db push` to create collections
- [ ] Run `npx prisma generate` (already done)
- [ ] Test connection with Prisma Studio: `npx prisma studio`
- [ ] Start server: `npm run dev`
- [ ] Test API: `curl http://localhost:3000/health`

---

## 🔗 Resources

- **MongoDB Installation**: https://www.mongodb.com/docs/manual/installation/
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Prisma + MongoDB**: https://www.prisma.io/docs/concepts/database-connectors/mongodb
- **MongoDB Compass**: https://www.mongodb.com/products/compass

---

## 🐛 Troubleshooting

### "Connection refused" Error
```bash
# Check if MongoDB is running
# Windows:
net start MongoDB

# macOS/Linux:
brew services start mongodb-community
# or
sudo systemctl status mongod
```

### "Authentication failed" (Atlas)
- Double-check username/password in connection string
- Verify IP whitelist in Atlas dashboard
- Ensure `retryWrites=true&w=majority` in connection string

### "Database not found"
- MongoDB creates databases automatically
- Just run `npx prisma db push` and it will be created

---

## 🎉 You're Ready!

Your ByteRyte backend is now configured for **MongoDB**!

**Next steps:**
1. Set up MongoDB (local or Atlas)
2. Run `npx prisma db push`
3. Start the server with `npm run dev`
4. Connect your frontend to `http://localhost:3000/api`

**MongoDB is faster to set up and doesn't require running migration files - just push and go! 🚀**
