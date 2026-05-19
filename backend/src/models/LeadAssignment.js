import mongoose from 'mongoose';

const leadAssignmentSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    providerId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// A provider cannot receive the same lead twice
leadAssignmentSchema.index({ leadId: 1, providerId: 1 }, { unique: true });

// Fast lookup: all leads for a given provider
leadAssignmentSchema.index({ providerId: 1 });

export default mongoose.model('LeadAssignment', leadAssignmentSchema);
