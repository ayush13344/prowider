import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema(
  {
    providerId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    monthlyQuota: {
      type: Number,
      default: 10,
    },
    usedQuota: {
      type: Number,
      default: 0,
    },
    // Persists fair round-robin state across server restarts
    roundRobinIndex: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Provider', providerSchema);
