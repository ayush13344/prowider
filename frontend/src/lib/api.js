import axios from 'axios';

// In dev: Next.js rewrites /api → http://localhost:5000/api (see next.config.js)
// In prod: NEXT_PUBLIC_API_URL = https://your-backend.railway.app
const baseURL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
