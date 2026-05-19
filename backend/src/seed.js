import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Provider from './models/Provider.js';
import Lead from './models/Lead.js';
import LeadAssignment from './models/LeadAssignment.js';
import WebhookEvent from './models/WebhookEvent.js';

dotenv.config();

const providers = [
  { providerId: 1, name: 'Provider 1', monthlyQuota: 10, usedQuota: 0, roundRobinIndex: 0 },
  { providerId: 2, name: 'Provider 2', monthlyQuota: 10, usedQuota: 0, roundRobinIndex: 0 },
  { providerId: 3, name: 'Provider 3', monthlyQuota: 10, usedQuota: 0, roundRobinIndex: 0 },
  { providerId: 4, name: 'Provider 4', monthlyQuota: 10, usedQuota: 0, roundRobinIndex: 0 },
  { providerId: 5, name: 'Provider 5', monthlyQuota: 10, usedQuota: 0, roundRobinIndex: 0 },
  { providerId: 6, name: 'Provider 6', monthlyQuota: 10, usedQuota: 0, roundRobinIndex: 0 },
  { providerId: 7, name: 'Provider 7', monthlyQuota: 10, usedQuota: 0, roundRobinIndex: 0 },
  { providerId: 8, name: 'Provider 8', monthlyQuota: 10, usedQuota: 0, roundRobinIndex: 0 },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // Wipe existing data for a clean seed
    await Provider.deleteMany({});
    await Lead.deleteMany({});
    await LeadAssignment.deleteMany({});
    await WebhookEvent.deleteMany({});
    console.log('Cleared existing data.');

    await Provider.insertMany(providers);
    console.log('Seeded 8 providers successfully.');

    await mongoose.disconnect();
    console.log('Done. You can now start the server.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
