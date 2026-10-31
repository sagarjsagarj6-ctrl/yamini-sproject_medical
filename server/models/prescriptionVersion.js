import mongoose from 'mongoose';

const prescriptionVersionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  prescriptionId: { type: String, required: true, index: true },
  version: { type: Number, required: true },
  changedBy: { type: String, required: true },
  changeType: { type: String, enum: ['CREATED', 'UPDATED', 'STATUS_CHANGED'], required: true },
  reason: { type: String, trim: true, maxlength: 500 },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

prescriptionVersionSchema.index({ prescriptionId: 1, version: 1 }, { unique: true });

export default mongoose.models.PrescriptionVersion || mongoose.model('PrescriptionVersion', prescriptionVersionSchema);
