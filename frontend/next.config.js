/** @type {import('next').NextConfig} */
const nextConfig = {
  // In development, API calls to /api are proxied to the Express backend.
  // Set NEXT_PUBLIC_API_URL in .env.local for production.
  async rewrites() {
    // Only active in dev — in prod NEXT_PUBLIC_API_URL points at the real backend
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: 'http://localhost:5000/api/:path*',
          },
        ]
      : [];
  },
};

module.exports = nextConfig;
