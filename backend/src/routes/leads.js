import express from 'express';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import { assignProviders } from '../lib/allocate.js';
import { broadcast } from './sse.js';

const router = express.Router();

// ── POST /api/leads ───────────────────────────────────────────────────────────
// Creates a lead and auto-assigns exactly 3 providers.
// Entire operation runs inside a MongoDB session transaction:
//   - If lead creation fails (e.g. duplicate) → nothing is assigned
//   - If assignment fails → lead is NOT saved either
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, phone, city, serviceType, description } = req.body;

  // Basic validation
  if (!name || !phone || !city || !serviceType || !description) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (![1, 2, 3].includes(Number(serviceType))) {
    return res.status(400).json({ error: 'serviceType must be 1, 2, or 3.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create the lead inside the transaction
    const [lead] = await Lead.create(
      [
        {
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          serviceType: Number(serviceType),
          description: description.trim(),
        },
      ],
      { session }
    );

    // Assign providers inside the same transaction
    const assignedProviders = await assignProviders(lead._id, Number(serviceType), session);

    await session.commitTransaction();
    session.endSession();

    // Notify all open dashboards via SSE (fire-and-forget, outside transaction)
    broadcast({
      type: 'NEW_LEAD',
      leadId: lead._id.toString(),
      assignedProviders,
      serviceType: Number(serviceType),
    });

    return res.status(201).json({
      success: true,
      leadId: lead._id,
      assignedProviders,
      message: `Lead created and assigned to providers: ${assignedProviders.join(', ')}`,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // MongoDB duplicate key error (code 11000) = dedup rule triggered
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'You have already submitted a lead for this service with this phone number.',
      });
    }

    console.error('Lead creation error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// ── GET /api/leads ────────────────────────────────────────────────────────────
// Returns all leads, newest first. Used by dashboard.
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }).lean();
    return res.json(leads);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
