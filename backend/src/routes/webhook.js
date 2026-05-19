import express from 'express';
import Provider from '../models/Provider.js';
import WebhookEvent from '../models/WebhookEvent.js';
import { broadcast } from './sse.js';

const router = express.Router();

// ── POST /api/webhook/quota-reset ─────────────────────────────────────────────
// Simulates a payment gateway confirming a provider subscription renewal.
// Resets ALL provider usedQuota back to 0.
//
// IDEMPOTENCY: The caller must send a unique idempotencyKey.
// If the same key is sent again, the reset is skipped — no duplicate effect.
// This is enforced by a unique index on WebhookEvent.idempotencyKey.
//
// HOW TO TEST IDEMPOTENCY:
//   Send the same idempotencyKey 5 times → only the first call resets quota.
//   The other 4 return { skipped: true }.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/quota-reset', async (req, res) => {
  const { idempotencyKey } = req.body;

  if (!idempotencyKey || typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    return res.status(400).json({
      error: 'idempotencyKey is required in the request body.',
    });
  }

  // Try to insert the key. If it already exists, MongoDB throws error 11000.
  try {
    await WebhookEvent.create({ idempotencyKey: idempotencyKey.trim() });
  } catch (err) {
    if (err.code === 11000) {
      // Key already used — safe to ignore, return idempotent response
      return res.json({
        skipped: true,
        reason: 'This idempotency key has already been processed.',
      });
    }
    return res.status(500).json({ error: err.message });
  }

  // Key was fresh — proceed with quota reset
  try {
    await Provider.updateMany({}, { $set: { usedQuota: 0 } });

    // Notify all open dashboards to refresh
    broadcast({ type: 'QUOTA_RESET' });

    return res.json({
      success: true,
      message: 'All provider quotas have been reset to 10.',
    });
  } catch (err) {
    console.error('Quota reset error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
