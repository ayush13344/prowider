import express from 'express';
import Provider from '../models/Provider.js';
import LeadAssignment from '../models/LeadAssignment.js';
import Lead from '../models/Lead.js';

const router = express.Router();

// ── GET /api/dashboard ────────────────────────────────────────────────────────
// Returns all 8 providers, each with:
//   - remainingQuota
//   - leadsCount (how many leads assigned this month)
//   - leads[] (full lead details, newest first)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const providers = await Provider.find().sort({ providerId: 1 }).lean();

    const result = await Promise.all(
      providers.map(async (provider) => {
        // Find all assignments for this provider and populate lead details
        const assignments = await LeadAssignment.find({ providerId: provider.providerId })
          .populate({ path: 'leadId', model: Lead })
          .sort({ createdAt: -1 })
          .lean();

        // Filter out any orphaned assignments where lead was deleted
        const validLeads = assignments
          .filter((a) => a.leadId !== null)
          .map((a) => ({
            _id: a.leadId._id,
            name: a.leadId.name,
            phone: a.leadId.phone,
            city: a.leadId.city,
            serviceType: a.leadId.serviceType,
            description: a.leadId.description,
            createdAt: a.leadId.createdAt,
            assignedAt: a.createdAt,
          }));

        return {
          providerId: provider.providerId,
          name: provider.name,
          monthlyQuota: provider.monthlyQuota,
          usedQuota: provider.usedQuota,
          remainingQuota: provider.monthlyQuota - provider.usedQuota,
          leadsCount: validLeads.length,
          leads: validLeads,
        };
      })
    );

    return res.json(result);
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
