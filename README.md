# Prowider — Mini Lead Distribution System

## Tech Stack
- **Frontend**: React + Vite (JavaScript)
- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose ODM)
- **Real-time**: Server-Sent Events (SSE)

---

## Prerequisites

Install these before starting:

1. **Node.js v18+** → https://nodejs.org (download LTS version)
   - Verify: `node --version`
2. **MongoDB Atlas account** (free) → https://www.mongodb.com/cloud/atlas
   - OR install MongoDB locally (requires replica set for transactions)

---

## Step 1 — Get a MongoDB connection string

### Option A: MongoDB Atlas (Recommended — Free)
1. Go to https://cloud.mongodb.com
2. Create a free account → Create a free M0 cluster
3. Click "Connect" → "Drivers" → copy the connection string
4. It looks like:
   `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/prowider`
5. Replace `<password>` with your actual password

### Option B: Local MongoDB (requires replica set for transactions)
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Windows — download from https://www.mongodb.com/try/download/community

# Start as replica set (required for transactions):
mongod --replSet rs0 --dbpath /data/db

# In a new terminal, initialize replica set (one time only):
mongosh --eval "rs.initiate()"
```
Local connection string: `mongodb://localhost:27017/prowider?replicaSet=rs0`

---

## Step 2 — Clone / set up project folders

```bash
# Create project folder
mkdir prowider
cd prowider

# You need two subfolders: backend/ and frontend/
# (Already set up if you downloaded the project)
```

---

## Step 3 — Set up the Backend

```bash
cd backend
npm install
```

This installs: `express`, `mongoose`, `cors`, `dotenv`, `nodemon`

### Configure environment variables

Edit `backend/.env` and replace the MongoDB URI:

```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/prowider
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Seed the database (insert 8 providers)

```bash
npm run seed
```

Expected output:
```
Connecting to MongoDB...
Connected.
Cleared existing data.
Seeded 8 providers successfully.
Done. You can now start the server.
```

### Start the backend server

```bash
npm run dev
```

Expected output:
```
✅ MongoDB connected
✅ Server running at http://localhost:5000
```

Test it's working:
```bash
curl http://localhost:5000/api/health
# → {"status":"ok","dbState":"connected"}
```

---

## Step 4 — Set up the Frontend

Open a **new terminal window** (keep backend running):

```bash
cd frontend
npm install
```

This installs: `react`, `react-dom`, `react-router-dom`, `axios`, `vite`

### Start the frontend

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

## Step 5 — Verify everything works

### Test 1: Submit a lead
1. Go to http://localhost:5173/request-service
2. Fill in the form, select a service, submit
3. You should see: "Lead submitted successfully! Assigned to providers: X, Y, Z"

### Test 2: Check the dashboard
1. Go to http://localhost:5173/dashboard
2. You should see 8 provider cards with updated lead counts

### Test 3: Real-time updates
1. Open Dashboard in one browser tab
2. Open Request Service in another tab
3. Submit a new lead — dashboard should update within 1-2 seconds automatically

### Test 4: Duplicate prevention
1. Submit a lead with phone `9999999999` for Service 1
2. Submit the same phone + Service 1 again
3. Should get error: "You have already submitted a lead for this service"
4. Try phone `9999999999` + Service 2 — this should succeed (different service = allowed)

### Test 5: Webhook idempotency
1. Go to http://localhost:5173/test-tools
2. Click "Send same webhook key 5×"
3. Only call 1 should say PROCESSED, calls 2-5 should say SKIPPED

### Test 6: Concurrency
1. Click "Generate 10 concurrent leads"
2. All 10 should be created with valid provider assignments
3. No provider should exceed their monthly quota

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/leads | Submit a new lead |
| GET | /api/leads | Get all leads |
| GET | /api/dashboard | Get all providers with their leads |
| GET | /api/sse | SSE stream for real-time updates |
| POST | /api/webhook/quota-reset | Reset all provider quotas (idempotent) |
| GET | /api/health | Server health check |

### POST /api/leads — body:
```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "city": "Mumbai",
  "serviceType": 1,
  "description": "Need plumbing work"
}
```

### POST /api/webhook/quota-reset — body:
```json
{
  "idempotencyKey": "any-unique-string-uuid"
}
```

---

## Deployment

### Backend → Railway (free)
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo, set root directory to `backend`
3. Add environment variables:
   - `MONGODB_URI` = your Atlas connection string
   - `FRONTEND_URL` = your Vercel frontend URL (set this after deploying frontend)
   - `PORT` = 5000
4. Railway gives you a URL like `https://prowider-backend.up.railway.app`

### Frontend → Vercel (free)
1. Go to https://vercel.com → New Project → Import from GitHub
2. Set root directory to `frontend`
3. Add environment variable:
   - `VITE_API_URL` = `https://prowider-backend.up.railway.app/api`
4. Deploy

---

## Assignment Explanation

### Allocation Algorithm
1. For each new lead, check the mandatory providers (defined per service type)
2. Use MongoDB's atomic `findOneAndUpdate` with a quota check in the filter — this is "compare-and-swap"
3. Fill remaining slots from the fair pool, sorted by `roundRobinIndex` ascending (lowest = least recently assigned = first pick)
4. Increment `roundRobinIndex` on each assignment — this persists in MongoDB across server restarts

### Concurrency Handling
- MongoDB's `findOneAndUpdate` is atomic — the filter condition (quota check) and `$inc` happen together
- Two simultaneous requests cannot both "win" the same provider slot — one gets the update, the other's filter returns null
- All operations run inside a MongoDB session transaction — if anything fails, the entire lead + assignments roll back

### Webhook Idempotency
- Each webhook call requires an `idempotencyKey` in the request body
- We attempt to `insertOne` the key into the `WebhookEvent` collection
- MongoDB's unique index on `idempotencyKey` means the second call throws error 11000
- If 11000, we return `{skipped: true}` without resetting quota
- The key insert and quota reset happen sequentially — no partial states

---

## Project Structure

```
prowider/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Provider.js        ← provider schema + roundRobinIndex
│   │   │   ├── Lead.js            ← unique index on phone+serviceType
│   │   │   ├── LeadAssignment.js  ← links leads to providers
│   │   │   └── WebhookEvent.js    ← idempotency key storage
│   │   ├── routes/
│   │   │   ├── leads.js           ← POST/GET leads + transaction
│   │   │   ├── dashboard.js       ← provider + lead aggregation
│   │   │   ├── sse.js             ← real-time broadcast
│   │   │   └── webhook.js         ← idempotent quota reset
│   │   ├── lib/
│   │   │   └── allocate.js        ← CORE: mandatory + round-robin logic
│   │   ├── seed.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── RequestService.jsx  ← /request-service
    │   │   ├── Dashboard.jsx       ← /dashboard + SSE
    │   │   └── TestTools.jsx       ← /test-tools
    │   ├── api/
    │   │   └── client.js           ← axios instance
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```
