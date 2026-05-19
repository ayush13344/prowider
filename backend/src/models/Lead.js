import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    serviceType: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// ── Dedup rule enforced at DB level ──────────────────────────────────────────
// Same phone number cannot submit the same service twice.
// This unique index will throw error code 11000 on duplicate.
leadSchema.index({ phone: 1, serviceType: 1 }, { unique: true });

export default mongoose.model('Lead', leadSchema);
