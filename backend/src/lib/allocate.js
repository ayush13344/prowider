import Provider from '../models/Provider.js';
import LeadAssignment from '../models/LeadAssignment.js';
 
const MANDATORY = {
  1: [1],
  2: [5],
  3: [1, 4],
};
 
const POOL = {
  1: [2, 3, 4],
  2: [6, 7, 8],
  3: [2, 3, 5, 6, 7, 8],
};
 
// Retry wrapper for transient write conflicts (Atlas M0 doesn't support transactions)
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isTransient =
        err.errorLabelSet?.has('TransientTransactionError') ||
        err.code === 112;
      if (isTransient && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 100 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}
 
async function _assignProviders(leadId, serviceType) {
  const mandatory = MANDATORY[serviceType] || [];
  const pool = POOL[serviceType] || [];
  const totalNeeded = 3;
  const poolSlotsNeeded = totalNeeded - mandatory.length;
 
  const assigned = [];
 
  // Step 1: Mandatory providers
  for (const pid of mandatory) {
    const updated = await Provider.findOneAndUpdate(
      {
        providerId: pid,
        $expr: { $lt: ['$usedQuota', '$monthlyQuota'] },
      },
      { $inc: { usedQuota: 1, roundRobinIndex: 1 } },
      { new: true }
    );
    if (updated) assigned.push(pid);
  }
 
  // Step 2: Round-robin pool
  const poolProviders = await Provider.find({
    providerId: { $in: pool },
    $expr: { $lt: ['$usedQuota', '$monthlyQuota'] },
  }).sort({ roundRobinIndex: 1, providerId: 1 });
 
  const picks = poolProviders.slice(0, poolSlotsNeeded);
 
  for (const p of picks) {
    const updated = await Provider.findOneAndUpdate(
      {
        providerId: p.providerId,
        $expr: { $lt: ['$usedQuota', '$monthlyQuota'] },
      },
      { $inc: { usedQuota: 1, roundRobinIndex: 1 } },
      { new: true }
    );
    if (updated) assigned.push(p.providerId);
  }
 
  // Step 3: Persist assignments
  if (assigned.length > 0) {
    const docs = assigned.map((pid) => ({ leadId, providerId: pid }));
    await LeadAssignment.insertMany(docs, { ordered: false });
  }
 
  return assigned;
}
 
export async function assignProviders(leadId, serviceType) {
  return withRetry(() => _assignProviders(leadId, serviceType));
}