# Prowider — Next.js Frontend

This is the **Next.js (App Router)** rewrite of the Prowider frontend.
The Express + MongoDB backend is **unchanged** — only the frontend was migrated.

## Project structure

```
prowider-nextjs/
├── next.config.js           # Dev proxy: /api → localhost:5000
├── .env.local               # NEXT_PUBLIC_API_URL (set in production)
└── src/
    ├── app/
    │   ├── layout.jsx       # Root layout with <NavBar />
    │   ├── globals.css      # Global styles (same design as original)
    │   ├── page.jsx         # Redirects / → /request-service
    │   ├── request-service/
    │   │   └── page.jsx     # Lead submission form
    │   ├── dashboard/
    │   │   └── page.jsx     # Provider dashboard with SSE live updates
    │   └── test-tools/
    │       └── page.jsx     # Webhook / concurrency test panel
    ├── components/
    │   └── NavBar.jsx       # Active-link nav (uses usePathname)
    └── lib/
        └── api.js           # Axios instance (reads NEXT_PUBLIC_API_URL)
```

## Getting started

### 1. Start the backend (unchanged)

```bash
cd prowider/backend
npm install
# make sure .env has your MONGODB_URI
npm run seed     # first time only
npm run dev      # runs on :5000
```

### 2. Start the Next.js frontend

```bash
cd prowider-nextjs
npm install
npm run dev      # runs on :3000
```

Open http://localhost:3000 — Next.js rewrites `/api/*` to `localhost:5000/api/*` in dev.

## Production

Set `NEXT_PUBLIC_API_URL` in your hosting environment:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

Then `npm run build && npm start`.

## What changed vs the Vite version

| Vite (original)              | Next.js (this version)                         |
|------------------------------|------------------------------------------------|
| `vite.config.js` proxy       | `next.config.js` rewrites (dev only)           |
| `react-router-dom`           | Next.js App Router (`/app` directory)          |
| `import.meta.env.VITE_*`     | `process.env.NEXT_PUBLIC_*`                    |
| `ReactDOM.createRoot`        | Handled by Next.js internals                   |
| `<BrowserRouter>` + routes   | File-based routing in `src/app/`               |
| `NavLink` active class       | `usePathname()` + manual `className`           |
| `src/index.css`              | `src/app/globals.css` (imported in layout)     |
| `'use client'` not needed    | Added to all interactive components            |
