import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    // The caller sends a unique key; we store it so repeated calls are ignored
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('WebhookEvent', webhookEventSchema);
