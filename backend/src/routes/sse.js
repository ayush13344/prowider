import express from 'express';

const router = express.Router();

// In-memory set of active SSE response objects
const clients = new Set();

/**
 * Broadcast a JSON event to ALL connected dashboard clients.
 * Called from leads.js and webhook.js after any state change.
 */
export function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

/**
 * GET /api/sse
 * Client opens this once; connection stays open.
 * Every NEW_LEAD or QUOTA_RESET triggers a browser re-fetch of dashboard data.
 */
router.get('/', (req, res) => {
  // Required SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering on Render/Railway
  res.flushHeaders();

  // Send an immediate connected confirmation
  res.write('data: {"type":"connected"}\n\n');

  // Heartbeat every 25s keeps the connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write('data: {"type":"ping"}\n\n');
    } catch {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 25000);

  clients.add(res);

  // Cleanup when client disconnects
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

export default router;
